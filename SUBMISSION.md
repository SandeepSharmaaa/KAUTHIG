# Submission

Fill this in and commit it. This is the first file we open.

## Links

- **GitHub repository:** https://github.com/SandeepSharmaaa/KAUTHIG
- **Live application:** *(to be added after deployment)*

## Notes for the reviewer

The application runs on Node.js with Express 5 and MySQL 8. On free-tier hosting, the first request may take 30–60 seconds if the server has gone to sleep.

The guest role (self-service registration) is a stretch feature beyond the 10 core goals. Guests can sign up, browse events and sessions, and register themselves — the organizer then confirms or declines.

## Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Organizer | priya@kauthig.com | password123 |
| Organizer | rahul@kauthig.com | password123 |
| Check-in Staff | anita@kauthig.com | password123 |
| Check-in Staff | vikram@kauthig.com | password123 |
| Check-in Staff | meera@kauthig.com | password123 |
| Guest | sneha@kauthig.com | password123 |

You can also create a new account via the signup page — choose Guest, Organizer, or Check-in Staff role.

## Stack

| Layer | What you used | Why |
|-------|---------------|-----|
| Frontend | Vanilla HTML/CSS/JS (no build tools) | Fastest for me, zero setup overhead, no framework learning curve eating into the 12h budget |
| Backend | Node.js + Express 5 | Native async error handling, familiar ecosystem, fast iteration |
| Database | MySQL 8 | Strong constraint support (CHECK, FK, ENUM), scheduled events for auto-expiry, and I know its transaction/locking model well |
| Hosting | *(to be added)* | |

## Goal checklist

| # | Goal | Status | Notes |
|---|------|--------|-------|
| 1 | Accounts and roles | Done | Organizer, check-in staff, and guest (stretch). Server-enforced via `authorize()` middleware. |
| 2 | Events | Done | CRUD with archive/restore. Archived events hidden from default list. |
| 3 | Sessions inside events | Done | Full CRUD by organizers. Sessions display inside event detail page. |
| 4 | Registration lifecycle with rules | Done | State machine with pessimistic locking. Auto-expiry via MySQL scheduled event + app-level filtering. Capacity enforced server-side with `SELECT...FOR UPDATE`. |
| 5 | Assignment | Done | Many-to-many staff↔sessions. Organizer assigns/removes. Staff see "My Assignments" page. |
| 6 | Finding registrations | Done | Server-side search, filter by status/session, sort, pagination with total count. |
| 7 | Bulk CSV operations | Done | Import with per-row report (created/duplicate/rejected). Export as CSV download. |
| 8 | Dashboard | Done | Sessions today, checked-in today, expired this week, at-capacity count. Status breakdown, per-session breakdown, 14-day check-in chart (Canvas API). |
| 9 | Immutable timeline | Done | Append-only `registration_timeline` table. No UPDATE/DELETE endpoints. Every status change, creation, and note is recorded with who and when. |
| 10 | At-capacity alerts | Done | Alert created when session fills up. Dismissible by organizer. Returns if session refills after a cancellation/expiry. Badge count in navbar. |

## How much time did you actually spend?

About 18 hours total across 5 days. The registration lifecycle (goal 4) and frontend integration/debugging took the most time — roughly 6 hours combined. Documentation took about 2 hours.

## What would you do next, with another 12 hours?

1. **Automated tests** — Unit tests for services (especially registration state machine edge cases), integration tests for the API endpoints. This is my biggest gap.
2. **Email notifications** — Confirmation emails on registration, reminders before sessions. The timeline table already captures the data; it's a matter of adding Nodemailer.
3. **Waitlist** — When a session is full, let guests join a waitlist. Auto-promote the first person when a seat frees up.
4. **Better error UX** — More specific error messages on the frontend, field-level validation highlighting.
5. **Session filtering/sorting** on the event detail page — sort by time, filter by location.

## What are you least happy with in this codebase, and why?

The **lack of automated tests**. The architecture is designed for testability — services are pure functions over a database pool, controllers are thin, middleware is composable — but I didn't write the tests. In a real project, the registration service's state machine and capacity enforcement are exactly the kind of critical business logic that should have exhaustive test coverage. I'd write those first.

Second, the **frontend code quality**. With no build tools, all page scripts share global scope. Functions like `renderEventsPage()` and `handleLogin()` are all globals. This works at this scale but would become a maintenance problem with more pages. A module bundler or at least ES modules would help.
