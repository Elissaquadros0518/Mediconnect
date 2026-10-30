# Database schema

`backend/migrations/001_initial_schema.sql` defines the initial MySQL schema:

- `users`: application identity linked to an optional Cognito subject and a role.
- `doctor_profiles`: public directory data associated with a doctor user.
- `appointment_slots`: a doctor's time window; a unique doctor/start pair prevents
  duplicate slots.
- `appointments`: one patient booking per slot (`slot_id` is unique).
- `documents`: metadata and private object key; object access must be authorized in the
  API, not by exposing the bucket.
- `audit_logs`: append-oriented audit metadata.

The schema is an educational starting point, not a validated clinical or compliance
schema. Review migration behavior and add transactional booking/audit rules before use.
