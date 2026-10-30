import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qlfizttqpovyvurkrxvs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_m8BNtlAkk74xfl8VB2Sjtg_B841bHPs';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const tables = [
  'users',
  'doctors',
  'profiles',
  'doctor_profiles',
  'specialties',
  'availability_slots',
  'appointments',
  'medical_documents',
  'visit_summaries',
  'notifications',
  'audit_logs',
  'user_preferences'
];

async function main() {
  console.log('--- CHECKING TABLES IN LIVE SUPABASE ---');
  for (const table of tables) {
    const { data, error, status } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`Table '${table}': STATUS ${status} - ERROR ${error.code} : ${error.message} (${error.details || ''})`);
    } else {
      console.log(`Table '${table}': EXISTS! Status ${status}`);
    }
  }

  console.log('\n--- CHECKING STORAGE BUCKETS ---');
  const { data: buckets, error: bError } = await supabase.storage.listBuckets();
  if (bError) {
    console.log('Storage buckets error:', bError.message);
  } else {
    console.log('Buckets found:', buckets.map(b => ({ id: b.id, name: b.name, public: b.public })));
  }

  console.log('\n--- CHECKING RPC FUNCTIONS ---');
  const rpcs = ['get_user_role', 'is_admin', 'is_doctor', 'book_appointment', 'cancel_appointment', 'reject_appointment', 'complete_appointment'];
  for (const rpc of rpcs) {
    const { data, error } = await supabase.rpc(rpc, {});
    console.log(`RPC '${rpc}':`, error ? `${error.code}: ${error.message}` : 'SUCCESS');
  }
}

main();
