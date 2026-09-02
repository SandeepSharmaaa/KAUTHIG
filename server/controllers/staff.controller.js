const staffService = require('../services/staff.service');

async function list(req, res, next) {
    try {
        const { sessionId } = req.params;
        const staff = await staffService.listStaff(sessionId);
        res.json(staff);
    } catch (error) {
        next(error);
    }
}

async function assign(req, res, next) {
    try {
        const { sessionId } = req.params;
        const { userId } = req.body;
        await staffService.assignStaff(sessionId, userId);
        res.status(201).json({ message: 'Staff assigned successfully' });
    } catch (error) {
        next(error);
    }
}

async function remove(req, res, next) {
    try {
        const { sessionId, userId } = req.params;
        await staffService.removeStaff(sessionId, userId);
        res.status(204).end();
    } catch (error) {
        next(error);
    }
}

async function myAssignments(req, res, next) {
    try {
        const userId = req.user.id;
        const assignments = await staffService.getMyAssignments(userId);
        res.json(assignments);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    list,
    assign,
    remove,
    myAssignments
};
