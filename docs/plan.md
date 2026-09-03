# Plan

## How I broke the work into sessions

I split the project into roughly 10 phases, each buildable and testable independently. I worked in 2–3 hour sessions across about a week, usually in the evenings after work.

| Session | What I planned to do | Actual time |
|---------|---------------------|-------------|
| 1 (Day 1, ~2h) | Project scaffolding, DB schema, Express server setup, env config | ~2h — on track |
| 2 (Day 1, ~1.5h) | JWT auth with httpOnly cookies, login/logout, RBAC middleware | ~2h — spent extra time on Express 5 cookie handling |
| 3 (Day 2, ~2h) | Events CRUD (backend + frontend), archive/restore | ~2h — on track |
| 4 (Day 2, ~2h) | Sessions CRUD, staff assignment, session access middleware | ~1.5h — cleaner than expected since the pattern was established |
| 5 (Day 3, ~3h) | Registration lifecycle — the core. State machine, pessimistic locking, auto-expiry, duplicate handling | ~3.5h — the transaction logic took longer. Had to think carefully about the lock ordering and what counts as "active" |
| 6 (Day 3, ~1h) | CSV import/export | ~1h — straightforward once registrations worked |
| 7 (Day 4, ~2h) | Dashboard with stats and charts, capacity alerts | ~2h |
| 8 (Day 4, ~1h) | Frontend polish: all pages, CSS, integration fixes | ~2h — this ballooned. Lots of small wiring issues: wrong container IDs, API response shape mismatches |
| 9 (Day 5, ~1.5h) | Guest role, signup page, self-registration | ~1.5h |
| 10 (Day 5, ~1h) | Seed data, documentation, deploy prep | ~1.5h |
| **Total** | **~16.5h estimated** | **~18h actual** |

## What order I built in and why

I followed a bottom-up, dependency-driven order:

1. **Schema and server first** — Everything depends on the database. I designed all 7 tables upfront rather than adding them incrementally, because I wanted foreign keys and constraints from the start. Getting the schema right early avoided migration headaches later.

2. **Auth second** — Every subsequent route needs authentication. Building JWT + RBAC middleware early meant every future route just needed `authenticate` and `authorize('organizer')` — I never had to go back and retrofit security.

3. **Events, then Sessions** — Events are the simplest CRUD and established the pattern (routes → controller → service). Sessions depend on events. Building simpler things first gave me reusable patterns.

4. **Registrations in the middle** — This is the hardest part. I deliberately saved it until I had the event/session foundation solid. The pessimistic locking, state machine, and auto-expiry needed full concentration.

5. **Dashboard and alerts near the end** — These are read-only aggregations over data that already exists. They couldn't be built until registrations worked and there was data to aggregate.

6. **Frontend pages throughout** — I built each page's frontend immediately after its backend. This let me test end-to-end at every phase rather than building a complete backend and then struggling with integration.

7. **Guest role last** — This was a stretch feature (self-service registration). I only added it after all 10 core goals were solid.

## What I estimated versus what it actually took

I underestimated two things:

- **Frontend integration** took about 50% longer than expected. The gap between "the API works in Postman" and "the page renders correctly" is bigger than it looks — response shape mismatches, wrong field names, missing error handling.

- **The registration state machine** was the most complex single piece. I spent extra time on edge cases: what happens if someone cancels and then re-registers with the same email? (Answer: the UNIQUE constraint on `session_id, attendee_email` means I had to handle duplicate key errors and allow re-registration from terminal states.)

I overestimated one thing:

- **CSV import/export** was simpler than expected once the registration service existed. The import is just a loop calling `createRegistration()` per row with try/catch for each.

## What I cut when I ran short

- **Automated tests** — The architecture supports them (services are pure functions over a DB pool), but I ran out of time. This is my biggest regret.

- **Email notifications** — Would have been nice for confirming registrations, but the timeline table captures the same information.

- **Waitlist** — When a session is full, guests just see "Session is Full." A proper waitlist with auto-promotion would need a queue and careful ordering.

- **QR code badges** — Cool stretch feature but not worth the time cost when core goals still needed polish.
