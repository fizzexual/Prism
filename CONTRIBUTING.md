# Contributing to Prism

Thanks for your interest in Prism. This guide shows how to run the project
locally, how to run the tests and how to propose a change.

## Project layout

Prism is an npm-workspaces monorepo with two workspaces:

- `client/` - the React + Vite editor (the builder UI and the site export)
- `server/` - the Express API that saves projects to PostgreSQL

## Prerequisites

- Node.js 18 or newer. The GitHub Pages build uses Node.js 20.
- npm (comes with Node.js)
- Optional: Docker, to run the local PostgreSQL 16 database from
  `docker-compose.yml`. Any PostgreSQL reachable through `DATABASE_URL` also
  works.

PostgreSQL is optional for local work. Without it, the server still starts and
the editor saves projects to your browser's `localStorage`.

## Setup

Run each command on its own line.

1. Create your `.env` file from the example:
   - Windows: `copy .env.example .env`
   - macOS/Linux: `cp .env.example .env`
2. Optional: start PostgreSQL with `docker compose up -d db`
3. Install dependencies with `npm install`
4. Optional: apply database migrations with `npm run migrate`

On Windows you can also double-click `run.bat`. It creates `.env`, installs
dependencies on the first run and starts the app.

Never commit your `.env` file. It is already in `.gitignore`.

## Run locally

```bash
npm run dev
```

This starts the client and the server together:

- Editor: http://localhost:5173
- API: http://localhost:9998 (change it with `PORT` in `.env`)

## Tests

Tests use Vitest. The client tests run in jsdom. The server tests use an
in-memory repository, so they do not need a database.

```bash
npm test              # client and server
npm run test:client   # client only
npm run test:server   # server only
```

Run `npm test` before you open a pull request. All tests must pass. If you
change behavior, add or update a test. Client tests sit next to the code
(`*.test.js`, `*.test.jsx`). Server tests are in `server/test/`.

There is no linter or formatter configured. Follow the style of the code
around your change.

## Build

```bash
npm run build
```

This builds the client into `client/dist/`.

## How the live site deploys

The live site is https://fizzexual.github.io/Prism/. The workflow
`.github/workflows/deploy-pages.yml` runs on every push to `main`. It installs
dependencies, builds the client with `BUILD_BASE=/Prism/` and publishes
`client/dist` to GitHub Pages. Only the client is deployed. The live site has
no server or database, so projects are saved in the browser's `localStorage`.

## Proposing a change

1. Fork the repository.
2. Create a branch from `main` with a short, clear name.
3. Keep the pull request small and focused on one thing.
4. In the description, say what you changed and why.
5. Make sure `npm test` passes and `npm run build` succeeds.
6. Open the pull request against `main`.

For larger changes, open an issue first so we can agree on the approach.
Guides for common extensions are in `docs/adding-components.md` and
`docs/adding-3d-models.md`.

## Security issues

Do not report security problems in a public issue. See [SECURITY.md](SECURITY.md).

## License

By contributing, you agree that your contributions are licensed under the
[MIT License](LICENSE).
