export function notConfigured(_req, res) {
  res.status(501).json({ error: { message: 'Admin workflows are not configured.' } });
}
