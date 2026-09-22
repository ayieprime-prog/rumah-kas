// Records who did what to shared household data - useful for a 2-person
// household to answer "who deleted this expense?" without guessing.
// `client` can be the top-level PrismaClient or a $transaction callback's
// `tx`, so callers can log atomically alongside the mutation itself.
async function logAudit(client, { userId, householdId, action, entity, entityId, summary }) {
  try {
    await client.auditLog.create({
      data: { userId, householdId, action, entity, entityId, summary }
    });
  } catch (error) {
    // Never let audit logging break the actual operation
    console.error('Audit log write failed:', error.message);
  }
}

module.exports = { logAudit };
