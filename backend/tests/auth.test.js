import test from 'node:test';
import assert from 'node:assert/strict';
import { requireAuth, requireRole } from '../src/middleware/auth.js';

function response() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('auth middleware rejects unauthenticated requests when bypass is disabled', () => {
  const previous = process.env.LOCAL_AUTH_BYPASS;
  process.env.LOCAL_AUTH_BYPASS = 'false';
  const res = response();
  let continued = false;
  requireAuth({}, res, () => { continued = true; });
  assert.equal(res.statusCode, 401);
  assert.equal(continued, false);
  if (previous === undefined) delete process.env.LOCAL_AUTH_BYPASS;
  else process.env.LOCAL_AUTH_BYPASS = previous;
});

test('role middleware rejects users without the required role', () => {
  const res = response();
  requireRole('admin')({ user: { role: 'patient' } }, res, () => assert.fail('must not continue'));
  assert.equal(res.statusCode, 403);
});
