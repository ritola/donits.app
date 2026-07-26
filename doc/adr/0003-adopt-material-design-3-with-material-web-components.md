# 3. Adopt Material Design 3 using Material Web Components

- **Status:** Accepted
- **Date:** 2026-07-26

---

## Context

The app currently has no visual design system. We want a reusable design foundation before adding more screens. At the time of writing, Material Design 3 looks modern and professional enough.

We need to decide:

1. Which implementation approach to use for Material Design 3 (MD3) in a React + Vite + Deno stack.
2. How to generate a theme (color roles, light/dark schemes) from a brand seed color.

### Options considered for implementing MD3

- **Material Web Components (`@material/web`)** - Google's official web component implementation of the current MD3 spec. Framework-agnostic, usable from React via custom elements.
- **Hand-rolled CSS tokens** - no new dependency; manually write CSS custom properties approximating MD3 color roles/typescale and style plain HTML elements to match. More control, but reimplements HCT tonal palettes and spec details by hand.
- **MUI (Material UI)** - React component library, fast to build with, but its theming is only partially aligned with the current MD3 spec rather than a native implementation.

### Options considered for theme generation

- **`@material/material-color-utilities`** — Google's official color library implementing the MD3 HCT color algorithm; generates full light/dark tonal color schemes from a single seed color.
- **Manually authored tonal palette** — hand-pick tone values per color role. Avoids a dependency but is exactly the kind of color math the official library exists to get right.
- **Static export from Material Theme Builder** (external web tool) — generate a CSS file once and commit it. Avoids a runtime dependency, but reproducing the theme requires re-running an external tool and pasting output back in, rather than changing one value in the repo.

## Decision

We will adopt **Material Design 3** using:

- **`@material/web`** for MD3 components, since it is the most spec-faithful, official implementation and is framework-agnostic.
- **`@material/material-color-utilities`** to programmatically generate the MD3 light/dark color schemes from a single seed color, `#dd7ab9`.

### Architecture

A new `src/theme/` module is the design system foundation, set up once and consumed by all future screens:

- **`theme.ts`** — runs `@material/material-color-utilities`'s HCT algorithm on the seed color `#dd7ab9` to produce light and dark `Scheme`s. Exposes `initTheme()`, which writes each scheme's color roles as `--md-sys-color-*` CSS custom properties on `<html>`, selects light or dark based on `window.matchMedia('(prefers-color-scheme: dark)')`, and re-applies on change. Called once in `main.tsx` before the initial render. No React context/provider is needed — CSS custom properties are read directly by `@material/web` components and our own CSS.
- **`global.css`** — base page styles (background/text colors via the tokens above). Also overrides MD3's default typeface variable to the system font stack instead of the Roboto webfont that `@material/web`'s typography stylesheet references by default, since this is an offline-capable desktop app and we don't want a network font dependency.
- **`material-web.d.ts`** — ambient JSX typings for the specific custom elements used (`md-outlined-text-field`, `md-filled-button`), so TypeScript recognizes them as valid JSX intrinsics.

### Verification

No automated test harness exists in this repo yet. Verification is manual: run `deno task dev`, check the rendered form under both light and dark OS appearance, and run `deno check` / a production build to confirm no type errors from the custom-element typings.

## Consequences

### Positive

- Official, spec-accurate MD3 implementation and color science, without hand-maintaining tonal palette math.
- Reusable foundation: any future screen gets MD3 color/typography for free by consuming the same CSS custom properties, with no per-screen setup.
- Seed color is a single value in `theme.ts`; changing brand color requires no external tooling.
- No network font dependency, consistent with an offline-capable desktop app.

### Negative / Trade-offs

- `@material/web` components are web components, not native React components — binding `value`/`input` events relies on React's custom-element property/event handling rather than idiomatic React props, which is a less familiar pattern for contributors.
- No icon usage for now means the "connected" state is text-only; adding Material Symbols later will need a separate decision about font loading (bundled vs. network).
- No automated visual regression testing exists, so future theme or component changes are only checked manually.
