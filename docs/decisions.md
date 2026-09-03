# Decisions

## Decision 1: JWT in httpOnly cookies vs localStorage tokens

- **Chose:** JWT stored in an `httpOnly`, `Secure`, `SameSite=Strict` cookie, set by the server on login.
- **Rejected:** Storing the JWT in `localStorage` and sending it as a `Bearer` token in the `Authorization` header.
- **Why:** The brief says this is for an organization running conferences — not a public-scale app. Security matters more than flexibility. An httpOnly cookie is invisible to JavaScript, so even if there's an XSS vulnerability somewhere in the frontend, an attacker can't steal the session token. The trade-off is that cookies are domain-scoped (can't easily call the API from a different origin), but since the frontend and API are served from the same Express server, this isn't a problem. I also didn't want to add `Authorization` header management to every `fetch()` call.

## Decision 2: Pessimistic locking vs optimistic concurrency for seat reservation

- **Chose:** Pessimistic locking with `SELECT ... FOR UPDATE` inside a MySQL transaction.
- **Rejected:** Optimistic concurrency using a version column and retry-on-conflict.
- **Why:** The whole point of this system is preventing overbooking. Optimistic concurrency detects conflicts after the fact and retries — which works for general data updates but is a bad fit when the "conflict" is "two people got the last seat." With pessimistic locking, the second request simply waits for the first transaction to complete, then sees the updated count and gets a clean "session is full" rejection. The lock is held for a very short time (one INSERT + one INSERT into timeline), so deadlock risk is low. I'd revisit this if the system needed to handle thousands of concurrent reservations per second, but for a conference registration system with dozens of concurrent users, pessimistic locking is simpler and more correct.

## Decision 3: MySQL scheduled event for auto-expiry vs application-level cron

- **Chose:** A two-layer approach: a MySQL `EVENT` that runs every minute to bulk-expire stale reservations, plus application-level filtering at read-time.
- **Rejected:** A Node.js `setInterval` or cron library (node-cron) running inside the Express process.
- **Why:** A Node.js timer dies if the process restarts, and doesn't run if the process is down. The MySQL event scheduler is part of the database engine — it runs regardless of what happens to the application server. The application-level filter (`AND NOT (status = 'reserved' AND reserved_at < NOW() - INTERVAL ? MINUTE)`) is a safety net that ensures capacity counts are always accurate even between event scheduler runs. This belt-and-suspenders approach means a stale reservation can never block a seat for more than one minute, and the count is always correct at query time.

## Decision 4: Hash-based SPA vs server-rendered pages vs React

- **Chose:** Vanilla JS with hash-based routing (`#/events`, `#/sessions/5`).
- **Rejected:** Server-rendered EJS/Pug templates; React/Vue/Svelte SPA with a build step.
- **Why:** The brief says "use whatever you're fastest in." For a backend-focused project, I didn't want to spend time on a build pipeline, npm dependencies for the frontend, or debugging React state management. Hash routing gives SPA-like navigation (no full page reloads) with zero build tooling — just `<script>` tags. The downside is no code splitting and global function scope, but with ~15 JS files this is manageable. Server-rendered templates would have worked too, but they make the "actions update the page without a reload" pattern clunky.

**Later reversed:** I initially built the frontend with minimal styling — just enough to be functional. After finishing the backend, I went back and completely rewrote the CSS and several pages. The functional-first approach was right (it let me validate the backend quickly), but I underestimated how much time the CSS rewrite would take. If I did it again, I'd establish the design system (card styles, table styles, status badges) earlier and apply them from the start.

## Decision 5: Separate attendee_name/email columns vs a user FK for registrations

- **Chose:** `attendee_name` and `attendee_email` as plain VARCHAR columns on the registrations table, with a `created_by` FK pointing to the user who created the registration.
- **Rejected:** A `user_id` FK on registrations pointing to a users table entry for the attendee.
- **Why:** The brief describes attendees as external people — conference-goers who don't necessarily have accounts in the system. Organizers bulk-import CSV files of names and emails. Requiring every attendee to have a user account would make CSV import impossible (you'd need to create user records first) and would conflate "people who operate the system" with "people who attend sessions." Keeping attendee data as simple text fields means the registration table is self-contained and CSV import is a straightforward INSERT. The `created_by` FK tracks which staff member created the registration, not who the attendee is. When I later added the guest role, guests self-register using their profile's name and email — it flows into the same `attendee_name`/`attendee_email` columns naturally.

## Decision 6: Express 5 vs Express 4

- **Chose:** Express 5 (v5.2.1).
- **Rejected:** Express 4 (the stable, well-documented version).
- **Why:** Express 5 has built-in async error handling — if an async route handler throws, Express catches it and forwards to the error handler automatically. In Express 4, you need `try/catch` in every async handler or a wrapper like `express-async-errors`. Since my controllers are all async (they await service calls), Express 5 saved me from wrapping every handler. The downside: Express 5's `path-to-regexp` v8 uses `{*path}` instead of `*` for wildcard routes, and some middleware docs still reference Express 4 patterns. I hit this bug early and fixed it.

## Decision 7: Canvas API charts vs Chart.js

- **Chose:** Drawing bar charts directly with the Canvas 2D API.
- **Rejected:** Adding Chart.js as a dependency.
- **Why:** The dashboard needs one bar chart (check-ins per day over 14 days). Chart.js is 200KB+ for a single chart. Drawing rectangles and text on a canvas is ~100 lines of code and zero dependencies. The result isn't as polished (no hover tooltips, no animations), but it loads instantly and I don't need to worry about Chart.js version compatibility or configuration. For a production app with complex visualization needs, I'd use a library. For one bar chart, raw canvas wins.
