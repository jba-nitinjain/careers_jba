# JBA Careers Portal

Public job application form (`/`) and staff dashboard (`/admin`) for Jain Bafna & Associates,
served at https://career.jainbafna.com (Netlify site `jba-career`, auto-deployed from `main`).

## How it fits together

```
Browser (React + Vite)
   │  /api/*  (same origin, HttpOnly session cookie)
   ▼
Netlify Functions  (netlify/functions)
   ├── eAccountsApp Data Gateway  https://api.eaccountsapp.com   ← all data + staff sign-in
   │      HMAC-signed with the portal's app key; writes via /bl, reads via /v1
   └── Netlify Blobs store "resumes"                               ← resume files (private)
```

- The browser never talks to eAccountsApp directly: the app key and signing secret stay on the server.
- Staff passwords are checked by eAccountsApp (`POST /v1/auth/login`); the portal then issues its own
  4-hour HttpOnly session cookie. Allowed roles: `CAREERS_ADMIN_ROLES` (default `admin`).
- Admin actions are sent with `X-On-Behalf-Of: <staff email>`, so the gateway audit trail shows who did what.
- The public form is validated again on the server (`netlify/lib/application.ts`), checks the resume's real
  file type, has a honeypot field and allows 5 submissions per connection per hour.

| Route | Function | Purpose |
| --- | --- | --- |
| `POST /api/applications` | `submit-application.ts` | Public form + resume upload (max 4 MB, PDF/DOC/DOCX) |
| `POST /api/auth/login`, `/logout`, `GET /api/auth/me` | `auth.ts` | Staff sign-in |
| `GET /api/admin/applications`, `PATCH`/`DELETE /api/admin/applications/:id` | `admin-applications.ts` | List, change status, delete |
| `GET /api/admin/applications/:id/resume` | `admin-resume.ts` | Stream a resume to signed-in staff |

## Database

Tables: `db/schema.mysql.sql` or `db/schema.postgres.sql` (`applications`, `users`). Form answers beyond the
core columns are kept as JSON text in `applications.data`. Times are stored in UTC.

## Environment variables (Netlify site settings)

| Name | Meaning |
| --- | --- |
| `EACCOUNTS_DB` | Connection id (`db`) of the careers database in eAccountsApp |
| `EACCOUNTS_APP_KEY` | App key of the careers portal app |
| `EACCOUNTS_HMAC_SECRET` | Signing secret of that app |
| `JWT_SECRET` | Random string (≥ 32 chars) used to sign staff session cookies |
| `CAREERS_ADMIN_ROLES` | Optional, comma-separated eAccountsApp roles allowed into `/admin` |

For local work put the same values in `.env.local` (git-ignored) and run `netlify dev`.

## Commands

`npm run dev` (UI only) · `netlify dev` (UI + functions) · `npm run build` · `npm run lint`
