import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateDocumentMetadata,
  createPatientBlobName,
  isPatientBlobName
} from '../src/services/azureBlobService.js';

test('validateDocumentMetadata accepts valid PDF metadata within 20 MiB', () => {
  const err = validateDocumentMetadata({
    originalFilename: 'blood-test-report.pdf',
    mimeType: 'application/pdf',
    fileSize: 1024 * 500
  });
  assert.equal(err, null);
});

test('validateDocumentMetadata accepts valid PNG, JPEG, and WebP metadata', () => {
  assert.equal(validateDocumentMetadata({
    originalFilename: 'scan.png',
    mimeType: 'image/png',
    fileSize: 2048
  }), null);

  assert.equal(validateDocumentMetadata({
    originalFilename: 'photo.jpg',
    mimeType: 'image/jpeg',
    fileSize: 4096
  }), null);

  assert.equal(validateDocumentMetadata({
    originalFilename: 'xray.webp',
    mimeType: 'image/webp',
    fileSize: 8192
  }), null);
});

test('validateDocumentMetadata rejects mismatched file extensions and mime types', () => {
  const err = validateDocumentMetadata({
    originalFilename: 'malicious.exe',
    mimeType: 'application/pdf',
    fileSize: 1024
  });
  assert.match(err, /Only PDF, PNG, JPEG, and WebP documents are allowed/);
});

test('validateDocumentMetadata rejects files exceeding 20 MiB limit', () => {
  const err = validateDocumentMetadata({
    originalFilename: 'huge_scan.pdf',
    mimeType: 'application/pdf',
    fileSize: 20 * 1024 * 1024 + 1
  });
  assert.match(err, /File size must be between 1 byte and 20971520 bytes/);
});

test('validateDocumentMetadata rejects empty or invalid filenames', () => {
  assert.match(validateDocumentMetadata({
    originalFilename: '',
    mimeType: 'application/pdf',
    fileSize: 1024
  }), /filename between 1 and 255 characters/);

  assert.match(validateDocumentMetadata({
    originalFilename: 'a'.repeat(256) + '.pdf',
    mimeType: 'application/pdf',
    fileSize: 1024
  }), /filename between 1 and 255 characters/);
});

test('createPatientBlobName formats tenant-isolated blob path and is verified by isPatientBlobName', () => {
  const patientId = '11111111-2222-3333-4444-555555555555';
  const blobName = createPatientBlobName(patientId, 'lab_results.pdf');

  assert.ok(blobName.startsWith(`azure/patients/${patientId}/docs/`));
  assert.ok(blobName.endsWith('.pdf'));
  assert.equal(isPatientBlobName(blobName, patientId), true);
});

test('isPatientBlobName rejects blob path belonging to another patient', () => {
  const patientA = '11111111-1111-1111-1111-111111111111';
  const patientB = '22222222-2222-2222-2222-222222222222';
  const blobNameA = createPatientBlobName(patientA, 'report.pdf');

  assert.equal(isPatientBlobName(blobNameA, patientA), true);
  assert.equal(isPatientBlobName(blobNameA, patientB), false);
});

test('isPatientBlobName rejects malformed or directory traversal paths', () => {
  const patientId = '11111111-2222-3333-4444-555555555555';
  assert.equal(isPatientBlobName(`azure/patients/${patientId}/docs/../../secret.pdf`, patientId), false);
  assert.equal(isPatientBlobName('invalid/path.pdf', patientId), false);
  assert.equal(isPatientBlobName(null, patientId), false);
});

