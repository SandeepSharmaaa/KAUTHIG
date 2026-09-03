# AI Prompts

I used AI (Claude) throughout the project, primarily as a coding assistant. Below are the significant prompts grouped by what I was trying to achieve. I've included what worked, what didn't, and what I had to fix.

## 1. Designing the database schema

### Prompt
"I'm building an event registration system with these requirements: [pasted the 10 goals]. Design a MySQL schema with proper constraints, foreign keys, and indexes."

### What I got
A reasonable schema with 7 tables. The AI suggested using an ENUM for registration status (`reserved`, `confirmed`, `checked_in`, `cancelled`, `expired`) and separate timestamp columns for each status transition. It also suggested the `registration_timeline` as an append-only audit log.

### What I corrected
The initial suggestion used `user_id` as a foreign key on registrations, pointing to a users table entry for the attendee. This doesn't work for the CSV import use case — attendees are external people without accounts. I changed it to `attendee_name` and `attendee_email` as plain columns, with `created_by` tracking which staff member created the registration. This was a real design decision I had to think through.

## 2. Setting up the Express server and auth middleware

### Prompt
"Set up an Express 5 server with JWT auth using httpOnly cookies, bcrypt password hashing, and role-based authorization middleware."

### What I got
Working auth middleware with `authenticate` and `authorize` functions. The JWT is set as a cookie on login and verified on each request.

### What I corrected
The AI initially used `express-async-errors` for async error handling, but Express 5 handles this natively. I removed the dependency. It also used `*` for the SPA fallback wildcard route, which crashes in Express 5's path-to-regexp v8 — I had to change it to `{*path}`.

## 3. Registration lifecycle with pessimistic locking

### Prompt
"Implement the registration service with: pessimistic locking using SELECT FOR UPDATE, a state machine for status transitions (reserved → confirmed → checked_in, with cancel from reserved or confirmed), auto-expiry for reservations past 30 minutes, and capacity enforcement."

### What I got
The service uses a transaction with `SELECT ... FOR UPDATE` to lock the session row, counts active registrations, and either creates the registration or throws an error. The state machine uses a `VALID_TRANSITIONS` map. This was mostly correct.

### What I corrected
The auto-expiry filtering was wrong initially. The AI excluded expired registrations from the count but didn't handle the case where a registration is still `status = 'reserved'` but past the hold window (not yet expired by the scheduled event). I added the condition `AND NOT (status = 'reserved' AND reserved_at < NOW() - INTERVAL ? MINUTE)` to correctly treat stale-but-not-yet-expired reservations as inactive.

## 4. Frontend pages — this is where AI produced the most errors

### Prompt
"Create the session detail page with: capacity bar, staff assignments list, registrations table with confirm/cancel/check-in actions, CSV import/export buttons."

### What I got
A page that looked complete but had **multiple bugs** that all stemmed from the AI not knowing my actual API response shapes:

### What I corrected (significant issues)
1. **Wrong container ID** — Every page used `document.getElementById('app-content')` but my HTML has `<main id="app">`. I had to change every occurrence to `'app'`.
2. **Wrong API response shape** — The dashboard page expected `data.sessionsToday` but my controller returns `{ dashboard: { stats: { sessionsToday } } }`. I had to match every frontend data access to the actual controller responses.
3. **Wrong field names** — Used `session.seats_occupied` (doesn't exist) instead of `session.occupiedCount`, `reg.name` instead of `reg.attendee_name`, `session.duration` instead of `session.duration_minutes`. These were consistent across every page.
4. **Non-existent endpoints** — The session detail page tried to fetch `/users` to show a staff dropdown, but I hadn't built that endpoint. I initially replaced it with a numeric ID input, then later built the `/api/users` endpoint and changed it to a proper dropdown.
5. **Wrong action endpoints** — Used `PATCH /registrations/:id` with `{ status: 'confirmed' }` but my API uses specific endpoints: `PATCH /registrations/:id/confirm`, `/cancel`, `/check-in`.

**Lesson:** AI-generated frontend code that calls your API will almost certainly have the wrong response shapes. I should have written the API contracts first and provided them as context. Instead, I had to debug every page against the actual API responses — this took longer than writing the pages from scratch would have.

## 5. CSV import/export

### Prompt
"Build CSV import that processes each row independently — valid rows get created even if others fail. Return a per-row report: created, duplicate, or rejected with reason."

### What I got
A working CSV service that loops through rows, calls `createRegistration()` per row with try/catch, and builds a results array. Export formats registrations as CSV with proper escaping.

### What I corrected
Minor: the import initially stopped on the first error instead of continuing. I fixed it to catch per-row and continue, collecting results.

## 6. Seed data

### Prompt
"Create a seed script with demo users, events, sessions, registrations in various statuses, staff assignments, and a capacity alert."

### What I got
A seed script that **completely didn't work**. This was the worst AI output in the project.

### What I corrected
Six separate bugs:
- `require('./pool')` — wrong path, should be `require('../config/db')`
- Used `title` column for events — my schema uses `name`
- Sessions INSERT missing `start_time`, `duration_minutes`, `location` columns
- Created users with role `'attendee'` — not in my ENUM
- Registrations used `user_id` column — doesn't exist, should be `attendee_name`/`attendee_email`
- `capacity_alerts` INSERT referenced a `message` column that doesn't exist

I rewrote the entire seed script. This was a clear case where the AI hadn't internalized my actual schema.

## 7. Guest role and signup (stretch feature)

### Prompt
"Add a guest role where users can sign up, browse events, and self-register for sessions. Organizers see their registration as 'reserved' and can confirm or decline."

### What I got
Working signup endpoint, route, and frontend page. The role selector UI with radio cards was a nice touch.

### What I corrected
Had to update the `sessionAccess` middleware to allow guests through (it was rejecting anyone who wasn't organizer or check_in_staff). Also had to add `'guest'` to the ENUM in both the schema SQL and the service validators.
