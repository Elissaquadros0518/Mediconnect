# Security and privacy

This project is not approved for real patient information or production use.

- Authentication is not fully wired: the current auth middleware only supports an
  explicitly opted-in local development identity and otherwise rejects requests.
- Never enable `LOCAL_AUTH_BYPASS` in production. The server exits on that configuration.
- Do not expose S3 buckets publicly. Add ownership checks before issuing short-lived,
  content-type-constrained upload/download URLs.
- Enforce least-privilege RBAC and patient/doctor relationship checks on every record.
- Use TLS, managed secrets, encryption at rest, tested backups, audit review, retention
  controls, and incident-response procedures in deployment.
- Avoid logging tokens, document contents, or personal/clinical data.
- Obtain qualified privacy, security, legal, and clinical review for applicable laws and
  regulations before use.
