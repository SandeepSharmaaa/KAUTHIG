// ============================================================
// registration.controller.js — Thin controller for registrations
// ============================================================

const registrationService = require('../services/registration.service');
const csvService = require('../services/csv.service');

async function create(req, res) {
    const { sessionId } = req.params;
    const { attendeeName, attendeeEmail } = req.body;
    const registration = await registrationService.createRegistration({
        sessionId,
        attendeeName,
        attendeeEmail,
        createdBy: req.user.id
    });
    res.status(201).json({ registration });
}

async function list(req, res) {
    const { sessionId, search, status, sort, order, page, limit } = req.query;
    const userId = req.user.role === 'check_in_staff' ? req.user.id : undefined;
    const result = await registrationService.listRegistrations({
        sessionId: sessionId ? parseInt(sessionId) : undefined,
        search,
        status,
        sort,
        order,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20,
        userId
    });
    res.json(result);
}

async function getOne(req, res) {
    const registration = await registrationService.getRegistrationById(req.params.id);
    res.json({ registration });
}

async function confirm(req, res) {
    const registration = await registrationService.confirmRegistration(req.params.id, req.user.id);
    res.json({ registration });
}

async function cancel(req, res) {
    const registration = await registrationService.cancelRegistration(req.params.id, req.user.id);
    res.json({ registration });
}

async function checkIn(req, res) {
    const registration = await registrationService.checkInRegistration(req.params.id, req.user.id);
    res.json({ registration });
}

async function addNote(req, res) {
    const entry = await registrationService.addNote(req.params.id, req.body.note, req.user.id);
    res.status(201).json({ timeline_entry: entry });
}

async function importCsv(req, res) {
    const { sessionId } = req.params;
    const { csvData } = req.body;
    const results = await csvService.importCsv(sessionId, csvData, req.user.id);
    res.json({ results });
}

async function exportCsv(req, res) {
    const { sessionId } = req.params;
    const csv = await csvService.exportCsv(sessionId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=registrations-session-${sessionId}.csv`);
    res.send(csv);
}

module.exports = { create, list, getOne, confirm, cancel, checkIn, addNote, importCsv, exportCsv };
