# react-mux

`react-mux` is a CLI tool that enables you to run and build multiple React projects from a **single codebase**. The name "mux" stands for **multiplexer**—a device that selects between several input signals and forwards the selected input to a single output line. Similarly, `react-mux` dynamically selects and serves one project at a time from a shared set of source files.

## Motivation

In many organizations, teams maintain multiple frontend applications that share common components, utilities, and infrastructure. Instead of duplicating this shared logic across repositories, `react-mux` lets you colocate multiple projects in one codebase while ensuring they remain **independent at build and deployment time**.

> **Important**: `react-mux` is **not a DevOps or multi-project deployment solution**. It is designed to **reduce redundancy during development** by sharing code (components, hooks, styles, etc.) across projects. Each project should be treated as a standalone application and deployed from its own repository or pipeline. If you modify only one project, only that project should be rebuilt and redeployed—others must not be affected. This tool intentionally builds to a single `dist/` directory to reinforce that only **one project is active per build**.

Future versions may support building multiple projects in one pass, but this will remain **optional** and opt-in.

## Features

- Zero-configuration entry point: no `main.tsx` required
- Automatic project discovery from `src/projects/`
- Shared code (components, utils, styles, i18n, etc.) across projects
- Isolated builds: each run targets exactly one project
- Full TypeScript support
- Vite 7+ compatible
- Preserves your `index.html` (no overrides)
- Validates setup before running

## Requirements

- Node.js >= 20.19.0
- A `index.html` file in your project root containing a `<div id="root"></div>`
- Project components in `src/projects/` (e.g., `src/projects/app-a.tsx`)

## Installation

```bash
npm install -D react-mux
```

## Usage

List available projects interactively:

```bash
npx react-mux dev
npx react-mux build
```

Or specify a project directly:

```bash
npx react-mux dev --project app-a
npx react-mux build --project admin-panel
```

### Custom projects directory

By default, projects are loaded from `src/projects/`. You can override this:

```bash
npx react-mux dev --project my-app --src ./apps
```

## Accessing the Active Project in Code

The currently selected project name is available in your application code via Vite’s built-in environment variable:

```ts
const currentProject = import.meta.env.MODE;
```

This value matches the `--project` name you passed to the CLI (e.g., `"app-a"`).

## Project Structure Example

```
my-monorepo/
├── index.html
├── src/
│   ├── components/        ← shared components
│   ├── hooks/             ← shared hooks
│   ├── styles/            ← shared styles
│   ├── i18n.ts            ← shared i18n setup
│   └── projects/
│       ├── app-a.tsx      ← project A entry
│       └── app-b.tsx      ← project B entry
└── package.json
```

Each project file (e.g., `app-a.tsx`) must export a default React component.
