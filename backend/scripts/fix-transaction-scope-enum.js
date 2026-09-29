// One-off repair for a second, deeper issue the add_pos_scope incident
// uncovered: Expense.scope and Income.scope in production are backed by
// a real Postgres enum type "TransactionScope" (a leftover from an
// earlier, abandoned attempt at this same feature that was applied
// directly to the database, never tracked in prisma/migrations, and
// never fully reverted at the DB level even though schema.prisma and
// the app code moved on to plain KELUARGA/PRIBADI strings). Every
// Expense/Income create or update that passes scope currently fails
// with "invalid input value for enum TransactionScope" - this is a
// live 500 in production right now, not just in the dummy-data seeder
// that surfaced it.
//
// This converts both columns from the enum to plain text (matching
// Wallet.scope and schema.prisma), remapping any existing enum values
// to the KELUARGA/PRIBADI vocabulary the app actually uses, then drops
// the now-unused enum type. Idempotent: safe to run again if the columns
// are already text.
const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  try {
    const cols = await prisma.$queryRawUnsafe(
      "SELECT table_name, column_name, udt_name FROM information_schema.columns WHERE table_name IN ('Expense','Income','Wallet') AND column_name='scope'"
    )
    console.log('[fix-scope-enum] column types:', JSON.stringify(cols))

    const enumCols = cols.filter((c) => c.udt_name === 'TransactionScope')
    if (enumCols.length === 0) {
      console.log('[fix-scope-enum] no enum-backed scope columns found, nothing to do')
      return
    }

    const labels = await prisma.$queryRawUnsafe(
      "SELECT enumlabel FROM pg_enum WHERE enumtypid = 'public.\"TransactionScope\"'::regtype ORDER BY enumsortorder"
    )
    console.log('[fix-scope-enum] existing TransactionScope labels:', JSON.stringify(labels))

    const labelSet = new Set(labels.map((l) => l.enumlabel))
    // Map whatever the abandoned attempt used to the vocabulary the app
    // actually writes today. KELUARGA/PRIBADI already being valid labels
    // means nothing to remap for that value.
    const valueMap = {
      FAMILY: 'KELUARGA',
      PERSONAL: 'PRIBADI',
      KELUARGA: 'KELUARGA',
      PRIBADI: 'PRIBADI'
    }

    for (const { table_name: table } of enumCols) {
      console.log(`[fix-scope-enum] converting ${table}.scope from enum to text`)
      await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ALTER COLUMN "scope" DROP DEFAULT`)
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "${table}" ALTER COLUMN "scope" TYPE TEXT USING (
          CASE "scope"::text
            ${Object.entries(valueMap).map(([from, to]) => `WHEN '${from}' THEN '${to}'`).join('\n            ')}
            ELSE 'KELUARGA'
          END
        )`
      )
      await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ALTER COLUMN "scope" SET DEFAULT 'KELUARGA'`)
      console.log(`[fix-scope-enum] ${table}.scope is now text`)
    }

    const stillUsed = await prisma.$queryRawUnsafe(
      "SELECT table_name, column_name FROM information_schema.columns WHERE udt_name = 'TransactionScope'"
    )
    if (stillUsed.length === 0) {
      console.log('[fix-scope-enum] dropping now-unused TransactionScope enum type')
      await prisma.$executeRawUnsafe('DROP TYPE IF EXISTS "TransactionScope"')
    } else {
      console.log('[fix-scope-enum] TransactionScope still referenced elsewhere, leaving it:', JSON.stringify(stillUsed))
    }

    console.log('[fix-scope-enum] done')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error('[fix-scope-enum] FAILED', err)
  process.exit(1)
})
