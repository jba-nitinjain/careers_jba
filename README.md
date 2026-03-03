# JBA Careers Portal (React + Vite)

This project contains:
- A public career application form (`/`)
- An admin dashboard for authorized reviewers (`/admin`)

## Admin Dashboard Feature Documentation

### Current core features
- **Google-authenticated admin access** restricted to a specific admin email.
- **Application ingestion from Firestore** with newest-first ordering.
- **Resume link hydration** from `resumeUrl` or fallback via `resumePath` from Firebase Storage.
- **Robust auth error guidance** for:
  - unauthorized OAuth domain
  - popup blocked/closed events
  - third-party cookie/storage constraints
- **Application details modal** with contact, skills, experience, and references.

### New UI/UX implemented in this update
- **Modular admin architecture** (hooks + focused components) for maintainability.
- **Dashboard KPIs**: total applications, article assistants, paid assistants.
- **Improved controls**:
  - search by candidate name/email/position
  - position filter
  - quick sort toggle
- **Redesigned table rows** with clearer candidate identity and resume quick actions.
- **Cleaner top navigation** with refresh + sign-out actions grouped for faster operation.

## Firebase OAuth Setup Notes

For deploy previews and custom domains, add each hostname to:

`Firebase Console → Authentication → Settings → Authorized domains`

If this is missing, popup OAuth will fail on that host and the dashboard now shows explicit remediation text.

## Architecture Notes

Admin dashboard logic now lives in:
- `src/pages/AdminDashboard.tsx`
- `src/features/admin/hooks/useAdminApplications.ts`
- `src/features/admin/components/*`
- `src/features/admin/utils/applicationFormatting.ts`
- `src/types/admin.ts`

This split keeps files small and focused, making future additions (bulk actions, CSV export, pipeline statuses) straightforward.
