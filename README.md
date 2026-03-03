# JBA Careers Portal (React + Vite)

This project contains:
- A public career application form (`/`)
- An admin dashboard for authorized reviewers (`/admin`)

## Admin Dashboard Feature Documentation

### Current core features
- **Dual admin authentication**: Google popup sign-in or username/email + password sign-in (Firebase Auth), still restricted to a specific admin email.
- **Application ingestion from Firestore** with newest-first ordering.
- **Resume link hydration** from `resumeUrl` or fallback via `resumePath` from Firebase Storage.
- **Robust auth error guidance** for:
  - unauthorized OAuth domain
  - popup blocked/closed events
  - third-party cookie/storage constraints
  - invalid credential/email and lockout states for username/password login
- **Application details modal** with contact, skills, experience, and references.
- **Application workflow actions**: mark each application as `new`, `rejected`, `called for interview`, or `selected`.
- **Safe delete action**: delete application record and remove the corresponding resume file from Firebase Storage (if present).
- **Permission-aware mutation feedback**: admin sees explicit guidance when Firestore/Storage rules block status updates or file deletion.

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
- `src/features/admin/utils/applicationActions.ts`
- `src/features/admin/utils/firebaseOperationErrors.ts`
- `src/features/admin/hooks/useApplicationMutations.ts`
- `src/types/admin.ts`

This split keeps files small and focused, and now includes modular mutation handlers for status and delete operations.


## Fix for `permission-denied` on Status Update/Delete

The admin UI can only perform status updates and deletes if Firestore/Storage rules explicitly allow the authenticated admin user.

This repo now includes:
- `firestore.rules`
- `storage.rules`
- `firebase.json`

Current rule behavior:
- Anyone can create an application document and upload a resume.
- Only `nitinjain@jainbafna.com` can read/update/delete applications.
- Only `nitinjain@jainbafna.com` can read/delete resume files.

### Deploy rules

```bash
firebase deploy --only firestore:rules,storage
```

After deploying rules, admin status updates and delete actions (including file deletion) should stop returning `permission-denied` / `storage/unauthorized` for the configured admin account.


## Storage Rules Correction

The rule block you shared as `firestore.rules` is actually a **Storage rule** block (`service firebase.storage`).

This repo now uses a corrected `storage.rules` that supports:
- anonymous applicant uploads to `resumes/anonymous/*` with file-size/type validation,
- authenticated user uploads to `resumes/{uid}/*` with UID ownership checks,
- admin-only read/delete for anonymous files, and admin-or-owner read/delete for user folders.

This aligns with:
- applicant upload path used by the form (`resumes/anonymous/...`),
- admin dashboard resume access/delete needs,
- safer validation constraints (max 5MB and allowed document MIME types).
