const dashboardService = require('../services/dashboard.service');

async function getDashboard(req, res, next) {
    try {
        const data = await dashboardService.getDashboardData(req.user);
        res.json({ dashboard: data });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getDashboard
};
