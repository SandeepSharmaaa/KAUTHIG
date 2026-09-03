# Schema

## Table-by-table breakdown

### users
| Column | Type | Notes |
|--------|------|-------|
| id | INT UNSIGNED AUTO_INCREMENT | Primary key |
| email | VARCHAR(255) NOT NULL | Unique constraint |
| password_hash | VARCHAR(255) NOT NULL | bcrypt, 12 rounds |
| name | VARCHAR(255) NOT NULL | Display name |
| role | ENUM('organizer', 'check_in_staff', 'guest') NOT NULL | Controls access |
| created_at | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | |
| updated_at | TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | |

### events
| Column | Type | Notes |
|--------|------|-------|
| id | INT UNSIGNED AUTO_INCREMENT | Primary key |
| name | VARCHAR(255) NOT NULL | |
| description | TEXT | Nullable — some events don't need one |
| start_date | DATE NOT NULL | |
| end_date | DATE NOT NULL | CHECK (end_date >= start_date) |
| venue | VARCHAR(255) NOT NULL | |
| is_archived | BOOLEAN DEFAULT FALSE | Indexed for fast filtering |
| created_by | INT UNSIGNED | FK → users(id), ON DELETE SET NULL |
| created_at, updated_at | TIMESTAMP | Auto-managed |

### sessions
| Column | Type | Notes |
|--------|------|-------|
| id | INT UNSIGNED AUTO_INCREMENT | Primary key |
| event_id | INT UNSIGNED NOT NULL | FK → events(id), ON DELETE CASCADE |
| title | VARCHAR(255) NOT NULL | |
| start_time | DATETIME NOT NULL | Indexed for "sessions today" queries |
| duration_minutes | INT UNSIGNED NOT NULL | |
| location | VARCHAR(255) NOT NULL | Room within the venue |
| capacity | INT UNSIGNED NOT NULL | CHECK (capacity > 0) |
| created_at, updated_at | TIMESTAMP | Auto-managed |

### registrations
| Column | Type | Notes |
|--------|------|-------|
| id | INT UNSIGNED AUTO_INCREMENT | Primary key |
| session_id | INT UNSIGNED NOT NULL | FK → sessions(id), ON DELETE CASCADE |
| attendee_name | VARCHAR(255) NOT NULL | Indexed for search |
| attendee_email | VARCHAR(255) NOT NULL | Indexed for search |
| status | ENUM('reserved','confirmed','checked_in','cancelled','expired') DEFAULT 'reserved' | |
| reserved_at | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | Used for hold window calculation |
| confirmed_at | TIMESTAMP NULL | Set when status → confirmed |
| checked_in_at | TIMESTAMP NULL | Set when status → checked_in |
| cancelled_at | TIMESTAMP NULL | Set when status → cancelled |
| expired_at | TIMESTAMP NULL | Set when status → expired |
| created_by | INT UNSIGNED | FK → users(id), ON DELETE SET NULL |
| created_at, updated_at | TIMESTAMP | Auto-managed |
| | | UNIQUE(session_id, attendee_email) |

### registration_timeline
| Column | Type | Notes |
|--------|------|-------|
| id | INT UNSIGNED AUTO_INCREMENT | Primary key |
| registration_id | INT UNSIGNED NOT NULL | FK → registrations(id), ON DELETE CASCADE |
| action | VARCHAR(50) NOT NULL | 'created', 'status_change', 'note_added' |
| old_status | VARCHAR(20) NULL | NULL for creation entries |
| new_status | VARCHAR(20) NULL | |
| note | TEXT NULL | Free-text notes from staff |
| performed_by | INT UNSIGNED NULL | FK → users(id), ON DELETE SET NULL |
| performed_at | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | |

### staff_assignments
| Column | Type | Notes |
|--------|------|-------|
| id | INT UNSIGNED AUTO_INCREMENT | Primary key |
| user_id | INT UNSIGNED NOT NULL | FK → users(id), ON DELETE CASCADE |
| session_id | INT UNSIGNED NOT NULL | FK → sessions(id), ON DELETE CASCADE |
| assigned_at | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | |
| | | UNIQUE(user_id, session_id) |

### capacity_alerts
| Column | Type | Notes |
|--------|------|-------|
| id | INT UNSIGNED AUTO_INCREMENT | Primary key |
| session_id | INT UNSIGNED NOT NULL | FK → sessions(id), ON DELETE CASCADE |
| is_dismissed | BOOLEAN DEFAULT FALSE | Organizer can dismiss |
| created_at, updated_at | TIMESTAMP | Auto-managed |
| | | UNIQUE(session_id) — one alert per session |

## Relationships

**One-to-many:**
- users → events (one organizer creates many events)
- events → sessions (one event has many sessions)
- sessions → registrations (one session has many registrations)
- registrations → registration_timeline (one registration has many timeline entries)
- sessions → capacity_alerts (one session has at most one alert — enforced by UNIQUE)

**Many-to-many:**
- users ↔ sessions through `staff_assignments` (a staff member can be assigned to many sessions, and a session can have many staff members)

## Where constraints live and why

**In the database:**
- `UNIQUE(session_id, attendee_email)` — prevents double-registration at the DB level. Even if the application has a bug, the database won't allow it.
- `CHECK (end_date >= start_date)` — a basic sanity check that's cheap to enforce and impossible to forget.
- `CHECK (capacity > 0)` — a zero-capacity session makes no sense.
- `FOREIGN KEY ... ON DELETE CASCADE` — deleting an event automatically cleans up sessions, registrations, timeline, staff assignments, and alerts. No orphans.
- `FOREIGN KEY ... ON DELETE SET NULL` — if a user who created an event is deleted, the event survives with `created_by = NULL` instead of cascading a delete.
- `ENUM` for status and role — the database rejects any value not in the list.

**In the application:**
- **Capacity enforcement** — checking `active_count < capacity` requires a `SELECT ... FOR UPDATE` inside a transaction. A CHECK constraint can't do this because it would need to count rows in another table.
- **State machine transitions** — `reserved → confirmed` is valid, `checked_in → reserved` is not. This logic is too complex for a CHECK constraint; it lives in `registration.service.js` with an explicit `VALID_TRANSITIONS` map.
- **Hold window expiry** — "reserved for more than 30 minutes" is a time-relative condition. The MySQL scheduled event handles the bulk update, and the application also filters at read-time so counts are always accurate.

**Why the split:** I put hard structural constraints (uniqueness, referential integrity, value domains) in the database because they're the last line of defence. I put workflow rules (state machines, capacity counting, time-based expiry) in the application because they need transaction control, conditional logic, and access to configuration values.

## What I deliberately denormalised

Mostly nothing — the schema is normalized to 3NF. The one exception is:

- **Timestamp columns on registrations** (`confirmed_at`, `checked_in_at`, `cancelled_at`, `expired_at`) alongside the `status` ENUM. Strictly, the status is derivable from which timestamp is most recent. I kept both because: (a) queries like "all confirmed registrations" become a simple `WHERE status = 'confirmed'` instead of a complex timestamp comparison, and (b) the timestamps serve as an audit record ("when exactly was this confirmed?") separate from the timeline table.

## What would break first at 100× the data

1. **The registrations table** is the hottest table. At 100× data, the `listRegistrations` query with its `LIKE '%search%'` on `attendee_name` would degrade because leading-wildcard LIKE can't use an index. Fix: add a full-text index, or move search to Elasticsearch.

2. **The capacity check** does a `COUNT(*)` with `FOR UPDATE` on every registration attempt. Under high concurrency for a popular session, this creates lock contention. The lock is held for the duration of the transaction (which includes an INSERT and a timeline INSERT). Fix: maintain a denormalised `occupied_count` column on sessions, updated atomically with `UPDATE sessions SET occupied_count = occupied_count + 1 WHERE id = ? AND occupied_count < capacity`.

3. **The dashboard** runs four separate aggregate queries on every load. At scale, these would slow down. Fix: materialised views or a periodic background job that caches the dashboard stats.

4. **The MySQL scheduled event** runs `UPDATE registrations SET status = 'expired' WHERE status = 'reserved' AND reserved_at < NOW() - INTERVAL 30 MINUTE` every minute. At 100× data, this full-table scan becomes expensive. Fix: add a composite index on `(status, reserved_at)` — which I already did — and ensure the event scheduler's thread pool can handle it.
