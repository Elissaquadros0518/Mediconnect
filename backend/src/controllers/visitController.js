export function notConfigured(_req, res) {
  res.status(501).json({ error: { message: 'Visit record workflows are not configured.' } });
}
