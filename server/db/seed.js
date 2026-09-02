// ============================================================
// seed.js — Populate database with demo data
// Run: node server/db/seed.js
// ============================================================

const bcrypt = require('bcrypt');
const path = require('path');

// Load env from project root
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const pool = require('../config/db');

(async () => {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log('🌱 Starting database seeding...\n');

        // ── Clear existing data (in FK-safe order) ─────────
        await conn.query('SET FOREIGN_KEY_CHECKS = 0');
        await conn.query('TRUNCATE TABLE capacity_alerts');
        await conn.query('TRUNCATE TABLE registration_timeline');
        await conn.query('TRUNCATE TABLE registrations');
        await conn.query('TRUNCATE TABLE staff_assignments');
        await conn.query('TRUNCATE TABLE sessions');
        await conn.query('TRUNCATE TABLE events');
        await conn.query('TRUNCATE TABLE users');
        await conn.query('SET FOREIGN_KEY_CHECKS = 1');

        // ── Hash password ──────────────────────────────────
        const hash = await bcrypt.hash('password123', 12);

        // ── Users ──────────────────────────────────────────
        console.log('  ✓ Seeding users...');
        await conn.query(
            `INSERT INTO users (name, email, password_hash, role) VALUES
                ('Priya Sharma',  'priya@kauthig.com',  ?, 'organizer'),
                ('Rahul Verma',   'rahul@kauthig.com',  ?, 'organizer'),
                ('Anita Desai',   'anita@kauthig.com',  ?, 'check_in_staff'),
                ('Vikram Singh',  'vikram@kauthig.com', ?, 'check_in_staff'),
                ('Meera Patel',   'meera@kauthig.com',  ?, 'check_in_staff')`,
            [hash, hash, hash, hash, hash]
        );

        // Fetch IDs
        const [users] = await conn.query('SELECT id, email FROM users');
        const uid = (email) => users.find(u => u.email === email).id;

        // ── Events ─────────────────────────────────────────
        console.log('  ✓ Seeding events...');
        await conn.query(
            `INSERT INTO events (name, description, start_date, end_date, venue, created_by) VALUES
                ('TechConnect 2025', 'Annual technology conference with workshops and keynotes', '2025-08-15', '2025-08-17', 'Convention Center, Bangalore', ?),
                ('DevSummit 2026',   'Developer summit featuring cloud, DevOps, and microservices', '2026-09-01', '2026-09-03', 'Tech Park, Hyderabad', ?),
                ('DataFest 2025',    'Data engineering and analytics conference',                  '2025-10-10', '2025-10-12', 'Grand Hotel, Mumbai', ?)`,
            [uid('priya@kauthig.com'), uid('priya@kauthig.com'), uid('rahul@kauthig.com')]
        );

        const [events] = await conn.query('SELECT id, name FROM events');
        const eid = (name) => events.find(e => e.name === name).id;

        // ── Sessions ───────────────────────────────────────
        console.log('  ✓ Seeding sessions...');
        await conn.query(
            `INSERT INTO sessions (event_id, title, start_time, duration_minutes, location, capacity) VALUES
                (?, 'Opening Keynote',         '2025-08-15 09:00:00', 90,  'Main Hall',       30),
                (?, 'React Workshop',          '2025-08-15 11:00:00', 120, 'Workshop Room A',  20),
                (?, 'Cloud Architecture',      '2025-08-16 10:00:00', 60,  'Conference Room B', 15),
                (?, 'AI in Production',        '2026-09-01 09:30:00', 90,  'Auditorium',       25),
                (?, 'Microservices Deep Dive', '2026-09-01 14:00:00', 120, 'Workshop Room 1',  20),
                (?, 'DevOps Best Practices',   '2026-09-02 10:00:00', 60,  'Conference Room A', 15),
                (?, 'Lightning Talks',         '2026-09-02 15:00:00', 90,  'Main Stage',       40),
                (?, 'Data Engineering 101',    '2025-10-10 09:00:00', 120, 'Lab Room 1',       30),
                (?, 'ML Pipeline Workshop',    '2025-10-11 10:00:00', 120, 'Lab Room 2',       20),
                (?, 'Analytics Dashboard Demo','2025-10-11 14:00:00', 60,  'Demo Room',        10)`,
            [
                eid('TechConnect 2025'), eid('TechConnect 2025'), eid('TechConnect 2025'),
                eid('DevSummit 2026'), eid('DevSummit 2026'), eid('DevSummit 2026'), eid('DevSummit 2026'),
                eid('DataFest 2025'), eid('DataFest 2025'), eid('DataFest 2025')
            ]
        );

        const [sessions] = await conn.query('SELECT id, title FROM sessions');
        const sid = (title) => sessions.find(s => s.title === title).id;

        // ── Staff Assignments ──────────────────────────────
        console.log('  ✓ Seeding staff assignments...');
        await conn.query(
            `INSERT INTO staff_assignments (user_id, session_id) VALUES
                (?, ?), (?, ?), (?, ?), (?, ?), (?, ?), (?, ?)`,
            [
                uid('anita@kauthig.com'),  sid('AI in Production'),
                uid('anita@kauthig.com'),  sid('Microservices Deep Dive'),
                uid('vikram@kauthig.com'), sid('DevOps Best Practices'),
                uid('vikram@kauthig.com'), sid('Lightning Talks'),
                uid('meera@kauthig.com'),  sid('Data Engineering 101'),
                uid('meera@kauthig.com'),  sid('ML Pipeline Workshop')
            ]
        );

        // ── Registrations ──────────────────────────────────
        console.log('  ✓ Seeding registrations...');
        const attendees = [
            { name: 'Amitabh Kumar',   email: 'amitabh@example.com' },
            { name: 'Deepika Rao',     email: 'deepika@example.com' },
            { name: 'Shahrukh Ali',    email: 'shahrukh@example.com' },
            { name: 'Priyanka Joshi',  email: 'priyankaj@example.com' },
            { name: 'Salman Khan',     email: 'salman@example.com' },
            { name: 'Katrina Nair',    email: 'katrina@example.com' },
            { name: 'Aamir Hussain',   email: 'aamir@example.com' },
            { name: 'Kareena Mehta',   email: 'kareena@example.com' },
            { name: 'Akshay Patel',    email: 'akshay@example.com' },
            { name: 'Alia Bhatt',      email: 'alia@example.com' },
            { name: 'Ranbir Kapoor',   email: 'ranbir@example.com' },
            { name: 'Anushka Reddy',   email: 'anushka@example.com' }
        ];

        const regConfigs = [
            // Session                      Attendee idx   Status         Has extra timeline?
            { session: 'Opening Keynote',         ai: 0,  status: 'checked_in' },
            { session: 'Opening Keynote',         ai: 1,  status: 'checked_in' },
            { session: 'Opening Keynote',         ai: 2,  status: 'confirmed' },
            { session: 'Opening Keynote',         ai: 3,  status: 'confirmed' },
            { session: 'Opening Keynote',         ai: 4,  status: 'reserved' },
            { session: 'React Workshop',          ai: 0,  status: 'confirmed' },
            { session: 'React Workshop',          ai: 5,  status: 'reserved' },
            { session: 'React Workshop',          ai: 6,  status: 'cancelled' },
            { session: 'Cloud Architecture',      ai: 7,  status: 'confirmed' },
            { session: 'Cloud Architecture',      ai: 8,  status: 'reserved' },
            { session: 'AI in Production',        ai: 0,  status: 'checked_in' },
            { session: 'AI in Production',        ai: 1,  status: 'confirmed' },
            { session: 'AI in Production',        ai: 9,  status: 'reserved' },
            { session: 'Microservices Deep Dive', ai: 2,  status: 'confirmed' },
            { session: 'Microservices Deep Dive', ai: 3,  status: 'cancelled' },
            { session: 'Microservices Deep Dive', ai: 10, status: 'reserved' },
            { session: 'DevOps Best Practices',   ai: 4,  status: 'confirmed' },
            { session: 'DevOps Best Practices',   ai: 5,  status: 'checked_in' },
            { session: 'Lightning Talks',         ai: 6,  status: 'reserved' },
            { session: 'Lightning Talks',         ai: 7,  status: 'confirmed' },
            { session: 'Data Engineering 101',    ai: 8,  status: 'confirmed' },
            { session: 'Data Engineering 101',    ai: 9,  status: 'checked_in' },
            { session: 'Data Engineering 101',    ai: 11, status: 'expired' },
            { session: 'ML Pipeline Workshop',    ai: 0,  status: 'confirmed' },
            { session: 'ML Pipeline Workshop',    ai: 10, status: 'reserved' },
            { session: 'Analytics Dashboard Demo',ai: 1,  status: 'checked_in' },
            { session: 'Analytics Dashboard Demo',ai: 2,  status: 'confirmed' },
            { session: 'Analytics Dashboard Demo',ai: 3,  status: 'confirmed' },
            { session: 'Analytics Dashboard Demo',ai: 4,  status: 'reserved' },
            { session: 'Analytics Dashboard Demo',ai: 5,  status: 'cancelled' }
        ];

        const createdById = uid('priya@kauthig.com');

        for (const cfg of regConfigs) {
            const a = attendees[cfg.ai];
            const sessionId = sid(cfg.session);

            // Determine timestamps
            const tsCol = {
                confirmed: 'confirmed_at',
                checked_in: 'checked_in_at',
                cancelled: 'cancelled_at',
                expired: 'expired_at'
            };

            let extraCol = '';
            let extraVal = [];
            if (cfg.status !== 'reserved' && tsCol[cfg.status]) {
                extraCol = `, ${tsCol[cfg.status]}`;
                extraVal = [new Date()];
            }

            const [result] = await conn.query(
                `INSERT INTO registrations (session_id, attendee_name, attendee_email, status, reserved_at, created_by${extraCol})
                 VALUES (?, ?, ?, ?, NOW() - INTERVAL 2 HOUR, ?${extraVal.length ? ', ?' : ''})`,
                [sessionId, a.name, a.email, cfg.status, createdById, ...extraVal]
            );

            const regId = result.insertId;

            // Timeline: creation entry
            await conn.query(
                `INSERT INTO registration_timeline (registration_id, action, new_status, performed_by, performed_at)
                 VALUES (?, 'created', 'reserved', ?, NOW() - INTERVAL 2 HOUR)`,
                [regId, createdById]
            );

            // Timeline: status transition
            if (cfg.status !== 'reserved') {
                await conn.query(
                    `INSERT INTO registration_timeline (registration_id, action, old_status, new_status, performed_by, performed_at)
                     VALUES (?, 'status_change', 'reserved', ?, ?, NOW() - INTERVAL 1 HOUR)`,
                    [regId, cfg.status, cfg.status === 'expired' ? null : createdById]
                );
            }

            // Extra: if checked_in, add a confirmed step too
            if (cfg.status === 'checked_in') {
                await conn.query(
                    `UPDATE registrations SET confirmed_at = NOW() - INTERVAL 90 MINUTE WHERE id = ?`,
                    [regId]
                );
            }
        }

        // ── Capacity Alert for Analytics Dashboard Demo ────
        console.log('  ✓ Seeding capacity alerts...');
        await conn.query(
            `INSERT INTO capacity_alerts (session_id) VALUES (?)`,
            [sid('Analytics Dashboard Demo')]
        );

        console.log('\n🎉 Seeding complete! Demo credentials:');
        console.log('   Organizer:  priya@kauthig.com / password123');
        console.log('   Staff:      anita@kauthig.com / password123\n');

    } catch (err) {
        console.error('❌ Seeding failed:', err.message);
        console.error(err.stack);
    } finally {
        if (conn) conn.release();
        await pool.end();
        process.exit(0);
    }
})();
