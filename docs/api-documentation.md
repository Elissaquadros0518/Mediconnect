# API documentation

Base URL: `http://localhost:4000/api`

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/health` | API liveness response |
| GET | `/auth/me` | Current identity; requires a configured identity provider |
| GET | `/doctors` | Listed doctor directory |
| GET | `/appointments` | Authenticated patient's appointments |
| POST | `/appointments` | Not implemented (501) |
| `/documents` | Any | Authenticated; storage workflow not implemented (501) |
| GET | `/visits` | Authenticated; not implemented (501) |
| GET | `/notifications` | Authenticated empty collection scaffold |
| GET | `/admin/summary` | Admin role required; reporting not implemented (501) |

Errors use `{ "error": { "message": "..." } }`. Request validation and complete
identity-backed authorization must be implemented before exposing non-health routes.
