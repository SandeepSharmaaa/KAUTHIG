# 🎪 KAUTHIG — Event Registration System

A full-stack event registration system built for organizations running conferences and workshops. Handles session capacity, attendee registration lifecycle, check-in management, and real-time capacity alerts — replacing the error-prone shared spreadsheet workflow.

## Table of Contents

- [Why This Exists](#why-this-exists)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [How Things Work Together](#how-things-work-together)
- [Authentication & Authorization](#authentication--authorization)
- [Registration Lifecycle](#registration-lifecycle)
- [Auto-Expiry System](#auto-expiry-system)
- [Capacity Enforcement](#capacity-enforcement)
- [CSV Import/Export](#csv-importexport)
- [Dashboard & Analytics](#dashboard--analytics)
- [Capacity Alerts](#capacity-alerts)
- [Immutable Audit Trail](#immutable-audit-trail)
- [Guest Self-Registration](#guest-self-registration)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Demo Credentials](#demo-credentials)

---

## Why This Exists

Picture a conference where sign-ups happen over email and a shared spreadsheet. Two people register at the same time for a session with one seat left — the spreadsheet gets updated twice, and the room ends up overcrowded. A reserved seat is never confirmed, but nobody frees it. On the day, front-of-house can't tell who actually showed up versus who signed up weeks ago and forgot.

KAUTHIG solves this with:
- **Real capacity enforcement** — the server refuses registrations when a session is full, using database-level locking so two simultaneous requests can never both get the last seat
- **Automatic expiry** — a reservation that isn't confirmed within 30 minutes frees itself
- **Role-based access** — organizers manage everything, check-in staff handle the door, guests browse and self-register
- **Immutable audit trail** — every status change is recorded with who did it and when, and nobody can edit or delete history

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Vanilla HTML/CSS/JS | Zero build tools, no framework overhead — fast iteration for a backend-focused project |
| **Backend** | Node.js + Express 5 | Native async error handling, familiar ecosystem |
| **Database** | MySQL 8 | Strong constraint support (CHECK, FK, ENUM), scheduled events for auto-expiry, robust transaction/locking model |
| **Auth** | JWT + bcrypt | httpOnly cookies for XSS protection, 12-round bcrypt for password hashing |

---

## Getting Started

### Prerequisites
- Node.js 18+
- MySQL 8.0+

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/SandeepSharmaaa/KAUTHIG.git
cd KAUTHIG

# 2. Install dependencies
npm install

# 3. Create .env file (copy from example)
cp .env.example .env
# Edit .env with your MySQL credentials

# 4. Set up the database
mysql -u root -p < server/db/schema.sql
mysql -u root -p KAUTHIG < server/db/scheduled-events.sql

# 5. Seed demo data
node server/db/seed.js

# 6. Start the server
npm run dev
```

Open **http://localhost:3000** and login with the demo credentials below.

> **Note for PowerShell users:** The `<` redirect doesn't work in PowerShell. Use:
> ```powershell
> Get-Content server/db/schema.sql | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
> ```

---

## Project Structure

```
KAUTHIG/
├── public/                     # Frontend (served as static files)
│   ├── index.html              # Single HTML file — the SPA shell
│   ├── css/styles.css          # All styles
│   └── js/
│       ├── api.js              # HTTP client (wraps fetch, handles auth)
│       ├── auth.js             # Login state management
│       ├── router.js           # Hash-based SPA router
│       ├── components/
│       │   ├── navbar.js       # Role-aware navigation bar
│       │   ├── modal.js        # Reusable modal dialog
│       │   ├── table.js        # Sortable data table
│       │   ├── pagination.js   # Page controls
│       │   └── chart.js        # Canvas 2D bar chart
│       └── pages/
│           ├── login.js        # Login page
│           ├── signup.js       # Create account with role selection
│           ├── dashboard.js    # Analytics dashboard
│           ├── events.js       # Events list
│           ├── event-detail.js # Single event with sessions
│           ├── session-detail.js # Session with registrations
│           ├── registrations.js  # Search/filter all registrations
│           ├── registration-detail.js # Single registration + timeline
│           ├── my-assignments.js # Staff's assigned sessions
│           ├── my-registrations.js # Guest's own registrations
│           ├── staff-management.js # Create/manage users
│           └── alerts.js       # Capacity alerts
│
├── server/
│   ├── server.js               # Express app — mounts all routes
│   ├── config/
│   │   ├── db.js               # MySQL connection pool (mysql2/promise)
│   │   └── env.js              # Environment variable loader
│   ├── middleware/
│   │   ├── auth.js             # JWT verification → req.user
│   │   ├── authorize.js        # Role check (organizer, staff, guest)
│   │   ├── sessionAccess.js    # Staff can only access assigned sessions
│   │   ├── validate.js         # express-validator error formatter
│   │   └── errorHandler.js     # Global error handler
│   ├── routes/                 # HTTP verb + path + middleware chain
│   ├── controllers/            # Unpack request → call service → format response
│   ├── services/               # All business logic + database queries
│   │   ├── auth.service.js
│   │   ├── event.service.js
│   │   ├── session.service.js
│   │   ├── registration.service.js  # ⭐ Core: state machine + locking
│   │   ├── staff.service.js
│   │   ├── dashboard.service.js
│   │   ├── alert.service.js
│   │   ├── csv.service.js
│   │   └── user.service.js
│   ├── db/
│   │   ├── schema.sql          # 7 tables with constraints
│   │   ├── scheduled-events.sql # Auto-expiry every 1 minute
│   │   └── seed.js             # Demo data
│   └── utils/
│       ├── errors.js           # Custom error classes (NotFound, Forbidden, etc.)
│       └── validators.js       # express-validator chains
│
├── docs/                       # Required documentation
│   ├── architecture.md
│   ├── schema.md
│   ├── plan.md
│   ├── decisions.md
│   └── ai-prompts.md
│
└── SUBMISSION.md
```

---

## Architecture

### Three-Layer Backend

```
Browser  ──fetch()──▶  Routes  ──▶  Controllers  ──▶  Services  ──▶  MySQL
                         │              │                │
                    middleware      thin wrapper      business logic
                    (auth, RBAC,   (unpack req,      (queries, transactions,
                     validation)    format res)       state machine)
```

**Why this layering?**
- **Routes** define *what URLs exist* and *what middleware runs*. They don't know about business rules.
- **Controllers** are glue — they translate HTTP (req.params, req.body) into function calls and format the response. They're intentionally thin (~5 lines each).
- **Services** contain all the real logic — database queries, transaction management, validation rules. They don't know about HTTP at all, which makes them testable independently.

### Frontend SPA Architecture

The frontend is a **hash-based single-page application** with zero build tools:

```
index.html loads → api.js, auth.js → components → pages → router.js

URL changes (#/events, #/sessions/5) → router.js reads the hash
→ calls the matching render function → that function fetches data
from the API → builds HTML → injects it into <main id="app">
```

No React, no Vue, no build step. Just `<script>` tags loaded in dependency order.

---

## How Things Work Together

### The Complete Request Flow (Event Registration Example)

Here's what happens when a guest clicks "Register for this Session":

```
1. BROWSER: session-detail.js calls api.post('/sessions/5/registrations', { ... })

2. API.JS: Sends fetch() with credentials:'include' → browser attaches JWT cookie

3. EXPRESS ROUTING: POST /api/sessions/:sessionId/registrations
   ├── authenticate middleware → reads JWT from cookie → loads user from DB → sets req.user
   ├── checkSessionAccess middleware → organizer? pass. guest? pass. staff? check assignment
   ├── express-validator → validates attendeeName, attendeeEmail
   ├── validate middleware → if errors, return 400 with field-level messages
   └── registrationController.create(req, res)

4. CONTROLLER:
   └── Extracts sessionId, attendeeName, attendeeEmail, req.user.id
   └── Calls registrationService.createRegistration({ ... })

5. SERVICE (inside a MySQL transaction):
   ├── BEGIN TRANSACTION
   ├── SELECT capacity FROM sessions WHERE id=5 FOR UPDATE  ← row lock
   ├── COUNT active registrations (reserved+confirmed+checked_in, minus stale)
   ├── if (count >= capacity) → ROLLBACK → throw "Session is full"
   ├── INSERT INTO registrations (...)
   ├── INSERT INTO registration_timeline (action: 'created', performed_by: userId)
   ├── Check if session is now at capacity → INSERT/UPDATE capacity_alerts
   ├── COMMIT  ← releases the lock
   └── return the new registration object

6. CONTROLLER: res.status(201).json({ registration: { ... } })

7. BROWSER: api.js parses JSON → session-detail.js shows toast → re-renders page
```

### How the Navbar Knows What to Show

```
1. On every page load, router.js calls checkAuth()
2. checkAuth() calls GET /api/auth/me → returns { user: { id, name, role } }
3. The user object is stored in a global `currentUser` variable
4. renderNavbar() checks currentUser.role:
   - organizer → Dashboard, Events, Registrations, Staff, Alerts
   - check_in_staff → Dashboard, Events, Registrations, My Assignments, Alerts
   - guest → Events, My Registrations
5. The alert badge fetches GET /api/alerts/count and shows the number
```

### How Server-Side Pagination Works

```
Frontend: GET /api/registrations?search=priya&status=confirmed&sort=reserved_at&order=desc&page=2&limit=20

Service:
├── Builds WHERE clause dynamically from query params
├── SELECT COUNT(*) → gets total matching rows
├── SELECT ... LIMIT 20 OFFSET 20 → gets page 2
└── Returns { registrations: [...], pagination: { page:2, limit:20, total:47, totalPages:3 } }

Frontend:
├── Renders the table with 20 rows
├── Renders pagination: "Page 2 of 3 (47 total)"
└── Prev/Next buttons change the page and re-fetch
```

---

## Authentication & Authorization

### JWT Cookie Flow
```
Login:    POST /api/auth/login → server sets httpOnly cookie with JWT
Requests: Browser auto-sends cookie → auth middleware verifies JWT → loads user
Logout:   POST /api/auth/logout → server clears the cookie
```

### Three Middleware Layers
1. **`authenticate`** — Verifies JWT, loads user from DB, sets `req.user`
2. **`authorize('organizer')`** — Checks `req.user.role` matches allowed roles
3. **`checkSessionAccess`** — For staff: verifies they're assigned to that session via `staff_assignments` table

All enforced on the server. Even if someone modifies the frontend JavaScript, the server rejects unauthorized requests.

---

## Registration Lifecycle

### State Transitions
| From | To | Who Can Do It | What Happens |
|------|----|--------------|--------------|
| *(new)* | Reserved | Organizer, Staff (assigned), Guest (self) | Capacity check with row lock, timeline entry created |
| Reserved | Confirmed | Organizer, Staff (assigned) | `confirmed_at` timestamp set, timeline entry |
| Reserved | Cancelled | Organizer, Staff (assigned) | Seat freed, `cancelled_at` set, timeline entry |
| Reserved | Expired | System (auto, after 30 min) | Seat freed, `expired_at` set |
| Confirmed | Checked In | Organizer, Staff (assigned) | `checked_in_at` set, timeline entry |
| Confirmed | Cancelled | Organizer, Staff (assigned) | Seat freed, `cancelled_at` set, timeline entry |
| Checked In | *(nothing)* | *(terminal state)* | Cannot cancel after check-in |

Any other transition (e.g., Expired → Confirmed, Checked In → Cancelled) is **rejected by the server** with a message explaining why.

---

## Auto-Expiry System

Two layers working together:

### Layer 1: MySQL Scheduled Event (bulk cleanup)
Runs every 60 seconds inside the database engine:
```sql
UPDATE registrations
SET status = 'expired', expired_at = NOW()
WHERE status = 'reserved'
  AND reserved_at < NOW() - INTERVAL 30 MINUTE;
```

### Layer 2: Application-Level Filter (accurate reads)
Every query that counts "active" registrations excludes stale ones:
```sql
WHERE status IN ('reserved','confirmed','checked_in')
  AND NOT (status = 'reserved' AND reserved_at < NOW() - INTERVAL 30 MINUTE)
```

**Why both?** The scheduler might not have run yet (it checks every minute). The app-level filter ensures capacity counts are **always** accurate, even between scheduler runs.

---

## Capacity Enforcement

Uses **pessimistic locking** to prevent overbooking:

```
Transaction starts
  → SELECT ... FOR UPDATE (locks the session row)
  → COUNT active registrations
  → if (count >= capacity) → reject
  → INSERT registration
  → COMMIT (releases lock)
```

If two requests arrive simultaneously:
1. Request A gets the lock, counts 29/30 seats, inserts → commits → seat 30 taken
2. Request B was **waiting** for the lock. Now it gets it, counts 30/30 → **rejected cleanly**

This is safer than optimistic locking because the second request never gets a false "success".

---

## CSV Import/Export

### Import
- Upload a CSV with `name,email` columns
- Each row is processed independently in a try/catch
- Results: `created` (new registration), `duplicate` (email already registered), `error` (invalid data with reason)
- Valid rows succeed even if other rows fail

### Export
- Downloads a CSV file with all registrations for a session
- Includes: name, email, status, reserved_at, confirmed_at, checked_in_at

---

## Dashboard & Analytics

Four headline stats:
- **Sessions today** — `WHERE DATE(start_time) = CURDATE()`
- **Checked in today** — `WHERE status = 'checked_in' AND DATE(checked_in_at) = CURDATE()`
- **Expired this week** — `WHERE status = 'expired' AND expired_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`
- **Sessions at capacity** — sessions where active count >= capacity

Charts (rendered with Canvas 2D API, no library):
- Registration breakdown by status (bar chart)
- Registrations per session (bar chart)
- Check-ins per day over the last 14 days (bar chart)

---

## Capacity Alerts

- When a session reaches full capacity → an alert is created (or updated via `ON DUPLICATE KEY UPDATE`)
- Organizer can **dismiss** the alert
- If a cancellation/expiry frees a seat and the session later fills up again → the alert **returns** (un-dismissed)
- Alert count shown as a **badge** in the navbar

---

## Immutable Audit Trail

The `registration_timeline` table is append-only:
- **No UPDATE endpoints** exist for this table
- **No DELETE endpoints** exist for this table
- Every entry records: action, old_status, new_status, who did it, when, and optional notes
- Even organizers cannot edit history — enforced by the API, not just the UI

---

## Guest Self-Registration

A stretch feature beyond the 10 core goals:
1. Guest signs up on the signup page (choosing "Guest" role)
2. Browses events and sessions (read-only, no admin features)
3. Clicks "Register for this Session" → creates a reservation using their profile
4. Organizer sees the reservation and can confirm or decline
5. Guest can view "My Registrations" and cancel reserved ones

---

## API Endpoints

### Authentication
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | No | Login with email/password |
| POST | `/api/auth/signup` | No | Create account with role |
| POST | `/api/auth/logout` | Yes | Clear session |
| GET | `/api/auth/me` | Yes | Get current user |

### Events
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/events` | Yes | List events (excludes archived) |
| POST | `/api/events` | Organizer | Create event |
| GET | `/api/events/:id` | Yes | Event detail with sessions |
| PUT | `/api/events/:id` | Organizer | Update event |
| PATCH | `/api/events/:id/archive` | Organizer | Toggle archive |

### Sessions
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/events/:eventId/sessions` | Organizer | Create session |
| GET | `/api/events/:eventId/sessions` | Yes | List sessions for event |
| GET | `/api/sessions/:id` | Yes | Session detail with capacity |
| PUT | `/api/sessions/:id` | Organizer | Update session |
| DELETE | `/api/sessions/:id` | Organizer | Delete session |

### Registrations
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/sessions/:id/registrations` | Yes | Create registration (capacity-checked) |
| GET | `/api/registrations` | Yes | List with search/filter/sort/paginate |
| GET | `/api/registrations/my` | Yes | Guest's own registrations |
| GET | `/api/registrations/:id` | Yes | Detail with timeline |
| PATCH | `/api/registrations/:id/confirm` | Org/Staff | Confirm reservation |
| PATCH | `/api/registrations/:id/cancel` | Org/Staff | Cancel registration |
| PATCH | `/api/registrations/:id/check-in` | Org/Staff | Check in attendee |
| POST | `/api/registrations/:id/notes` | Org/Staff | Add timeline note |

### CSV
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/sessions/:id/registrations/import` | Organizer | Bulk import from CSV |
| GET | `/api/sessions/:id/registrations/export` | Org/Staff | Export as CSV file |

### Staff & Users
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/sessions/:id/staff` | Yes | List assigned staff |
| POST | `/api/sessions/:id/staff` | Organizer | Assign staff |
| DELETE | `/api/sessions/:id/staff/:userId` | Organizer | Remove staff |
| GET | `/api/my-assignments` | Staff | My assigned sessions |
| GET | `/api/users` | Organizer | List all users |
| POST | `/api/users` | Organizer | Create user |

### Dashboard & Alerts
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/dashboard` | Org/Staff | Dashboard stats |
| GET | `/api/alerts` | Org/Staff | Active alerts |
| GET | `/api/alerts/count` | Org/Staff | Alert badge count |
| PATCH | `/api/alerts/:id/dismiss` | Organizer | Dismiss alert |

---

## Database Schema

7 tables with full referential integrity:

```
users ──┬──▶ events ──▶ sessions ──┬──▶ registrations ──▶ registration_timeline
        │                          │
        └──▶ staff_assignments ◀───┘
                                   │
                                   └──▶ capacity_alerts
```

See [docs/schema.md](docs/schema.md) for complete column details and constraint rationale.

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Organizer | priya@kauthig.com | password123 |
| Organizer | rahul@kauthig.com | password123 |
| Check-in Staff | anita@kauthig.com | password123 |
| Check-in Staff | vikram@kauthig.com | password123 |
| Check-in Staff | meera@kauthig.com | password123 |
| Guest | sneha@kauthig.com | password123 |

You can also create a new account via the **signup page** — choose Guest, Organizer, or Check-in Staff.

---

## License

MIT