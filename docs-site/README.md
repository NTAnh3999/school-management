# School Management API Documentation

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

## Overview

This documentation site provides comprehensive API documentation for the School Management Learning Management System (LMS). It includes:

- **Getting Started Guide** - Quick start instructions for using the API
- **Database Schema** - Complete database structure and relationships
- **API Reference** - Detailed endpoint documentation for all API routes:
  - Authentication
  - Courses
  - Sections
  - Lessons
  - Progress Tracking
  - Quizzes
  - Reviews
  - Notifications
  - Rewards
  - Users

## Local Development

### Prerequisites

- Node.js version 20.0 or above

### Installation

```bash
npm install
```

### Start Development Server

```bash
npm start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

The documentation will be available at `http://localhost:3000`

## Build

```bash
npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Deployment

Using SSH:

```bash
USE_SSH=true npm run deploy
```

Not using SSH:

```bash
GIT_USER=<Your GitHub username> npm run deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.

## Project Structure

```
docs-site/
├── docs/                  # Documentation markdown files
│   ├── api/              # API endpoint documentation
│   │   ├── authentication.md
│   │   ├── courses.md
│   │   ├── sections.md
│   │   ├── lessons.md
│   │   ├── progress.md
│   │   ├── quizzes.md
│   │   ├── reviews.md
│   │   ├── notifications.md
│   │   ├── rewards.md
│   │   └── users.md
│   ├── intro.md          # Getting started guide
│   └── database-schema.md # Database documentation
├── src/                   # React components and pages
│   ├── components/       # React components
│   ├── css/             # Custom CSS
│   └── pages/           # Custom pages (homepage)
├── static/               # Static files (images, etc.)
├── docusaurus.config.ts  # Docusaurus configuration
├── sidebars.ts          # Sidebar navigation structure
└── package.json         # Dependencies and scripts
```

## Customization

### Updating API Documentation

To update or add new API endpoints:

1. Create or modify markdown files in `docs/api/`
2. Update `sidebars.ts` if adding new pages
3. Follow the existing format for consistency

### Updating Configuration

Edit `docusaurus.config.ts` to change:

- Site title and tagline
- Base URL and organization
- Navbar items
- Footer links
- Theme settings

### Styling

Custom styles can be added to `src/css/custom.css`

## Features

### Syntax Highlighting

The documentation includes syntax highlighting for:

- Bash/Shell commands
- JSON
- JavaScript/TypeScript
- SQL
- HTTP requests

### Search

Docusaurus includes built-in search functionality that indexes all documentation pages.

### Dark Mode

The site supports dark mode, which respects user system preferences.

### Mobile Responsive

The documentation is fully responsive and works on all device sizes.

## Scripts

- `npm start` - Start development server
- `npm run build` - Build production site
- `npm run serve` - Serve built site locally
- `npm run clear` - Clear Docusaurus cache
- `npm run typecheck` - Run TypeScript type checking
- `npm run deploy` - Deploy to GitHub Pages

## Contributing

When adding new documentation:

1. Keep content clear and concise
2. Include code examples for all endpoints
3. Document all request/response fields
4. Add error responses
5. Include curl examples

## Resources

- [Docusaurus Documentation](https://docusaurus.io/)
- [Markdown Guide](https://www.markdownguide.org/)
- [LogRocket API Documentation Guide](https://blog.logrocket.com/api-documentation-guide/)

## License

This documentation is part of the School Management API project.
