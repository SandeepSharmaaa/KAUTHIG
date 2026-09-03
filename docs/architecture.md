# Architecture

## Moving pieces and how they talk to each other

The system has three layers:

1. **Browser (Vanilla HTML/CSS/JS)** — A single `index.html` file that loads multiple JS modules via `<script>` tags. It acts as a hash-based SPA: the URL hash (`#/events`, `#/sessions/5`, etc.) drives which "page" renders into the `<main id="app">` container. All API calls go through a single `api.js` module that wraps `fetch()` with automatic cookie handling, JSON parsing, and error extraction.

2. **Express 5 API server (Node.js)** — A REST API running on port 3000, structured in three sub-layers:
   - **Routes** define the HTTP verbs and paths, apply middleware (auth, authorization, validation), and delegate to controllers.
   - **Controllers** are thin — they unpack the request, call a service function, and shape the response.
   - **Services** hold all business logic: validation rules, database queries, transaction management, state machine transitions.

3. **MySQL 8 database** — Seven tables with foreign keys, check constraints, unique constraints, and a scheduled event that runs every minute to auto-expire stale reservations.

The browser and server communicate over HTTP/JSON. Authentication uses a JWT stored in an `httpOnly` cookie — the browser never sees or handles the token directly; `fetch` with `credentials: 'include'` sends it automatically. This was a deliberate choice over `localStorage` tokens to avoid XSS exposure.

Static files (HTML, CSS, JS) are served by Express via `express.static()` from the `public/` directory. There is no build step — no Webpack, no bundler, no transpiler.

## Where each piece runs

| Piece | Where |
|-------|-------|
| Frontend | Browser — static files served by the Express server |
| API server | Node.js process (single instance) |
| MySQL | Local MySQL 8 server (or managed cloud instance in production) |
| Scheduled expiry | MySQL Event Scheduler — runs inside the database engine itself |

## Request path for a representative action: "Guest registers for a session"

1. Guest clicks "Register for this Session" on the session detail page.
2. `session-detail.js` calls `api.post('/sessions/5/registrations', { attendeeName: 'Priya', attendeeEmail: 'priya@example.com' })`.
3. `api.js` sends `POST /api/sessions/5/registrations` with `Content-Type: application/json` and the JWT cookie.
4. Express matches the route in `registration.routes.js` → runs `authenticate` middleware (verifies JWT, loads user from DB) → runs `checkSessionAccess` (allows organizers, guests, and assigned staff) → runs `express-validator` rules → runs `validate` middleware → calls `registrationController.create`.
5. Controller extracts `sessionId`, `attendeeName`, `attendeeEmail` from the request and calls `registrationService.createRegistration()`.
6. Service begins a MySQL transaction, acquires a row-level lock with `SELECT capacity FROM sessions WHERE id = 5 FOR UPDATE`, counts active registrations (reserved + confirmed + checked_in, excluding stale reservations past the hold window), compares against capacity, and if there's room, inserts into `registrations` and `registration_timeline`, then commits.
7. If the session is full, the service throws a `ValidationError` which Express's error handler catches and returns as `{ error: { message: "Session is full" } }` with status 400.
8. On success, the controller returns the new registration as JSON with status 201.
9. The browser's `api.js` resolves the promise, `session-detail.js` shows a toast ("Registration submitted!") and re-renders the page.

## What I decided not to build

- **WebSocket real-time updates** — The capacity bar and registration list update on page load or after an action. Real-time push would be nicer but adds significant complexity (socket management, reconnection, state sync) for marginal gain in a system where registrations happen over hours, not milliseconds.

- **Email notifications** — Listed as a stretch goal. I focused on the core lifecycle first. The `registration_timeline` table captures everything that would go into an email, so adding Nodemailer later would be a service-layer addition, not a rewrite.

- **Client-side caching** — Every page re-fetches its data. For an admin tool with a small user base this is fine. A service worker or in-memory cache would help if the user count grew.

- **Automated tests** — I ran out of time. The layered architecture (controller → service → DB) was specifically designed to be testable — services can be unit-tested with a mock pool, controllers with a mock service. I'd add these first if I had more time.

- **Waitlist** — When a session is full, I show "Session is Full" to guests. A proper waitlist (auto-promote when a seat frees up) would need a queue data structure and careful ordering, which I scoped out.
