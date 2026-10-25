# Testing

Run backend tests with `cd backend` then `npm test`. The tests use Node's built-in test
runner and do not require AWS or MySQL.

For local integration work, start MySQL using `docker compose up -d db`, configure
`backend/.env`, and run the API with `npm run dev`. Frontend checks use `npm run build`
from `frontend`.

Add integration tests for identity, role boundaries, appointment concurrency, document
ownership, and audit behavior before implementing those workflows.
