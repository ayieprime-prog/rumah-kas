// One-off repair for the 20260929095753_add_pos_scope migration, which
// failed in production with P3018 ("column scope of relation Expense
// already exists") even though it was the migration's first-ever attempt.
// The DB had a pre-existing "scope" column on Expense from an earlier
// mishap, which aborted the migration's transaction before it could add
// "scope" to Income/Wallet or record itself as applied - leaving
// _prisma_migrations pointing at a failed run and blocking all further
// `prisma migrate deploy` calls with P3009.
//
// This script makes the schema match what the migration intended
// (idempotently - safe to run more than once) and then marks the
// migration as resolved so `prisma migrate deploy` can proceed again.
// Safe to leave wired into predeploy: once resolved, it no-ops.
const { execSync } = require('child_process')
const { PrismaClient } = require('@prisma/client')

const MIGRATION_NAME = '20260929095753_add_pos_scope'

async function main() {
  const prisma = new PrismaClient()
  try {
    const cols = await prisma.$queryRawUnsafe(
      "SELECT table_name, column_name FROM information_schema.columns WHERE table_name IN ('Expense','Income','Wallet') AND column_name='scope'"
    )
    console.log('[fix-pos-scope] existing scope columns:', JSON.stringify(cols))
    const has = (t) => cols.some((c) => c.table_name === t)

    for (const table of ['Expense', 'Income', 'Wallet']) {
      if (!has(table)) {
        await prisma.$executeRawUnsafe(
          `ALTER TABLE "${table}" ADD COLUMN "scope" TEXT NOT NULL DEFAULT 'KELUARGA'`
        )
        console.log(`[fix-pos-scope] added scope column to ${table}`)
      }
    }

    const migrationRows = await prisma.$queryRawUnsafe(
      'SELECT finished_at, rolled_back_at FROM _prisma_migrations WHERE migration_name = $1',
      MIGRATION_NAME
    )
    const row = migrationRows[0]
    const alreadyResolved = row && (row.finished_at || row.rolled_back_at)

    if (alreadyResolved) {
      console.log('[fix-pos-scope] migration already resolved, nothing to do')
      return
    }

    if (!row) {
      console.log('[fix-pos-scope] no failed migration row found, nothing to resolve')
      return
    }

    console.log('[fix-pos-scope] resolving failed migration as applied')
    execSync(`npx prisma migrate resolve --applied ${MIGRATION_NAME}`, { stdio: 'inherit' })
    console.log('[fix-pos-scope] done')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error('[fix-pos-scope] FAILED', err)
  process.exit(1)
})
