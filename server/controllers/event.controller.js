const eventService = require('../services/event.service');

async function list(req, res) {
    const includeArchived = req.query.includeArchived === 'true';
    const events = await eventService.listEvents({ includeArchived });
    res.json({ events });
}

async function getOne(req, res) {
    const event = await eventService.getEventById(req.params.id);
    res.json({ event });
}

async function create(req, res) {
    const { name, description, startDate, endDate, venue } = req.body;
    const event = await eventService.createEvent({
        name,
        description,
        startDate,
        endDate,
        venue,
        createdBy: req.user.id
    });
    res.status(201).json({ event });
}

async function update(req, res) {
    const { name, description, startDate, endDate, venue } = req.body;
    const event = await eventService.updateEvent(req.params.id, {
        name,
        description,
        startDate,
        endDate,
        venue
    });
    res.json({ event });
}

async function archive(req, res) {
    const { isArchived } = req.body;
    const event = await eventService.setArchiveStatus(req.params.id, isArchived);
    res.json({ event });
}

module.exports = {
    list,
    getOne,
    create,
    update,
    archive
};