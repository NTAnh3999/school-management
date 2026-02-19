<!--
╔════════════════════════════════════════════════════════════════════════════╗
║                         SYNC IMPACT REPORT                                 ║
╠════════════════════════════════════════════════════════════════════════════╣
║ Version Change: INITIAL → 1.0.0                                            ║
║ Ratification Date: 2026-02-19                                              ║
║ Amendment Type: Initial Constitution                                       ║
╠════════════════════════════════════════════════════════════════════════════╣
║ PRINCIPLES DEFINED:                                                        ║
║   ✓ I. Clean Code - SOLID, readability, maintainability                   ║
║   ✓ II. Flat Design UI - Minimalist, accessible interface                 ║
║   ✓ III. Testing Standards (Future) - Placeholder for test strategy       ║
║   ✓ IV. Feature Co-location - Next.js App Router organization             ║
║   ✓ V. MVC + Service Layer - Backend architectural pattern                ║
╠════════════════════════════════════════════════════════════════════════════╣
║ SECTIONS ADDED:                                                            ║
║   ✓ Technology Stack & Standards                                           ║
║   ✓ Development Workflow                                                   ║
║   ✓ Governance Rules                                                       ║
╠════════════════════════════════════════════════════════════════════════════╣
║ TEMPLATE COMPLIANCE:                                                       ║
║   ✅ plan-template.md - No updates required (generic constitution check)  ║
║   ✅ spec-template.md - No updates required (requirements format agnostic)║
║   ✅ tasks-template.md - No updates required (task format agnostic)       ║
╠════════════════════════════════════════════════════════════════════════════╣
║ FOLLOW-UP TODOS:                                                           ║
║   • Review testing principle when test strategy is defined                 ║
║   • Update constitution when breaking architectural changes are made       ║
╚════════════════════════════════════════════════════════════════════════════╝
-->

# School Management System Constitution

## Core Principles

### I. Clean Code

All code MUST adhere to clean code principles to ensure long-term maintainability and team productivity:

- **SOLID Principles**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion MUST be applied where appropriate
- **Meaningful Names**: Variables, functions, classes MUST have self-documenting names that reveal intent
- **Small Functions**: Functions MUST do one thing well; complex logic MUST be decomposed into smaller, testable units
- **DRY (Don't Repeat Yourself)**: Code duplication MUST be eliminated through abstraction
- **Comments**: Code SHOULD be self-explanatory; comments MUST explain "why" not "what"
- **Consistent Style**: Code MUST follow project linting rules (ESLint for frontend, backend ESLint configuration)

**Rationale**: Clean code reduces cognitive load, accelerates onboarding, minimizes bugs, and makes refactoring safer. In an educational platform handling sensitive student data and learning progress, code clarity directly impacts system reliability.

### II. Flat Design UI

The user interface MUST follow flat design principles to create a modern, accessible, and performant user experience:

- **Visual Hierarchy**: Use typography scale, spacing, and color contrast (not shadows or gradients) to establish importance
- **Minimalist Aesthetic**: Remove unnecessary visual elements; every component MUST serve a clear purpose
- **Consistent Components**: Use shadcn/ui primitives as building blocks; custom components MUST follow established patterns
- **Responsive Design**: Layouts MUST work seamlessly across mobile, tablet, and desktop without compromising usability
- **Accessibility First**: WCAG 2.1 AA compliance MUST be maintained; semantic HTML, ARIA labels, keyboard navigation required
- **Performance**: Tailwind's utility-first approach MUST be used to minimize CSS bundle size

**Rationale**: Flat design reduces visual clutter, improves load times, and ensures accessibility for all learners. Educational platforms serve diverse users including those with disabilities; modern, clean interfaces increase engagement and reduce cognitive friction during learning.

### III. Testing Standards (Future Placeholder)

Testing strategy is currently under evaluation. When defined, this section will specify:

- **Test Coverage Requirements**: Minimum coverage targets for unit, integration, and E2E tests
- **Test-First Development**: Whether TDD will be enforced for critical paths
- **Contract Testing**: API contract validation between frontend and backend
- **Testing Tools**: Approved testing frameworks and utilities

**Rationale**: Placeholder established to signal testing importance while allowing flexibility during initial development. Once patterns emerge and technical debt is understood, a mandatory testing strategy will be defined through a MINOR version amendment.

**TODO(TESTING_STRATEGY)**: Define test coverage requirements, TDD rules, and testing frameworks by v1.1.0.

### IV. Feature Co-location (Frontend)

Frontend code MUST be organized by feature domain to improve discoverability and reduce coupling:

- **App Router Structure**: Next.js 15 App Router with route groups `(app)/`, `(auth)/`, etc.
- **Feature Folders**: Each feature (courses, lessons, quizzes, progress, etc.) contains:
  - `api.ts` - API endpoint adapters using axios
  - `hooks.ts` - TanStack Query hooks for server state
  - `components/` - Feature-specific UI components
  - `types.ts` - TypeScript types for that domain
  - `utils.ts` - Feature-specific utilities
- **Shared Resources**: Common components, configs, services, and global stores live in top-level directories (`src/components/ui/`, `src/config/`, `src/services/`, `src/stores/`)
- **Atomic Design**: UI components should follow shadcn/ui composability patterns

**Rationale**: Co-locating related files reduces context switching, makes feature boundaries explicit, and enables parallel development. When working on lessons, developers find all lesson-related code in one place rather than hunting across scattered directories.

### V. MVC + Service Layer Architecture (Backend)

Backend code MUST follow the MVC pattern with a dedicated service layer, inspired by [node-express-boilerplate](https://github.com/hagopj13/node-express-boilerplate):

- **Request Flow**: `Routes → Controllers → Services → Models → Database`
- **Separation of Concerns**:
  - **Routes** (`src/routes/`): Define HTTP endpoints, apply middleware (auth, validation, RBAC)
  - **Controllers** (`src/controllers/`): Handle HTTP concerns (request parsing, response formatting)
  - **Services** (`src/services/`): Contain business logic, orchestrate models, enforce domain rules
  - **Models** (`src/models/`): Sequelize ORM models, define schema and associations
- **Middleware**: Authentication (JWT), role-based access control, validation (express-validator), error handling
- **Database**: MySQL with Sequelize ORM; migrations MUST be versioned and reversible
- **Security**: bcrypt for password hashing, input sanitization, SQL injection prevention via ORM

**Rationale**: Layered architecture separates HTTP protocol from business logic, making code testable, reusable, and framework-independent. Services can be consumed by different controllers (REST, GraphQL, CLI) without duplication. This structure is battle-tested in production environments and scales with team size.

## Technology Stack & Standards

The following technology choices are mandated to ensure consistency, maintainability, and ecosystem maturity:

### Frontend (Mandatory)

- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS + shadcn/ui (Radix UI primitives)
- **State Management**:
  - **Server State**: TanStack Query (data fetching, caching)
  - **Client State**: Zustand (global UI state)
- **Forms**: react-hook-form + zod validation
- **HTTP Client**: axios with interceptors for auth tokens
- **Icons**: lucide-react

### Backend (Mandatory)

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MySQL 8.0
- **ORM**: Sequelize
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Security**: bcrypt for password hashing
- **Architecture**: MVC with service layer

### Tooling (Mandatory)

- **Linting**: ESLint (flat config for both frontend and backend)
- **Version Control**: Git with feature branches
- **Environment Config**: `.env` files (never committed)

### Prohibited

- **CSS-in-JS libraries**: Use Tailwind utility classes instead
- **Global state libraries other than Zustand**: TanStack Query handles server state
- **ORMs other than Sequelize**: Maintain consistency with chosen stack

## Development Workflow

### Branch Strategy

- **Main Branch** (`main`): Production-ready code only
- **Feature Branches** (`###-feature-name`): All development MUST occur in feature branches
- **Branch Naming**: Use issue/spec number prefix (e.g., `001-user-authentication`, `042-quiz-grading`)

### Code Review Requirements

- All code MUST be reviewed before merging to `main`
- Reviews MUST verify:
  - Constitution compliance (principles I-V)
  - Code cleanliness and readability
  - Security implications (especially auth/authorization)
  - UI/UX consistency with flat design principles

### Quality Gates

- **Linting**: `npm run lint` MUST pass with zero errors
- **Build**: `npm run build` MUST succeed
- **Manual Testing**: Feature MUST be tested in development environment before review
- **Breaking Changes**: Any constitution-violating changes MUST be justified in PR description

## Governance

### Authority

This constitution supersedes all other development practices, coding standards, and architectural decisions unless explicitly amended.

### Amendment Process

1. **Proposal**: Document proposed change with rationale in `.specify/memory/constitution.md`
2. **Review**: Team review and approval required for MINOR or MAJOR changes
3. **Version Bump**:
   - **MAJOR** (X.0.0): Backward-incompatible governance changes, principle removal/redefinition
   - **MINOR** (1.X.0): New principle added, section materially expanded
   - **PATCH** (1.0.X): Clarifications, typo fixes, non-semantic refinements
4. **Migration Plan**: For MAJOR changes, document migration path for existing code
5. **Update Date**: Set `LAST_AMENDED_DATE` to amendment date in ISO format (YYYY-MM-DD)

### Compliance

- All feature specs MUST reference constitution principles in "Constitution Check" section
- All PRs MUST self-certify compliance or justify deviations
- Complexity that violates principles MUST be documented in `plan.md` "Complexity Tracking" section
- Regular constitution reviews SHOULD occur quarterly to ensure relevance

### Living Document

This constitution is a living document. As the project evolves, principles may be refined, added, or (rarely) deprecated. All changes MUST be tracked through version history and sync impact reports.

**Version**: 1.0.0 | **Ratified**: 2026-02-19 | **Last Amended**: 2026-02-19
