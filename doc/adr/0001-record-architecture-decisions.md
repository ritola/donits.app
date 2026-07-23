# 1. Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-07-23

---

## Context

We record architectural decisions made for this project so that current and future team members understand *why* the system is designed the way it is, what alternatives were considered, and what consequences those decisions carry.

Without a structured log, architectural context is easily lost in closed PRs, Slack threads, or old backlog items.

## Decision

We will use **Architecture Decision Records (ADRs)** to document all major architectural and design decisions.

Each ADR will be stored as a Markdown file in the repository under the `doc/adr/` directory.

### Conventions

- **File naming:** `NNNN-short-title.md`.
- **Immutability:** Past ADRs are not edited or deleted when decisions change. Instead, new ADRs will supersede older ones (e.g., "ADR 0005 supersedes ADR 0002").
- **Statuses:**
  - `Proposed` — Under discussion in a pull request.
  - `Accepted` — Approved and agreed upon by the team.
  - `Superseded by ADR XXXX` — Replaced by a newer decision.
  - `Deprecated` — No longer relevant or active.

## Consequences

### Positive

- Architectural history stays directly in version control alongside the code.
- Onboarding new developers becomes faster as they can read `doc/adr/` sequentially.
- Reduces repeated debates over previously resolved decisions.

### Negative / Trade-offs

- Adds a small overhead to the workflow when proposing major architectural changes.
- Requires team discipline to keep records updated during active design shifts.
