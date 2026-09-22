const notFound = (req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
};

const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);

  const status = err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';
  // Unexpected (500) errors can carry internal details (Prisma/DB messages,
  // file paths) that shouldn't reach the client in production - routes that
  // want a specific message already set err.status and a safe err.message.
  const message = (status === 500 && isProd)
    ? 'Terjadi kesalahan pada server'
    : (err.message || 'Internal server error');

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { notFound, errorHandler };
