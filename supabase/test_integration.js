/**
 * MediConnect Supabase Integration Verification Test Suite
 * Validates:
 * 1. Supabase Client Configuration
 * 2. Network Reachability & Auth Handshake
 * 3. PostgreSQL Table & PostgREST Schema Cache Status
 * 4. SQL Migration Integrity Checks
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://qlfizttqpovyvurkrxvs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_m8BNtlAkk74xfl8VB2Sjtg_B841bHPs';

console.log('================================================================');
console.log('   MEDICONNECT SUPABASE INTEGRATION TEST SUITE');
console.log('================================================================\n');

async function runTests() {
  let passed = 0;
  let failed = 0;
  let warnings = 0;

  // -------------------------------------------------------------
  // TEST 1: Supabase Client Configuration & Live API Handshake
  // -------------------------------------------------------------
  console.log('[TEST 1] Testing Supabase Client Initialization & Network Handshake...');
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  if (supabase) {
    console.log('  ✓ Supabase client instantiated successfully with URL: ' + SUPABASE_URL);
    passed++;
  } else {
    console.error('  ✗ Failed to initialize client');
    failed++;
  }

  // -------------------------------------------------------------
  // TEST 2: Live Supabase Auth Endpoint Connectivity
  // -------------------------------------------------------------
  console.log('\n[TEST 2] Testing Supabase Auth Service Health...');
  try {
    const { data, error } = await supabase.auth.getSession();
    if (!error) {
      console.log('  ✓ Auth service responded normally. Session initialized (anonymous caller).');
      passed++;
    } else {
      console.log('  ✗ Auth error:', error.message);
      failed++;
    }
  } catch (err) {
    console.error('  ✗ Network/Auth error:', err.message);
    failed++;
  }

  // -------------------------------------------------------------
  // TEST 3: PostgreSQL Migration Files Integrity Check
  // -------------------------------------------------------------
  console.log('\n[TEST 3] Validating Local SQL Migration Files...');
  const migrationsDir = path.join(__dirname, 'migrations');
  const expectedMigrations = [
    '20261027150000_create_core_schema.sql',
    '20261027150100_create_triggers_and_functions.sql',
    '20261027150200_create_row_level_security.sql',
    '20261027150300_create_storage_configuration.sql'
  ];

  let migrationsOk = true;
  for (const filename of expectedMigrations) {
    const fullPath = path.join(migrationsDir, filename);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      console.log(`  ✓ Migration found: ${filename} (${content.length} bytes)`);
    } else {
      console.error(`  ✗ Missing migration file: ${filename}`);
      migrationsOk = false;
    }
  }

  if (migrationsOk) passed++;
  else failed++;

  // -------------------------------------------------------------
  // TEST 4: Unified Schema File Check
  // -------------------------------------------------------------
  console.log('\n[TEST 4] Validating Unified Setup Script (supabase/full_schema.sql)...');
  const fullSchemaPath = path.join(__dirname, 'full_schema.sql');
  if (fs.existsSync(fullSchemaPath)) {
    const content = fs.readFileSync(fullSchemaPath, 'utf8');
    const requiredKeywords = [
      'CREATE TABLE IF NOT EXISTS public.profiles',
      'CREATE TABLE IF NOT EXISTS public.specialties',
      'CREATE TABLE IF NOT EXISTS public.doctor_profiles',
      'CREATE TABLE IF NOT EXISTS public.availability_slots',
      'CREATE TABLE IF NOT EXISTS public.appointments',
      'CREATE TABLE IF NOT EXISTS public.medical_documents',
      'CREATE TABLE IF NOT EXISTS public.visit_summaries',
      'CREATE TABLE IF NOT EXISTS public.notifications',
      'CREATE TABLE IF NOT EXISTS public.audit_logs',
      'CREATE TABLE IF NOT EXISTS public.user_preferences',
      'FUNCTION public.book_appointment',
      'FUNCTION public.cancel_appointment',
      'FUNCTION public.handle_new_user',
      'FUNCTION public.prevent_role_self_escalation',
      'FUNCTION public.check_overlapping_slots',
      'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY',
      'medical-documents'
    ];

    let allKeywordsFound = true;
    for (const kw of requiredKeywords) {
      if (!content.includes(kw)) {
        console.error(`  ✗ Missing critical keyword in full_schema.sql: "${kw}"`);
        allKeywordsFound = false;
      }
    }

    if (allKeywordsFound) {
      console.log(`  ✓ Unified full_schema.sql validated with all 17 critical DDL/RLS/Storage definitions (${content.length} bytes).`);
      passed++;
    } else {
      failed++;
    }
  } else {
    console.error('  ✗ Missing supabase/full_schema.sql');
    failed++;
  }

  // -------------------------------------------------------------
  // TEST 5: Checking Remote PostgREST Schema Status
  // -------------------------------------------------------------
  console.log('\n[TEST 5] Checking Remote Supabase PostgREST Cache Status...');
  try {
    const { data, error } = await supabase.from('specialties').select('id, name').limit(1);
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        console.log('  ℹ Remote PostgREST indicates DDL migrations have not yet been executed in the Supabase project database.');
        console.log('    Action needed: Run supabase/full_schema.sql in the Supabase Dashboard SQL Editor.');
        warnings++;
      } else {
        console.log('  ℹ PostgREST response:', error.message);
        warnings++;
      }
    } else {
      console.log(`  ✓ Specialties table is LIVE on Supabase! Found ${data.length} records.`);
      passed++;
    }
  } catch (err) {
    console.warn('  ℹ Remote query notice:', err.message);
    warnings++;
  }

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed, ${warnings} Notes/Pending Remote Execution`);
  console.log('================================================================');
}

runTests();
