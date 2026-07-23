# 2. Use TypeScript and Deno runtime for cross-platform app ecosystem

- **Status:** Accepted
- **Date:** 2026-07-23

---

## Context

We need to build a application with a multi-phase platform roadmap:

1. **Phase 1 (immediate):** Cross-platform desktop app (Linux, MacOS, Windows).
2. **Phase 2 (near-term):** Web app deployment.
3. **Phase 3 (long-term):** Mobile apps (iOS, Android).

We want a primary programming language and initial runtime ecosystem that allows rapid iteration on Phase 1 without forcing us to re-write business logic or domain models when scaling to Web and Mobile.

## Decision

We will use **TypeScript** as our primary language and **Deno** as our desktop app compilation runtime and core development toolchain.

### Architecture & Tech Stack Strategy:

1. **Language (Universal):**
   - **TypeScript** across all targets. This enables code reuse for domain logic, data models, API clients, and state management across Desktop, Web, and Mobile.

2. **Desktop application (Phase 1):**
   - We will use **`deno desktop`** (native, no Tauri/Rust layer), an experimental Deno feature introduced in Deno 2.9 (June 2026). It compiles a web app into a native binary directly from the Deno toolchain.
   - The UI layer is built with web standard technologies (React via Vite) rendered in a lightweight web view, while backend/OS operations (filesystem, native APIs, local DB) run directly through Deno.
   - Requires Deno 2.9 or later.

3. **Web application (Phase 2 target):**
   - Since the UI layer is built on web standards (HTML/CSS/TS), the exact same frontend codebase will deploy directly to the Web with minimal modification, served via Deno or a standard CDN.

4. **Mobile application (Phase 3 target):**
   - We will structure shared logic (UI components or core business logic) into a monorepo module. When building Mobile, we can leverage cross-platform framework tools (such as React Native / Capacitor / Expo) that reuse our TypeScript business layer and UI components seamlessly.

## Consequences

### Positive

- **Code sharing:** Business rules, schemas, state, and utility functions can be shared between Desktop, Web, and Mobile.
- **Unified developer experience:** Deno provides built-in tooling out-of-the-box (TypeScript support with zero config, test runner, formatter, linter, and single-binary packager).
- **Resource efficiency:** Compiling via lightweight WebViews keeps binary sizes significantly smaller and memory usage lower than heavy alternatives like traditional Electron.
- **Simplified toolchain:** Developers only need to master one language ecosystem (TypeScript) to contribute across all platforms.

### Negative / Trade-offs

- **Native mobile divergence:** While TypeScript logic is reusable, mobile platform-specific capabilities (e.g., background push notifications, native iOS/Android widgets) will require React Native / Capacitor wrappers down the road.
- **WebView UI limitations:** OS-level WebViews can occasionally show rendering quirks between operating systems compared to native UI controls.
- **Experimental tooling:** `deno desktop` is marked experimental as of Deno 2.9 (June 2026); expect rough edges and breaking changes ahead of a stable release. Mobile packaging is not part of this feature.
