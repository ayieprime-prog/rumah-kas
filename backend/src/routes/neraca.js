const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { cacheMiddleware, cacheKeys } = require('../utils/caching');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/neraca
 * Get balance sheet (Neraca Keluarga) as of a specific date
 *
 * Query params:
 *   - date: YYYY-MM-DD (defaults to today)
 *   - scope: KELUARGA or PRIBADI (optional, defaults to all)
 *
 * Returns hierarchical balance sheet grouped by:
 *   - Asset Class (LIQUID, INVESTMENT, RECEIVABLE, DEBT)
 *   - Account Type (ASSET, LIABILITY, EQUITY)
 */
router.get(
  '/',
  cacheMiddleware(
    (req) => cacheKeys.neraca(req.householdId),
    60
  ),
  async (req, res) => {
    try {
      const { householdId } = req;
      const { date, scope } = req.query;

      // Parse date or use today
      const targetDate = date ? new Date(date) : new Date();
      const dateStr = targetDate.toISOString().slice(0, 10);

      // Get all wallets for household, filtered by scope if provided
      const walletQuery = {
        where: {
          householdId,
          isActive: true,
          ...(scope && { scope })
        },
        orderBy: [
          { displayOrder: 'asc' },
          { createdAt: 'asc' }
        ]
      };

      const wallets = await prisma.wallet.findMany(walletQuery);

      if (!wallets || wallets.length === 0) {
        return res.json({
          date: dateStr,
          totalAssets: 0,
          totalLiabilities: 0,
          totalEquity: 0,
          totalWealth: 0,
          assets: [],
          liabilities: [],
          equity: [],
          summary: {
            byAccountType: {
              ASSET: { total: 0, count: 0 },
              LIABILITY: { total: 0, count: 0 },
              EQUITY: { total: 0, count: 0 }
            },
            byAssetClass: {}
          }
        });
      }

      // Group wallets by accountType and assetClass
      const grouped = {
        ASSET: {},
        LIABILITY: {},
        EQUITY: {}
      };

      let totalAssets = 0;
      let totalLiabilities = 0;
      let totalEquity = 0;

      for (const wallet of wallets) {
        const accountType = wallet.accountType || 'ASSET';
        const assetClass = wallet.assetClass || 'LIQUID';

        if (!grouped[accountType]) {
          grouped[accountType] = {};
        }

        if (!grouped[accountType][assetClass]) {
          grouped[accountType][assetClass] = [];
        }

        grouped[accountType][assetClass].push({
          id: wallet.id,
          name: wallet.name,
          type: wallet.type,
          balance: wallet.balance,
          scope: wallet.scope,
          icon: wallet.icon,
          displayOrder: wallet.displayOrder || 0
        });

        // Accumulate totals
        if (accountType === 'ASSET') {
          totalAssets += wallet.balance;
        } else if (accountType === 'LIABILITY') {
          totalLiabilities += wallet.balance;
        } else if (accountType === 'EQUITY') {
          totalEquity += wallet.balance;
        }
      }

      // Format assets by class
      const assets = formatAssetsByClass(grouped.ASSET);
      const liabilities = formatAssetsByClass(grouped.LIABILITY);
      const equity = formatAssetsByClass(grouped.EQUITY);

      // Calculate totals
      const totalWealth = totalAssets - totalLiabilities + totalEquity;

      // Build summary
      const summary = {
        byAccountType: {
          ASSET: {
            total: totalAssets,
            count: wallets.filter(w => (w.accountType || 'ASSET') === 'ASSET').length
          },
          LIABILITY: {
            total: totalLiabilities,
            count: wallets.filter(w => (w.accountType || 'ASSET') === 'LIABILITY').length
          },
          EQUITY: {
            total: totalEquity,
            count: wallets.filter(w => (w.accountType || 'ASSET') === 'EQUITY').length
          }
        },
        byAssetClass: buildAssetClassSummary(wallets)
      };

      res.json({
        date: dateStr,
        scope: scope || 'ALL',
        totalAssets,
        totalLiabilities,
        totalEquity,
        totalWealth,
        assets,
        liabilities,
        equity,
        summary
      });
    } catch (error) {
      console.error('Neraca error:', error);
      res.status(500).json({ error: 'Failed to fetch neraca' });
    }
  }
);

/**
 * Format wallets by asset class with labels and totals
 */
function formatAssetsByClass(grouped) {
  const result = [];
  const classLabels = {
    LIQUID: 'Kas & Setara Kas',
    INVESTMENT: 'Investasi',
    RECEIVABLE: 'Piutang',
    DEBT: 'Utang'
  };

  for (const [assetClass, wallets] of Object.entries(grouped)) {
    if (wallets.length === 0) continue;

    const total = wallets.reduce((sum, w) => sum + w.balance, 0);
    result.push({
      assetClass,
      label: classLabels[assetClass] || assetClass,
      total,
      walletCount: wallets.length,
      wallets: wallets.sort((a, b) => a.displayOrder - b.displayOrder)
    });
  }

  return result;
}

/**
 * Build summary by asset class
 */
function buildAssetClassSummary(wallets) {
  const summary = {};

  for (const wallet of wallets) {
    const assetClass = wallet.assetClass || 'LIQUID';

    if (!summary[assetClass]) {
      summary[assetClass] = {
        total: 0,
        count: 0
      };
    }

    summary[assetClass].total += wallet.balance;
    summary[assetClass].count += 1;
  }

  return summary;
}

/**
 * GET /api/neraca/summary
 * Quick summary (total wealth only, useful for dashboard widget)
 */
router.get(
  '/summary',
  cacheMiddleware(
    (req) => cacheKeys.neracaSummary(req.householdId),
    60
  ),
  async (req, res) => {
    try {
      const { householdId } = req;
      const { scope } = req.query;

      const wallets = await prisma.wallet.findMany({
        where: {
          householdId,
          isActive: true,
          ...(scope && { scope })
        }
      });

      let totalAssets = 0;
      let totalLiabilities = 0;

      for (const wallet of wallets) {
        const accountType = wallet.accountType || 'ASSET';
        if (accountType === 'ASSET') {
          totalAssets += wallet.balance;
        } else if (accountType === 'LIABILITY') {
          totalLiabilities += wallet.balance;
        }
      }

      const totalWealth = totalAssets - totalLiabilities;

      res.json({
        date: new Date().toISOString().slice(0, 10),
        totalWealth,
        totalAssets,
        totalLiabilities,
        netWealth: totalWealth,
        walletCount: wallets.length
      });
    } catch (error) {
      console.error('Neraca summary error:', error);
      res.status(500).json({ error: 'Failed to fetch neraca summary' });
    }
  }
);

module.exports = router;
