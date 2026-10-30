import assert from 'assert';

console.log('--- STARTING MEDICONNECT AUTH & ROLE ROUTING VERIFICATION SUITE ---\n');

let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passCount++;
  } catch (err) {
    console.error(`❌ FAIL: ${name}`);
    console.error(`   Error: ${err.message}`);
    failCount++;
  }
}

// --------------------------------------------------------------------------
// 1. REGISTRATION ROLE SANITIZATION & METADATA PREPARATION
// --------------------------------------------------------------------------
function sanitizeRegistrationRole(role) {
  const normalized = (role || 'PATIENT').toUpperCase();
  // Security guard: ordinary registration cannot assign ADMIN
  if (normalized === 'DOCTOR') return 'DOCTOR';
  return 'PATIENT';
}

test('1.1 Doctor registration captures and outputs DOCTOR role', () => {
  const result = sanitizeRegistrationRole('doctor');
  assert.strictEqual(result, 'DOCTOR');
  const upperResult = sanitizeRegistrationRole('DOCTOR');
  assert.strictEqual(upperResult, 'DOCTOR');
});

test('1.2 Patient registration captures and outputs PATIENT role', () => {
  const result = sanitizeRegistrationRole('patient');
  assert.strictEqual(result, 'PATIENT');
});

test('1.3 Admin self-escalation attempt during registration is safely demoted to PATIENT', () => {
  const result = sanitizeRegistrationRole('admin');
  assert.strictEqual(result, 'PATIENT', 'Must never allow self-registering as ADMIN');
  const upperResult = sanitizeRegistrationRole('ADMIN');
  assert.strictEqual(upperResult, 'PATIENT');
  const superResult = sanitizeRegistrationRole('SUPERADMIN');
  assert.strictEqual(superResult, 'PATIENT');
});

// --------------------------------------------------------------------------
// 2. AUTHORITATIVE ROLE RESOLUTION
// --------------------------------------------------------------------------
function resolveAuthoritativeRole(profile, authUser) {
  // Priority 1: PostgreSQL `profiles` table (authoritative)
  // Priority 2: Supabase Auth user_metadata / app_metadata
  // Fallback: 'patient'
  if (profile?.role) {
    return profile.role.toLowerCase();
  }
  const metaRole = authUser?.user_metadata?.role?.toUpperCase();
  if (metaRole === 'DOCTOR') return 'doctor';
  if (authUser?.app_metadata?.role?.toUpperCase() === 'ADMIN') return 'admin';
  return 'patient';
}

test('2.1 Profiles table role is authoritative for Doctor', () => {
  const profile = { role: 'DOCTOR' };
  const authUser = { user_metadata: { role: 'PATIENT' } }; // Outdated metadata
  const resolved = resolveAuthoritativeRole(profile, authUser);
  assert.strictEqual(resolved, 'doctor');
});

test('2.2 Profiles table role is authoritative for Patient', () => {
  const profile = { role: 'PATIENT' };
  const authUser = { user_metadata: { role: 'DOCTOR' } };
  const resolved = resolveAuthoritativeRole(profile, authUser);
  assert.strictEqual(resolved, 'patient');
});

test('2.3 Missing profile falls back to user_metadata without defaulting doctor to patient', () => {
  const profile = null;
  const doctorUser = { user_metadata: { role: 'DOCTOR' } };
  assert.strictEqual(resolveAuthoritativeRole(profile, doctorUser), 'doctor');

  const patientUser = { user_metadata: { role: 'PATIENT' } };
  assert.strictEqual(resolveAuthoritativeRole(profile, patientUser), 'patient');
});

test('2.4 Malicious user_metadata with ADMIN is blocked from admin access when profile is missing', () => {
  const profile = null;
  const attackerUser = { user_metadata: { role: 'ADMIN' }, app_metadata: {} };
  // Should NOT give admin unless in app_metadata
  const resolved = resolveAuthoritativeRole(profile, attackerUser);
  assert.notStrictEqual(resolved, 'admin');
  assert.strictEqual(resolved, 'patient');
});

// --------------------------------------------------------------------------
// 3. LOGIN ROUTE DETERMINATION
// --------------------------------------------------------------------------
function getLoginRedirectPath(loggedInUser) {
  const targetRole = (loggedInUser?.role || '').toLowerCase();
  if (targetRole === 'doctor') return '/doctor/dashboard';
  if (targetRole === 'admin') return '/admin/dashboard';
  if (targetRole === 'patient') return '/patient/dashboard';
  return '/';
}

test('3.1 Doctor login routes directly to /doctor/dashboard', () => {
  const user = { id: 'u1', role: 'doctor' };
  assert.strictEqual(getLoginRedirectPath(user), '/doctor/dashboard');
  const userCaps = { id: 'u1', role: 'DOCTOR' };
  assert.strictEqual(getLoginRedirectPath(userCaps), '/doctor/dashboard');
});

test('3.2 Patient login routes directly to /patient/dashboard', () => {
  const user = { id: 'u2', role: 'patient' };
  assert.strictEqual(getLoginRedirectPath(user), '/patient/dashboard');
});

test('3.3 Admin login routes directly to /admin/dashboard', () => {
  const user = { id: 'u3', role: 'admin' };
  assert.strictEqual(getLoginRedirectPath(user), '/admin/dashboard');
});

// --------------------------------------------------------------------------
// 4. ROLE GUARD ACCESS & PERMISSION BOUNDARIES
// --------------------------------------------------------------------------
function simulateRoleGuard(userRole, allowedRoles) {
  if (!userRole) return { allowed: false, redirectTo: '/login' };
  const normalizedUserRole = userRole.toLowerCase();
  const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());

  if (normalizedAllowed.includes(normalizedUserRole)) {
    return { allowed: true, redirectTo: null };
  }

  // Redirect to user's portal
  if (normalizedUserRole === 'doctor') return { allowed: false, redirectTo: '/doctor/dashboard' };
  if (normalizedUserRole === 'admin') return { allowed: false, redirectTo: '/admin/dashboard' };
  return { allowed: false, redirectTo: '/patient/dashboard' };
}

test('4.1 Doctor accessing Doctor Dashboard (/doctor/dashboard) is ALLOWED', () => {
  const check = simulateRoleGuard('doctor', ['doctor', 'admin']);
  assert.strictEqual(check.allowed, true);
});

test('4.2 Patient attempting to access Doctor Dashboard is BLOCKED and redirected to /patient/dashboard', () => {
  const check = simulateRoleGuard('patient', ['doctor', 'admin']);
  assert.strictEqual(check.allowed, false);
  assert.strictEqual(check.redirectTo, '/patient/dashboard');
});

test('4.3 Doctor attempting to access Admin Dashboard is BLOCKED and redirected to /doctor/dashboard', () => {
  const check = simulateRoleGuard('doctor', ['admin']);
  assert.strictEqual(check.allowed, false);
  assert.strictEqual(check.redirectTo, '/doctor/dashboard');
});

test('4.4 Patient attempting to access Admin Dashboard is BLOCKED and redirected to /patient/dashboard', () => {
  const check = simulateRoleGuard('patient', ['admin']);
  assert.strictEqual(check.allowed, false);
  assert.strictEqual(check.redirectTo, '/patient/dashboard');
});

test('4.5 Doctor accessing Patient Portal is redirected to /doctor/dashboard', () => {
  const check = simulateRoleGuard('doctor', ['patient', 'admin']);
  assert.strictEqual(check.allowed, false);
  assert.strictEqual(check.redirectTo, '/doctor/dashboard');
});

test('4.6 Admin can access Doctor Dashboard and Patient Dashboard', () => {
  const checkDoc = simulateRoleGuard('admin', ['doctor', 'admin']);
  assert.strictEqual(checkDoc.allowed, true);
  const checkPat = simulateRoleGuard('admin', ['patient', 'admin']);
  assert.strictEqual(checkPat.allowed, true);
  const checkAdm = simulateRoleGuard('admin', ['admin']);
  assert.strictEqual(checkAdm.allowed, true);
});

// --------------------------------------------------------------------------
// SUMMARY
// --------------------------------------------------------------------------
console.log('\n--- VERIFICATION TEST SUMMARY ---');
console.log(`Passed: ${passCount}`);
console.log(`Failed: ${failCount}`);

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL 16 AUTH & ROLE ROUTING VERIFICATIONS PASSED SUCCESSFULLY!');
}
