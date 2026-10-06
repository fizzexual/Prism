# Security Policy

## Supported Versions

Prism has no versioned releases. Security fixes are applied to the `main`
branch, which is what the live site at https://fizzexual.github.io/Prism/
always runs.

| Version | Supported |
| ------- | --------- |
| current `main` / live site | Yes |
| older commits and forks | No |

## Reporting a Vulnerability

Please **do not** open a public issue for security vulnerabilities.

Instead, report it privately by email to **fizzexual@gmail.com**. This keeps
the details confidential until a fix is available.

When reporting, please include:

- The page URL or the commit you tested
- Your browser and its version, or your Node.js version for server issues
- Steps to reproduce (a minimal proof of concept if possible)
- The affected part (builder UI, exported site, or the API server)
- What an attacker could do with it (the impact)
- Any suggested fix

You can expect an initial response within 7 days. Once the issue is
confirmed, a fix will be pushed to `main`. The live site is rebuilt from
`main` automatically.

## Scope

Prism has three parts:

- **The builder UI** (`client/`). It runs in the browser. On the live site it
  has no server and saves projects only in your browser's `localStorage`.
- **The exported site.** The builder exports your project as standalone
  HTML with CSS (one file, or a ZIP with one file per page). Reports where content typed into the builder
  ends up as running script in the exported site are especially welcome.
- **The API server** (`server/`). An Express server that saves projects to
  PostgreSQL and stores uploaded files on disk under `server/uploads/`. It
  has no login and is meant for local or single-user use. Do not expose it to
  the internet without your own access control.

Reports about the following are especially welcome:

- Script injection in the builder, the preview or the exported site
- File upload handling and serving of uploaded files
- SQL handling in the PostgreSQL data layer
- Secrets or unsafe defaults in the repository or `docker-compose.yml`

The `docker-compose.yml` file runs a PostgreSQL database with a fixed local
password. It is for local development only.

Issues in GitHub Pages, PostgreSQL, Node.js, or third-party libraries should
be reported to those projects. If Prism uses a library in an unsafe way,
please report that here.
