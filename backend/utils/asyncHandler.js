// utils/asyncHandler.js
// Wraps async route handlers so thrown errors / rejected promises are forwarded
// to Express's error middleware instead of crashing the process.

export default function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
