const sessionService = require('../services/session.service');

async function create(req, res, next) {
    try {
        const { eventId } = req.params;
        const session = await sessionService.createSession({
            eventId,
            ...req.body
        });
        res.status(201).json(session);
    } catch (error) {
        next(error);
    }
}

async function list(req, res, next) {
    try {
        const { eventId } = req.params;
        const sessions = await sessionService.listSessions(eventId);
        res.json(sessions);
    } catch (error) {
        next(error);
    }
}

async function getOne(req, res, next) {
    try {
        const { id } = req.params;
        const session = await sessionService.getSessionById(id);
        res.json(session);
    } catch (error) {
        next(error);
    }
}

async function update(req, res, next) {
    try {
        const { id } = req.params;
        const session = await sessionService.updateSession(id, req.body);
        res.json(session);
    } catch (error) {
        next(error);
    }
}

async function remove(req, res, next) {
    try {
        const { id } = req.params;
        await sessionService.deleteSession(id);
        res.status(204).end();
    } catch (error) {
        next(error);
    }
}

module.exports = {
    create,
    list,
    getOne,
    update,
    remove
};
