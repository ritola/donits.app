<div align=center>

<img src="doc/assets/donits.svg" alt="donits.app logo" height="128"/>

</div>

**Donits.app** is a git-native project management approach that treats work like code. By keeping backlogs off `main` and managing active tasks in feature branches, it puts the focus entirely on completed work. Built directly into standard developer workflows, Donits.app eliminates vendor lock-in while leveraging full version control.

----

## Status

- Drafting the project goal

## Getting Started

Requires [Deno](https://deno.com) 2.9 or later (`deno desktop` is experimental).

```bash
deno install                     # install workspace dependencies
deno task -f desktop dev         # run the app in a browser (http://localhost:5173)
deno task -f desktop desktop:hmr # run the app as a native desktop window
```

## Similar projects

- Markdown-native project management
  - [Backlog.md](https://github.com/MrLesk/Backlog.md)
  - [AgileMarkdown](https://agilemarkdown.com/)
