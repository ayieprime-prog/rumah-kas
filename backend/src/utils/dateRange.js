// Every date column in this app is written as a UTC-midnight instant
// (`new Date('YYYY-MM-DD')` parses as UTC, and monthOf()-style helpers use
// toISOString().slice(...)). Building a month's [start, end) range from
// local-time Date components (getFullYear()/getMonth(), or a component
// constructor like `new Date(year, month, 0)`) mixes timezone frames with
// that UTC storage convention: on any server not running in UTC, this
// silently drops or misattributes transactions dated on the last day (or
// first few hours) of a month. These helpers build both ends of the range
// in UTC, and use an exclusive upper bound (first instant of the next
// month) so there's no separate "last day, but what time?" off-by-one to
// get wrong.

/** @param {string} monthStr "YYYY-MM" */
function getMonthRange(monthStr) {
  const [year, month] = monthStr.split('-').map(Number);
  const gte = new Date(Date.UTC(year, month - 1, 1));
  const lt = new Date(Date.UTC(year, month, 1));
  return { gte, lt };
}

/** "YYYY-MM" for the current month, in UTC (matches monthOf()-style storage). */
function currentMonthString() {
  return new Date().toISOString().slice(0, 7);
}

/** "YYYY-MM" for the month after the given one, correctly rolling over December -> next January. */
function nextMonthString(monthStr) {
  const [year, month] = monthStr.split('-').map(Number);
  const next = new Date(Date.UTC(year, month, 1));
  return next.toISOString().slice(0, 7);
}

/**
 * Builds a Date for (year, monthIndex, day), clamping day to that month's
 * actual last day instead of letting it overflow into the next month (the
 * native Date behavior for e.g. new Date(2026, 1, 31) in February).
 */
function clampDay(year, monthIndex, day) {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return new Date(year, monthIndex, Math.min(day, lastDay));
}

module.exports = { getMonthRange, currentMonthString, nextMonthString, clampDay };
