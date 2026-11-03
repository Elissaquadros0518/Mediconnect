function sanitizeLogText(value, maxLength = 240) {
  return String(value ?? '')
    .replace(/https?:\/\/[^\s"'<>]+/gi, '[url]')
    .replace(/\bBearer\s+[^\s,;]+/gi, 'Bearer [redacted]')
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[token]')
    .replace(/\bazure\/patients\/[^\s"'<>?]+/gi, '[blob-path]')
    .replace(/\b(?:authorization|access[_-]?token|refresh[_-]?token|client[_-]?secret|password|sig|sas|token)\s*[:=]\s*[^\s,;&]+(?:&[^\s,;]+)*/gi, '[credential-redacted]')
    .replace(/\?[^\s"'<>]*/g, '?[redacted]')
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '[id]')
    .replace(/[\r\n\t]+/g, ' ')
    .slice(0, maxLength);
}

function getErrorRecord(error) {
  const source = error && typeof error === 'object' ? error : {};
  const rawName = typeof source.name === 'string'
    ? source.name
    : (error == null ? 'MissingError' : (typeof error === 'string' ? 'ThrownString' : 'ThrownValue'));
  const rawMessage = typeof source.message === 'string'
    ? source.message
    : (typeof error === 'string' ? error : 'No error message available');
  const safeCode = typeof source.code === 'string' && /^[A-Za-z0-9_.-]{1,64}$/.test(source.code)
    ? source.code
    : undefined;
  const rawStatus = source.statusCode ?? source.status;
  const status = Number.isInteger(rawStatus) && rawStatus >= 100 && rawStatus <= 599 ? rawStatus : undefined;

  return {
    name: sanitizeLogText(rawName, 80),
    message: sanitizeLogText(rawMessage),
    ...(safeCode ? { code: safeCode } : {}),
    ...(status ? { status } : {})
  };
}

export const errorHandler = (err, req, res, next) => {
  const errorRecord = getErrorRecord(err);
  console.error('[http-error]', JSON.stringify({ operation: 'unhandled_request', ...errorRecord }));

  const rawStatus = err && typeof err === 'object' ? (err.statusCode ?? err.status) : undefined;
  const statusCode = Number.isInteger(rawStatus) && rawStatus >= 400 && rawStatus <= 599 ? rawStatus : 500;
  const message = statusCode >= 500 ? 'Internal Server Error' : errorRecord.message;

  res.status(statusCode).json({
    success: false,
    error: message
  });
};
