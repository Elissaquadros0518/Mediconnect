# Architecture

The repository is a local-development monorepo. The React/Vite frontend sends JSON
requests to the Express API; the API is intended to own authorization and data access.
MySQL stores identity references and application metadata. S3 is intended for private
document objects, and Cognito is the planned hosted identity provider.

```text
Browser -> React/Vite -> Express API -> MySQL
                               |-----> Cognito
                               `-----> private S3 bucket
```

Only the health endpoint, public doctor listing query, and basic local scaffolding are
implemented. Booking, production identity verification, and protected record workflows
are intentionally not enabled.
