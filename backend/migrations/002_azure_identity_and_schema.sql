-- MediConnect Azure MySQL schema extension.
-- Prerequisite: apply 001_initial_schema.sql once to a newly created, empty
-- mediconnect_db database. This migration is additive and must be applied once.

-- Specialty catalog used by the doctor directory. The existing free-text
-- doctors.specialty column remains in place for Express query compatibility.
CREATE TABLE specialties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT DEFAULT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Map a validated external identity to an internal user. Email is deliberately
-- not part of the identity key. Issuer + subject form the unique OIDC identity;
-- tenant_id is stored explicitly for tenant-aware administration and review.
CREATE TABLE external_identities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    issuer VARCHAR(512) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    tenant_id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    subject VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_external_identity_issuer_subject UNIQUE (issuer, subject),
    INDEX idx_external_identities_user_id (user_id),
    CONSTRAINT fk_external_identities_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Keep the legacy columns used by Express (name/status) and add the avatar
-- field used by the frontend profile model. PENDING supports the profile
-- lifecycle represented in the Supabase schema.
ALTER TABLE users
    MODIFY COLUMN status ENUM('ACTIVE', 'DISABLED', 'PENDING') NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN avatar_path VARCHAR(1024) DEFAULT NULL AFTER phone;

-- Keep doctors.specialty, bio and existing IDs intact. The normalized specialty
-- link and credential fields support the directory and admin approval screens.
ALTER TABLE doctors
    ADD COLUMN specialty_id INT DEFAULT NULL AFTER specialty,
    ADD COLUMN registration_number VARCHAR(100) DEFAULT NULL AFTER bio,
    ADD COLUMN verification_status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING' AFTER registration_number,
    ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT FALSE AFTER verification_status,
    ADD UNIQUE KEY uq_doctors_registration_number (registration_number),
    ADD KEY idx_doctors_specialty_id (specialty_id),
    ADD CONSTRAINT fk_doctors_specialty
        FOREIGN KEY (specialty_id) REFERENCES specialties(id) ON DELETE SET NULL;

-- Existing free-text specialties are retained and linked where a catalog row
-- can be created. This backfill does not change the legacy specialty values.
INSERT IGNORE INTO specialties (name)
SELECT DISTINCT TRIM(specialty)
FROM doctors
WHERE specialty IS NOT NULL AND TRIM(specialty) <> '';

UPDATE doctors AS d
JOIN specialties AS s ON s.name = TRIM(d.specialty)
SET d.specialty_id = s.id
WHERE d.specialty_id IS NULL;

-- Explicitly constrain slot duration on MySQL 8.0 (the Azure Flexible Server
-- target) while leaving all existing slot columns and status values intact.
ALTER TABLE availability_slots
    MODIFY COLUMN status ENUM('AVAILABLE', 'BOOKED', 'CANCELLED', 'UNAVAILABLE') NOT NULL DEFAULT 'AVAILABLE',
    ADD CONSTRAINT chk_availability_slots_positive_duration
        CHECK (end_time > start_time);

-- Preserve cancellation/completion timestamps represented in the Supabase
-- schema and used by the frontend's cancellation flow.
ALTER TABLE appointments
    ADD COLUMN cancelled_at TIMESTAMP NULL DEFAULT NULL AFTER cancellation_reason,
    ADD COLUMN completed_at TIMESTAMP NULL DEFAULT NULL AFTER cancelled_at;

-- Support the frontend summary fields absent from the original MySQL schema.
ALTER TABLE visit_summaries
    ADD COLUMN diagnosis TEXT DEFAULT NULL AFTER summary,
    ADD COLUMN prescribed_medications TEXT DEFAULT NULL AFTER diagnosis,
    ADD COLUMN is_published BOOLEAN NOT NULL DEFAULT FALSE AFTER prescription_document_id;

UPDATE visit_summaries
SET is_published = TRUE
WHERE published_at IS NOT NULL;

-- Notifications can point at an appointment, document, or summary. Keep this
-- textual so existing and future resource identifiers can be represented.
ALTER TABLE notifications
    ADD COLUMN related_resource_id VARCHAR(255) DEFAULT NULL AFTER read_at;

-- Supabase audit rows include JSON metadata; this column allows the same
-- application-level audit details without changing existing integer IDs.
ALTER TABLE audit_logs
    ADD COLUMN metadata JSON DEFAULT NULL AFTER outcome;

-- Retain s3_object_key and its original UNIQUE index for the existing controller
-- while making room for the Azure Blob key. MySQL UNIQUE indexes allow multiple
-- NULLs, so Azure rows can leave s3_object_key NULL without colliding. The
-- locator constraint requires exactly one key matching the selected provider.
ALTER TABLE medical_documents
    MODIFY COLUMN s3_object_key VARCHAR(512) DEFAULT NULL,
    ADD COLUMN azure_blob_name VARCHAR(512) DEFAULT NULL AFTER s3_object_key,
    ADD COLUMN storage_provider ENUM('AWS_S3', 'AZURE_BLOB') NOT NULL DEFAULT 'AWS_S3' AFTER azure_blob_name,
    ADD UNIQUE KEY uq_medical_documents_azure_blob_name (azure_blob_name),
    ADD CONSTRAINT chk_medical_documents_storage_locator CHECK (
        (storage_provider = 'AWS_S3' AND s3_object_key IS NOT NULL AND azure_blob_name IS NULL)
        OR
        (storage_provider = 'AZURE_BLOB' AND s3_object_key IS NULL AND azure_blob_name IS NOT NULL)
    );
