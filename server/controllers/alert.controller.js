const alertService = require('../services/alert.service');

async function list(req, res, next) {
    try {
        const alerts = await alertService.getAlerts();
        res.json({ alerts });
    } catch (error) {
        next(error);
    }
}

async function count(req, res, next) {
    try {
        const count = await alertService.getAlertCount();
        res.json({ count });
    } catch (error) {
        next(error);
    }
}

async function dismiss(req, res, next) {
    try {
        await alertService.dismissAlert(req.params.sessionId);
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    list,
    count,
    dismiss
};
