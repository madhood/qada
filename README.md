# Qada

Qada is a small [TanStack Start](https://tanstack.com/start) app for tracking missed prayers and fasts and making them up ("qada"). Enter how much you owe on the debt screen, then log completed make-up prayers and fasts from the home screen — progress is saved locally in your browser.

## Getting Started

```bash
npm install
npm run dev
```

The app runs at `http://localhost:3000`.

## Scripts

```bash
npm run dev              # start dev server on port 3000
npm run build             # production build
npm run preview           # preview the production build
npm run generate-routes   # regenerate src/routeTree.gen.ts from src/routes/*
npm run test              # run tests with vitest
npm run lint               # eslint
npm run format              # prettier --write . && eslint --fix
npm run check                # prettier --check . (no writes)
```

## Tech stack

React 19, TanStack Router (file-based routing) + TanStack Start, Vite 8, Tailwind CSS v4, shadcn/ui (Radix primitives), Vitest.

## Project structure

See [CLAUDE.md](./CLAUDE.md) for an overview of the codebase architecture, and `specs/` for the feature specs, plans, and tasks (this project follows the [Spec Kit](https://github.com/github/spec-kit) workflow).
