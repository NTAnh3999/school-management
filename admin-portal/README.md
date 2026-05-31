# Admin Portal — SchoolHub

An administrative dashboard for the SchoolHub LMS, built with **React 19**, **Ant Design 5**, and **Redux Toolkit** (RTK + RTK Query).

## Tech Stack

| Layer              | Library               |
| ------------------ | --------------------- |
| UI Framework       | React 19 + TypeScript |
| Build              | Vite 6                |
| UI Components      | Ant Design 5          |
| State Management   | Redux Toolkit 2       |
| Server State / API | RTK Query             |
| Routing            | React Router 7        |

## Quick Start

```bash
cd admin-portal
npm install
npm run dev        # http://localhost:3001
```

> Requires the API server running at `http://localhost:5000` (see `api/`).

## Project Structure

```
src/
├── app/
│   ├── App.tsx               # ConfigProvider + RouterProvider
│   ├── routes.tsx            # Lazy-loaded routes
│   ├── layouts/
│   │   └── RootLayout.tsx    # Sidebar + Header shell
│   ├── components/
│   │   ├── Header.tsx        # Top nav bar
│   │   ├── Sidebar.tsx       # Left navigation
│   │   └── StatCard.tsx      # Reusable stat widget
│   └── pages/
│       ├── Dashboard.tsx     # Overview with stats
│       ├── Users.tsx         # Manage all users (CRUD)
│       ├── Courses.tsx       # Manage course catalog
│       ├── Classrooms.tsx    # Manage cohorts
│       ├── Enrollments.tsx   # Track enrollments
│       ├── Schedule.tsx      # Calendar view
│       ├── Reports.tsx       # Analytics overview
│       ├── Permissions.tsx   # RBAC + audit log
│       └── Settings.tsx      # Profile & appearance
├── store/
│   ├── index.ts              # Redux store
│   ├── hooks.ts              # Typed useAppSelector / useAppDispatch
│   └── api/
│       ├── baseApi.ts        # RTK Query base with auth header
│       ├── usersApi.ts       # Users + dashboard stats endpoints
│       ├── coursesApi.ts     # Courses endpoints
│       ├── classroomsApi.ts  # Classrooms endpoints
│       └── enrollmentsApi.ts # Enrollments endpoints
├── features/
│   ├── auth/authSlice.ts     # Login state + token storage
│   └── ui/uiSlice.ts         # Sidebar collapse + theme
└── types/index.ts            # Shared TypeScript types
```

## Design Patterns Applied

- **Compound components** — layout primitives (Sidebar, Header) are isolated memos
- **No boolean prop proliferation** — explicit variant pages instead of toggling flags
- **Memoized components** — `StatCard`, `Sidebar`, `Header`, and modal sub-components use `memo()`
- **Lazy page loading** — every route is a `React.lazy()` chunk split
- **Parallel data fetching** — Dashboard and Reports pages fire independent RTK Query hooks simultaneously
- **Direct imports** — no barrel `index.ts` re-exports to keep bundle traces clean
- **RTK Query tag invalidation** — mutations invalidate the relevant cache tags automatically
