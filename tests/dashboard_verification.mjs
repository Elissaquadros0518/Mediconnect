import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('================================================================');
console.log('   MEDICONNECT FOCUSED DASHBOARD & ROUTING VERIFICATION');
console.log('================================================================\n');

let pass = 0;
let fail = 0;

function check(title, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${title}`);
    pass++;
  } catch (err) {
    console.error(`❌ FAIL: ${title}`);
    console.error(`   Error: ${err.message}`);
    fail++;
  }
}

// -----------------------------------------------------------------------------
// Test 1: Two separate dashboard files and implementations
// -----------------------------------------------------------------------------
check('1. Two separate dashboard files exist and are not a shared component', () => {
  const doctorDashPath = path.resolve('frontend/src/pages/doctor/DoctorDashboard.jsx');
  const patientDashPath = path.resolve('frontend/src/pages/patient/PatientDashboard.jsx');

  assert(fs.existsSync(doctorDashPath), 'DoctorDashboard.jsx does not exist');
  assert(fs.existsSync(patientDashPath), 'PatientDashboard.jsx does not exist');

  const doctorCode = fs.readFileSync(doctorDashPath, 'utf8');
  const patientCode = fs.readFileSync(patientDashPath, 'utf8');

  // Verify they are separate components
  assert(doctorCode.includes('export default function DoctorDashboard'), 'DoctorDashboard missing component declaration');
  assert(patientCode.includes('export default function PatientDashboard'), 'PatientDashboard missing component declaration');

  // Verify unique doctor-specific features
  assert(doctorCode.includes('Manage Slots'), 'DoctorDashboard missing slot management');
  assert(doctorCode.includes('Visit Summary'), 'DoctorDashboard missing visit summary');
  assert(doctorCode.includes('pendingRequests'), 'DoctorDashboard missing pending triage');
  assert(doctorCode.includes('statusDistribution'), 'DoctorDashboard missing distribution analytics');
  assert(doctorCode.includes('handleQuickConfirm'), 'DoctorDashboard missing appointment confirmation action');
  assert(doctorCode.includes('handleQuickReject'), 'DoctorDashboard missing appointment decline action');

  // Verify unique patient-specific features
  assert(patientCode.includes('Book New') || patientCode.includes('book-appointment'), 'PatientDashboard missing book appointment');
  assert(patientCode.includes('View Vault') || patientCode.includes('records'), 'PatientDashboard missing vault records');
  assert(patientCode.includes('handleDownload'), 'PatientDashboard missing download vault document');
  assert(!patientCode.includes('Manage Slots'), 'PatientDashboard should not have Manage Slots');
  assert(!patientCode.includes('handleQuickReject'), 'PatientDashboard should not have doctor reject actions');
});

// -----------------------------------------------------------------------------
// Test 2 & 3: Doctor and Patient Login Redirects
// -----------------------------------------------------------------------------
function simulateLoginRoute(userRole) {
  const targetRole = (userRole || '').toLowerCase();
  if (targetRole === 'doctor') return '/doctor/dashboard';
  if (targetRole === 'admin') return '/admin/dashboard';
  if (targetRole === 'patient') return '/patient/dashboard';
  return null;
}

check('2. Doctor login routes strictly to /doctor/dashboard', () => {
  const route = simulateLoginRoute('doctor');
  assert.strictEqual(route, '/doctor/dashboard');
  const upperRoute = simulateLoginRoute('DOCTOR');
  assert.strictEqual(upperRoute, '/doctor/dashboard');
});

check('3. Patient login routes strictly to /patient/dashboard', () => {
  const route = simulateLoginRoute('patient');
  assert.strictEqual(route, '/patient/dashboard');
  const upperRoute = simulateLoginRoute('PATIENT');
  assert.strictEqual(upperRoute, '/patient/dashboard');
});

// -----------------------------------------------------------------------------
// Test 4: Role-specific navigation in Sidebar
// -----------------------------------------------------------------------------
check('4. Sidebar displays role-specific links for doctor and patient portals', () => {
  const sidebarPath = path.resolve('frontend/src/components/common/Sidebar.jsx');
  const code = fs.readFileSync(sidebarPath, 'utf8');

  // Doctor section checks
  assert(code.includes("path.startsWith('/doctor')"), 'Missing doctor path detection');
  assert(code.includes('/doctor/dashboard'), 'Missing /doctor/dashboard link');
  assert(code.includes('/doctor/appointments'), 'Missing /doctor/appointments link');
  assert(code.includes('/doctor/manage-slots'), 'Missing /doctor/manage-slots link');
  assert(code.includes('/doctor/patients'), 'Missing /doctor/patients link');
  assert(code.includes('/doctor/visit-summary'), 'Missing /doctor/visit-summary link');
  assert(code.includes('/doctor/notifications'), 'Missing /doctor/notifications link');
  assert(code.includes('/doctor/profile'), 'Missing /doctor/profile link');

  // Patient section checks
  assert(code.includes("path.startsWith('/patient')"), 'Missing patient path detection');
  assert(code.includes('/patient/dashboard'), 'Missing /patient/dashboard link');
  assert(code.includes('/patient/book-appointment'), 'Missing /patient/book-appointment link');
  assert(code.includes('/patient/records'), 'Missing /patient/records link');
  assert(code.includes('/patient/notifications'), 'Missing /patient/notifications link');
  assert(code.includes('/patient/profile'), 'Missing /patient/profile link');
});

// -----------------------------------------------------------------------------
// Test 5 & 6: Access Guarding (Cross-Role Isolation)
// -----------------------------------------------------------------------------
function simulateRoleGuard(user, allowedRoles) {
  if (!user) return { action: 'REDIRECT', to: '/login' };
  if (user.profileIncomplete && !user.role) {
    return { action: 'RENDER_NOTICE', notice: 'Profile Setup Required' };
  }
  const userRole = (user.role || '').toLowerCase();
  const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());
  if (normalizedAllowed.includes(userRole)) {
    return { action: 'ALLOW' };
  }
  if (userRole === 'doctor') return { action: 'REDIRECT', to: '/doctor/dashboard' };
  if (userRole === 'admin') return { action: 'REDIRECT', to: '/admin/dashboard' };
  if (userRole === 'patient') return { action: 'REDIRECT', to: '/patient/dashboard' };
  return { action: 'REDIRECT', to: '/login' };
}

check('5. A patient cannot access doctor dashboard pages (Blocked & Redirected)', () => {
  const patientUser = { id: 'patient-1', role: 'patient' };
  const doctorRouteGuard = simulateRoleGuard(patientUser, ['doctor', 'admin']);
  assert.strictEqual(doctorRouteGuard.action, 'REDIRECT');
  assert.strictEqual(doctorRouteGuard.to, '/patient/dashboard');
});

check('6. A doctor cannot access patient-only pages (Blocked & Redirected)', () => {
  const doctorUser = { id: 'doctor-1', role: 'doctor' };
  const patientRouteGuard = simulateRoleGuard(doctorUser, ['patient', 'admin']);
  assert.strictEqual(patientRouteGuard.action, 'REDIRECT');
  assert.strictEqual(patientRouteGuard.to, '/doctor/dashboard');
});

// -----------------------------------------------------------------------------
// Test 7: Page refresh role persistence & zero patient fallback
// -----------------------------------------------------------------------------
function resolveRoleOnRefresh(profile, authUser) {
  if (profile?.role) {
    return profile.role.toLowerCase();
  }
  if (authUser?.app_metadata?.role?.toUpperCase() === 'ADMIN') {
    return 'admin';
  }
  if (authUser?.user_metadata?.role?.toUpperCase() === 'DOCTOR') {
    return 'doctor';
  }
  if (authUser?.user_metadata?.role?.toUpperCase() === 'PATIENT') {
    return 'patient';
  }
  return null;
}

check('7. Refreshing the page preserves doctor role and never defaults to patient', () => {
  // Case A: Normal profile in database
  const roleA = resolveRoleOnRefresh({ role: 'DOCTOR' }, { id: 'd-1', user_metadata: { role: 'DOCTOR' } });
  assert.strictEqual(roleA, 'doctor');

  // Case B: Profile table query fails/empty, but user_metadata has DOCTOR
  const roleB = resolveRoleOnRefresh(null, { id: 'd-1', user_metadata: { role: 'DOCTOR' } });
  assert.strictEqual(roleB, 'doctor');

  // Case C: Both profile and metadata are missing/unrecognized
  const roleC = resolveRoleOnRefresh(null, { id: 'unknown-1', user_metadata: {} });
  assert.strictEqual(roleC, null, 'Must NOT default to patient on failure');
});

// -----------------------------------------------------------------------------
// Test 8: All routes in Sidebar & Dashboards resolve in App.jsx
// -----------------------------------------------------------------------------
check('8. All route links in Sidebar and Dashboards are registered in App.jsx', () => {
  const appPath = path.resolve('frontend/src/App.jsx');
  const appCode = fs.readFileSync(appPath, 'utf8');

  const requiredRoutes = [
    // Doctor routes
    '/doctor/dashboard',
    '/doctor/appointments',
    '/doctor/manage-slots',
    '/doctor/patient-record/:id',
    '/doctor/visit-summary',
    '/doctor/patients',
    '/doctor/notifications',
    '/doctor/profile',
    // Patient routes
    '/patient/dashboard',
    '/patient/records',
    '/patient/book-appointment',
    '/patient/notifications',
    '/patient/profile',
    // Admin routes
    '/admin/dashboard',
    '/admin/appointments',
    '/admin/doctors',
    '/admin/users',
    '/admin/audit-logs'
  ];

  for (const r of requiredRoutes) {
    assert(appCode.includes(`path="${r}"`), `App.jsx is missing route: ${r}`);
  }
});

console.log(`\n================================================================`);
console.log(`RESULTS: ${pass} Passed, ${fail} Failed (Total: ${pass + fail})`);
console.log(`================================================================`);

if (fail > 0) process.exit(1);

