// ============================================================
// csv.service.js — CSV import (parse + bulk reserve) and export
// ============================================================

const pool = require('../config/db');
const registrationService = require('./registration.service');

// ── Import CSV ─────────────────────────────────────────────
async function importCsv(sessionId, csvData, createdBy) {
    if (!csvData || typeof csvData !== 'string') {
        return { summary: { total: 0, created: 0, duplicates: 0, invalid: 0, capacityFull: 0 }, details: [] };
    }

    const lines = csvData.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length === 0) {
        return { summary: { total: 0, created: 0, duplicates: 0, invalid: 0, capacityFull: 0 }, details: [] };
    }

    // Skip header row if it looks like a header
    let startIdx = 0;
    const firstLine = lines[0].toLowerCase();
    if (firstLine.includes('name') || firstLine.includes('email')) {
        startIdx = 1;
    }

    const details = [];
    let created = 0, duplicates = 0, invalid = 0, capacityFull = 0;

    for (let i = startIdx; i < lines.length; i++) {
        const parts = lines[i].split(',').map(s => s.trim());
        const name = parts[0] || '';
        const email = parts[1] || '';
        const row = i + 1;

        // Validate
        if (!name || !email) {
            invalid++;
            details.push({ row, name, email, status: 'invalid', reason: 'Name and email are required' });
            continue;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            invalid++;
            details.push({ row, name, email, status: 'invalid', reason: 'Invalid email format' });
            continue;
        }

        // Attempt registration
        try {
            await registrationService.createRegistration({
                sessionId,
                attendeeName: name,
                attendeeEmail: email.toLowerCase(),
                createdBy
            });
            created++;
            details.push({ row, name, email, status: 'created' });
        } catch (err) {
            if (err.message.includes('already registered')) {
                duplicates++;
                details.push({ row, name, email, status: 'duplicate', reason: err.message });
            } else if (err.message.includes('full') || err.message.includes('no seats')) {
                capacityFull++;
                details.push({ row, name, email, status: 'capacity_full', reason: err.message });
            } else {
                invalid++;
                details.push({ row, name, email, status: 'invalid', reason: err.message });
            }
        }
    }

    const total = details.length;
    return { summary: { total, created, duplicates, invalid, capacityFull }, details };
}

// ── Export CSV ──────────────────────────────────────────────
async function exportCsv(sessionId) {
    const [rows] = await pool.query(
        `SELECT attendee_name, attendee_email, status, reserved_at, confirmed_at, checked_in_at
         FROM registrations
         WHERE session_id = ?
         ORDER BY attendee_name ASC`,
        [sessionId]
    );

    const header = 'name,email,status,reserved_at,confirmed_at,checked_in_at';
    const lines = rows.map(r =>
        [r.attendee_name, r.attendee_email, r.status, r.reserved_at || '', r.confirmed_at || '', r.checked_in_at || '']
            .map(field => `"${String(field).replace(/"/g, '""')}"`)
            .join(',')
    );

    return [header, ...lines].join('\n');
}

module.exports = { importCsv, exportCsv };
