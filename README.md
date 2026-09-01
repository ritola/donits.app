<div align=center>

<img src="doc/assets/donits.svg" alt="donits.app logo" height="128"/>

**Donits.app** is a version control backed project management that puts the focus on getting items done.

</div>

----

## Status

- Drafting the project goal

## Getting Started

From a fresh checkout, install dependencies and start the desktop workspace
from the repository root.

Requires [Deno](https://deno.com) 2.9 or later (`deno desktop` is experimental).

```bash
deno install                     # install workspace dependencies
deno task -f desktop dev         # run the app in a browser (http://localhost:5173)
deno task -f desktop desktop:hmr # run the app as a native desktop window
```

## Running Tests

Run unit tests from the repository root.

```bash
deno task -f desktop test:unit
```

Before running end-to-end tests for the first time, install the Playwright
browser dependency.

```bash
deno task -f desktop test:e2e:install-browsers
deno task -f desktop test:e2e
```

## Similar projects

- Markdown-native project management
  - [Backlog.md](https://github.com/MrLesk/Backlog.md)
  - [AgileMarkdown](https://agilemarkdown.com/)
