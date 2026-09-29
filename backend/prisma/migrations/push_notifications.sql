-- Push Notification Schema

-- PushSubscription: Store user device subscriptions
CREATE TABLE IF NOT EXISTS "PushSubscription" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  subscription TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "PushSubscription_userId_idx" ON "PushSubscription"("userId");
CREATE INDEX IF NOT EXISTS "PushSubscription_active_idx" ON "PushSubscription"(active);

-- NotificationPreference: Store user notification settings
CREATE TABLE IF NOT EXISTS "NotificationPreference" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL UNIQUE,
  "expenseReminders" BOOLEAN DEFAULT true,
  "budgetAlerts" BOOLEAN DEFAULT true,
  "billDueNotifications" BOOLEAN DEFAULT true,
  "goalMilestones" BOOLEAN DEFAULT true,
  "weeklyReport" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "NotificationPreference_userId_idx" ON "NotificationPreference"("userId");

-- NotificationLog: Store sent notification history
CREATE TABLE IF NOT EXISTS "NotificationLog" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT NOT NULL,
  sent INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  "subscriptionCount" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "NotificationLog_userId_idx" ON "NotificationLog"("userId");
CREATE INDEX IF NOT EXISTS "NotificationLog_type_idx" ON "NotificationLog"(type);
CREATE INDEX IF NOT EXISTS "NotificationLog_createdAt_idx" ON "NotificationLog"("createdAt");

-- Schedule: Store notification schedules (for weekly reports, etc)
CREATE TABLE IF NOT EXISTS "NotificationSchedule" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  type TEXT NOT NULL,
  "scheduleDay" INTEGER,
  "scheduleTime" TEXT,
  enabled BOOLEAN DEFAULT true,
  "lastSentAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "NotificationSchedule_userId_idx" ON "NotificationSchedule"("userId");
CREATE INDEX IF NOT EXISTS "NotificationSchedule_type_idx" ON "NotificationSchedule"(type);
