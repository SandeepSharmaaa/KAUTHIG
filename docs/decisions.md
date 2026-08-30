# Decisions

Log the decisions that actually shaped this codebase — the ones where a real alternative existed and
you picked one. At least five entries. For each: what you chose, what you rejected, and why. At least
one entry must be a decision you later reversed — say what changed your mind. It can be any entry
below, not necessarily the last one; add a **Later reversed:** line to whichever one it is.

## Decision 1

- **Chose:* I have choosen mysql2*
- **Rejected:* I rejected MongoDB*
- **Why:* Because i think that most of data of mine is relational and i have used mysql for my previous project*

## Decision 2

- **Chose:** JWT stores only the user's id; the actual role is looked up fresh from the `users` table on every request via the `authorize` middleware.
- **Rejected:** Embedding the role directly inside the JWT payload and trusting it without a database check.
- **Why:** If an organizer's role is changed or their account is disabled, a JWT with the role baked in would still carry the old role until the token expires (up to 24 hours per our JWT_EXPIRES_IN setting). Looking the role up fresh means a role change takes effect on the very next request instead of waiting for the token to expire.

## Decision 3

- **Chose:**
- **Rejected:**
- **Why:**

## Decision 4

- **Chose:**
- **Rejected:**
- **Why:**

## Decision 5

- **Chose:**
- **Rejected:**
- **Why:**
