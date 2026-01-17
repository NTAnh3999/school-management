# SchoolHub Client

Client workspace for the school-management platform described in `docs/requirement.md`. It is built on **Next.js 15**, **shadcn/ui**, **TanStack Query** (server state) and **Zustand** (client state) to mirror the capabilities that the REST API will expose.

## Quick start

```bash
cd client
npm install
npm run dev
```

The UI is available on `http://localhost:3000`. `npm run lint` executes the flat ESLint config configured for the project, while `npm run build` performs a production build.

## Tech stack

- **Next.js 15 / React 19** using the App Router, route groups and server components.
- **shadcn/ui + Tailwind CSS** customised via `tailwind.config.ts` and `components.json`.
- **TanStack Query** for asynchronous API coordination and caching, with a shared `QueryClient`.
- **Zustand** slices for cross-route UI (drawer state) and authenticated session data.
- **sonner** for toast notifications and `next-themes` for a11y theme toggling.

## Project layout

```
src/
  app/                # App Router routes (landing + authenticated shell)
    (app)/            # Dashboard, Courses, Modules, Activities, Assessments, People
    docs/requirement  # Mirrors docs/requirement.md for quick reference
  components/
    layout/           # AppShell, sidebar, top bar, theme toggle
    providers/        # Theme + React Query providers
    ui/               # shadcn/ui primitives (button, card, table, sheet, etc.)
  config/             # API + navigation metadata
  data/mocks.ts       # Temporary fixtures until the API is connected
  features/           # Domain slices (auth, courses, modules, activities, assessments, enrollments)
  lib/                # Helpers (cn, react-query)
  services/           # Fetch wrapper with timeout + auth token handling
  stores/             # Zustand stores for session + UI state
  types/models.ts     # Domain models (users, courses, modules, activities, enrollments…)
```

Each feature contains `api.ts` (endpoint adapters), `hooks.ts` (TanStack Query hooks) and UI components. They rely on the HTTP client under `src/services/http-client.ts`, which injects JWT tokens from the session store and enforces request timeouts declared in `src/config/api.ts`.

## Styling and UI

shadcn/ui has been initialised with the `new-york` theme. The primitives live in `src/components/ui` and can be extended with the CLI (`npx shadcn@latest add <component>`). Tailwind CSS tokens are set in `src/app/globals.css`. The responsive shell is composed of:

- `Sidebar` (desktop) + `MobileNav` (sheet-based nav) driven by a Zustand store.
- `TopBar` (breadcrumbs, theme toggle, user menu).
- `AppShell` layout for every route inside `src/app/(app)/**`.

## State management

- **Server state:** TanStack Query handles fetching, caching and invalidation. `src/lib/react-query.ts` returns a singleton `QueryClient` that is provided via `AppProviders`.
- **Client state:** `src/stores/session-store.ts` stores the authenticated user/token (persisted to `localStorage`). `src/stores/ui-store.ts` keeps UI-only flags such as the mobile sidebar toggle.

## Environment variables

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL for the REST API described in `docs/requirement.md` | `http://localhost:8080/api` |
| `NEXT_PUBLIC_API_TIMEOUT` | Timeout in ms before aborting fetch requests | `10000` |

Create a `.env.local` file if you need to override these values during development.

## Extending the client

1. **Add API surface**: drop endpoints inside the relevant `src/features/*/api.ts` file. Reuse the exported query keys for cache invalidation.
2. **Model server interactions**: use TanStack Query’s `useQuery`/`useMutation` in `hooks.ts`.
3. **Compose UI**: create feature components and render them inside the route best suited for the requirement (dashboard widgets, CRUD screens, etc.).
4. **RBAC awareness**: the session store exposes the user role/permissions. Use this in your components to show/hide UI affordances until backend enforcement is wired up.

The client currently renders against mock data under `src/data/mocks.ts` whenever the API is not available, so you can iterate on UX independently of the backend deliverables in `docs/requirement.md`.
