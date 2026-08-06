# Admin Portal — EdTech Platform (Tenant Admin Portal)

The **Tenant Admin Portal** from the Edtech Platform's UI/UX Specification (Notion), covering
the School Admin screen set (`ADM-*`). Built with **React 19**, **Ant Design 5**, and
**Redux Toolkit** (RTK + RTK Query), talking to the real `api/` backend.

## Tech Stack

| Layer               | Library                |
| -------------------- | ----------------------- |
| UI Framework         | React 19 + TypeScript   |
| Build                | Vite 6                  |
| UI Components        | Ant Design 5            |
| State Management     | Redux Toolkit 2         |
| Server State / API   | RTK Query                |
| Routing               | React Router 7           |

## Environment Setup

1. Copy the env template and adjust if your backend runs somewhere other than the default:
   ```bash
   cp .env.example .env.local   # optional — .env already ships with working defaults
   ```
2. Start the backend first (`../api`) — it seeds default accounts on first run (see below).
3. Install and run the frontend:
   ```bash
   npm install
   npm run dev        # http://localhost:3001 by default (VITE_PORT)
   ```

The app always calls the relative path `/api/v1`; Vite's dev server proxies that to the backend
configured by `VITE_API_PROXY_TARGET` (see `vite.config.ts`). **Note:** `api/server.js` actually
listens on `NODE_PORT`, defaulting to **4000** — not the 3000 documented in `api/README.md`, so
that's the default here too. If you run the backend with a different `NODE_PORT`, update
`VITE_API_PROXY_TARGET` in `.env.local` to match.

For a production build, `/api/v1` needs to be reachable from the same origin (e.g. a reverse
proxy) — the dev proxy only applies to `npm run dev`.

## Default (seeded) accounts

The backend seeds one demo account per role on first run (`api/src/database/seed.js`), shown on
the Login screen in dev builds only. Override via the backend's env vars if needed.

| Role    | Email                     | Password       | Env override                          |
| ------- | -------------------------- | --------------- | -------------------------------------- |
| Admin   | `admin@schoolhub.io`       | `Admin@123`     | `ADMIN_EMAIL` / `ADMIN_PASSWORD`       |
| Teacher | `teacher@schoolhub.io`     | `Teacher@123`   | `TEACHER_EMAIL` / `TEACHER_PASSWORD`   |
| Student | `student@schoolhub.io`     | `Student@123`   | `STUDENT_EMAIL` / `STUDENT_PASSWORD`   |
| Parent  | `parent@schoolhub.io`      | `Parent@123`    | `PARENT_EMAIL` / `PARENT_PASSWORD`     |

Only Admin and Teacher are meaningful in this portal (Student/Parent belong to the not-yet-built
Learning Portal per the Portal Strategy doc) — they'll authenticate fine here but see an
essentially empty, permission-gated shell.

## Project Structure

```
src/
├── app/
│   ├── App.tsx                 # ConfigProvider + RouterProvider
│   ├── routes.tsx              # Lazy-loaded routes
│   ├── layouts/
│   │   ├── RootLayout.tsx      # Sidebar + Header shell (authenticated)
│   │   └── AuthLayout.tsx      # Centered shell for Login / Select Tenant
│   ├── components/             # Shared building blocks (PageHeader, StatusTag,
│   │                           # PermissionGate, ProtectedRoute, ModuleLessonEditor, ...)
│   └── pages/                  # One folder per feature area (dashboard, users, profiles,
│                                # courses, classrooms, enrollments, assessments, progress,
│                                # reporting, notifications, administration, account, auth)
├── store/
│   ├── index.ts                # Redux store
│   ├── hooks.ts                # Typed useAppSelector / useAppDispatch
│   └── api/                    # One RTK Query slice per backend module (see inline comments
│                                # for each module's request-body casing quirks)
├── features/
│   ├── auth/                   # authSlice (session/tenant state) + permissions helpers
│   └── ui/uiSlice.ts           # Sidebar collapse + theme
├── lib/error.ts                # Backend error → user message helper
└── types/index.ts              # Shared TypeScript types (mirror the API's snake_case wire format)
```

## Design Patterns Applied

- **Compound components** — layout primitives (Sidebar, Header) are isolated memos
- **Lazy page loading** — every route is a `React.lazy()` chunk split
- **RTK Query tag invalidation** — mutations invalidate the relevant cache tags automatically
- **Permission-gated actions** — `<PermissionGate permission="...">` hides/shows actions based on
  the current user's resolved IAM permissions, not just role
