// Centralized input validation to prevent injection, DoS, and type errors.
// Apply these validators at route entry points before using any req.body/req.query values.

// Sanitize and validate string: trim, check length, ensure type.
function validateString(value, fieldName, options = {}) {
  const { minLength = 1, maxLength = 500, required = true } = options;

  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new Error(`${fieldName} is required`);
    }
    return null;
  }

  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }

  const trimmed = value.trim();
  if (trimmed.length < minLength) {
    throw new Error(`${fieldName} must be at least ${minLength} characters`);
  }
  if (trimmed.length > maxLength) {
    throw new Error(`${fieldName} must not exceed ${maxLength} characters`);
  }

  return trimmed;
}

// Validate a numeric amount: must be positive, finite, within reasonable bounds.
function validateAmount(value, fieldName, options = {}) {
  const { min = 0.01, max = 999999999.99, required = true } = options;

  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new Error(`${fieldName} is required`);
    }
    return null;
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (!Number.isFinite(num)) {
    throw new Error(`${fieldName} must be a valid number`);
  }
  if (num < min) {
    throw new Error(`${fieldName} must be at least ${min}`);
  }
  if (num > max) {
    throw new Error(`${fieldName} must not exceed ${max}`);
  }

  return num;
}

// Validate a date: must be valid date string, optionally within bounds.
function validateDate(value, fieldName, options = {}) {
  const { required = true, minDate = null, maxDate = null } = options;

  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new Error(`${fieldName} is required`);
    }
    return null;
  }

  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }

  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new Error(`${fieldName} must be a valid date`);
  }

  if (minDate && date < new Date(minDate)) {
    throw new Error(`${fieldName} must not be before ${minDate}`);
  }
  if (maxDate && date > new Date(maxDate)) {
    throw new Error(`${fieldName} must not be after ${maxDate}`);
  }

  return date;
}

// Validate date is in YYYY-MM format (for month queries).
function validateMonth(value, fieldName, options = {}) {
  const { required = true } = options;

  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new Error(`${fieldName} is required`);
    }
    return null;
  }

  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }

  if (!/^\d{4}-\d{2}$/.test(value)) {
    throw new Error(`${fieldName} must be in YYYY-MM format`);
  }

  // Also validate that the month actually exists.
  const [year, month] = value.split('-').map(Number);
  if (month < 1 || month > 12) {
    throw new Error(`${fieldName} month must be between 1 and 12`);
  }

  return value;
}

// Validate an integer within bounds (for IDs, pagination params, etc).
function validateInteger(value, fieldName, options = {}) {
  const { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, required = true } = options;

  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new Error(`${fieldName} is required`);
    }
    return null;
  }

  const num = typeof value === 'string' ? parseInt(value, 10) : value;

  if (!Number.isInteger(num)) {
    throw new Error(`${fieldName} must be an integer`);
  }
  if (num < min) {
    throw new Error(`${fieldName} must be at least ${min}`);
  }
  if (num > max) {
    throw new Error(`${fieldName} must not exceed ${max}`);
  }

  return num;
}

// Validate value is one of allowed enum values.
function validateEnum(value, fieldName, allowedValues, options = {}) {
  const { required = true } = options;

  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new Error(`${fieldName} is required`);
    }
    return null;
  }

  if (!allowedValues.includes(value)) {
    throw new Error(`${fieldName} must be one of: ${allowedValues.join(', ')}`);
  }

  return value;
}

// Validate a hex color code (e.g., #FF6B6B).
function validateHexColor(value, fieldName, options = {}) {
  const { required = true } = options;

  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new Error(`${fieldName} is required`);
    }
    return null;
  }

  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }

  if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
    throw new Error(`${fieldName} must be a valid hex color (e.g., #FF6B6B)`);
  }

  return value;
}

// Validate an icon name is from a safe list (prevent arbitrary strings).
function validateIconName(value, fieldName, options = {}) {
  const ALLOWED_ICONS = [
    'folder', 'home', 'utensils', 'briefcase', 'heart', 'shopping-cart',
    'trending-up', 'trending-down', 'calendar', 'clock', 'user', 'settings',
    'edit', 'trash', 'plus', 'minus', 'check', 'x', 'filter', 'search',
    'bar-chart', 'pie-chart', 'gift', 'zap', 'alert', 'info'
  ];
  const { required = false } = options;

  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new Error(`${fieldName} is required`);
    }
    return 'folder'; // safe default
  }

  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }

  const validated = validateString(value, fieldName, { maxLength: 50, required: false });
  if (!validated) {
    return 'folder';
  }

  if (!ALLOWED_ICONS.includes(validated)) {
    throw new Error(`${fieldName} must be one of: ${ALLOWED_ICONS.join(', ')}`);
  }

  return validated;
}

// Validate pagination params safely (limit & offset for GET endpoints).
function validatePagination(query) {
  let limit = 50;
  let offset = 0;

  if (query.limit !== undefined) {
    limit = validateInteger(query.limit, 'limit', { min: 1, max: 100, required: false });
  }
  if (query.offset !== undefined) {
    offset = validateInteger(query.offset, 'offset', { min: 0, max: 100000, required: false });
  }

  return { limit, offset };
}

module.exports = {
  validateString,
  validateAmount,
  validateDate,
  validateMonth,
  validateInteger,
  validateEnum,
  validateHexColor,
  validateIconName,
  validatePagination
};
