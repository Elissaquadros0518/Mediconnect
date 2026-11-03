# Database schema

## Azure MySQL model

The backend's MySQL schema is the planned application data store for Azure Database
for MySQL Flexible Server. `backend/migrations/001_initial_schema.sql` creates the
legacy base tables: `users`, `doctors`, `availability_slots`, `appointments`,
`medical_documents`, `visit_summaries`, `notifications`, and `audit_logs`. Its
`users`, doctors, appointments, slots, and related records use integer primary keys.
The existing Express queries continue to use legacy column names such as
`users.name`, `users.status`, `doctors.specialty`, `doctors.bio`,
`appointments.reason`, and `medical_documents.s3_object_key`.

Apply `backend/migrations/002_azure_identity_and_schema.sql` after the base migration
to add the `specialties` catalog and `external_identities` mapping, profile and doctor
fields, visit-summary fields, notification resource IDs, audit metadata, and Azure
Blob storage locators. It is a one-time, additive migration: it does not drop tables,
columns, or existing indexes, and its backfills only add specialty links and derive
publication flags from existing timestamps. Do not rerun it. Do not apply it before
the base schema, and do not use the base migration to refresh a populated database:
the base file contains table drops and is only suitable for a newly created empty DB.

`backend/seeds/azure_synthetic_seed.sql` is optional classroom/demo data for a fresh
migrated database. Apply it once only: its patient, doctor, and admin inserts are not
idempotent and a repeat run fails on primary/unique keys. Do not use it to refresh an
existing database. Its patient, doctor, administrator, specialty, and license values
are synthetic. It creates no passwords and no Entra identities; the rows cannot
authenticate until separately linked to test identities in a controlled Entra
External ID tenant. It is kept outside `backend/migrations/` so schema initialization
does not seed demo users automatically.

## Identity mapping

`external_identities` links an internal `users.id` to a validated external identity.
It stores the identity `issuer`, `tenant_id`, and OIDC `subject`. A unique constraint
on `(issuer, subject)` ensures one external identity cannot be attached to more than
one internal user. Email is profile/contact data only and is not an identity key.
`user_id` is a foreign key to `users.id` with `ON DELETE CASCADE`; one user may have
multiple linked identities, while each issuer/subject pair maps to only one user.

The schema does not create or validate Entra tokens. The later authentication phase
must validate token signature, issuer, audience, expiry, and tenant before resolving
the identity mapping. It must load the app role and account status from MySQL rather
than trusting a role supplied by the browser or token profile metadata.

## Schema alignment and compatibility notes

- `users.role` already supports `PATIENT`, `DOCTOR`, and `ADMIN`. `users.status` is
  retained for Express and gains `PENDING`; `avatar_path` supports profile images.
  Frontend-style `full_name` and `account_status` should be mapped at the API boundary
  to the existing `name` and `status` fields to avoid duplicate sources of truth.
- `doctors.specialty` and `bio` remain for current queries. A `specialties` table and
  nullable `doctors.specialty_id` add a normalized catalog link. Credential approval
  fields are added for the admin roster workflow.
- `appointments.reason` remains the backend column; the API can expose it as
  `consultation_reason` for existing frontend service models. Integer IDs remain
  internal. Supabase UUIDs are not interchangeable with these IDs.
- Slot status gains `UNAVAILABLE`; appointments gain cancellation and completion
  timestamps. Visit summaries gain diagnosis, prescribed medications, and publication
  state. Notifications gain a text resource reference; audit logs gain JSON metadata.
- Documents retain the existing S3 locator for backend compatibility. The new
  `storage_provider` and `azure_blob_name` fields represent future Blob objects;
  the check constraint requires exactly one locator for the selected provider. The
  original UNIQUE index on `s3_object_key` is retained: the migration changes the
  column definition only and does not drop/recreate that index. MySQL permits
  multiple `NULL` entries in a UNIQUE index, which allows multiple Azure-only rows
  while continuing to reject duplicate non-NULL S3 keys.
- Existing S3 rows receive the new column's default `storage_provider = 'AWS_S3'`,
  have a non-NULL `s3_object_key`, and have a NULL `azure_blob_name`, so they satisfy
  the storage locator CHECK. A future Azure row must set `storage_provider` to
  `AZURE_BLOB`, set `azure_blob_name`, and leave `s3_object_key` NULL. The CHECK
  rejects rows with both locators or neither locator. MySQL enforces CHECK
  constraints starting with version 8.0.16; the target must be MySQL 8.0.16+.
- The `external_identities` unique index is within InnoDB's 3,072-byte key limit:
  ASCII issuer (512 bytes maximum) plus UTF-8 subject (1,020 bytes maximum) is 1,532
  bytes. The new foreign keys use signed `INT` columns matching their referenced
  primary keys, and the specialty foreign key is nullable for `ON DELETE SET NULL`.
- The specialty backfill trims the existing free-text value on both insert and join.
  Existing doctor rows get the new `verification_status` default `PENDING` and
  `is_public = FALSE`; rows remain intact but require later review before public
  directory exposure. The new positive-duration slot CHECK is validated against
  existing rows when the constraint is added, so legacy slots with
  `end_time <= start_time` must be corrected before applying this migration.
- `user_preferences` is present in the Supabase schema but has no current frontend or
  backend consumer, so it is intentionally not added in this phase. MySQL documents
  also do not yet enforce Supabase's 20 MiB limit; the Azure upload API must enforce
  that limit before accepting uploads.

These migrations are an educational schema foundation, not a clinical, privacy, or
compliance certification. Use synthetic data only for the project and add server-side
authorization, transactional workflows, backups, and operational controls in later
phases.
