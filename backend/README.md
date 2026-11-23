# SysAdmin Notes backend

Express API with bcrypt and JWT auth, storing users in MySQL (`sysadmin_db`).

| Endpoint | Send | Success |
|---|---|---|
| `POST /api/auth/register` | `username, email, password` | 201 `{success, message}` |
| `POST /api/auth/login` | `username, password` | 200 `{success, message, token}` |
| `GET /api/auth/me` | `Authorization: Bearer <token>` | 200 `{success, user}` |
| `GET /api/health` | nothing | 200, or 503 if the database is unreachable |

Errors are `{success: false, error}`.

## Run
1. `npm install`
2. Copy `.env.example` to `.env` and fill in `DB_USER`, `DB_PASSWORD` and `JWT_SECRET`
3. If `sysadmin_db` has no `users` table, create it from `sql/users.sql`
4. `npm start`

`npm test` uses a throwaway local MySQL (Ubuntu needs `libaio1t64`).
