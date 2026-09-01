const authService = require('../services/auth.service');

async function login(req, res) {
    const { email, password } = req.body;

    const { token, user } = await authService.login(email, password);

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
    });

    res.json({ user });
}

async function logout(req, res) {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
}

async function me(req, res) {
    res.json({ user: req.user });
}

module.exports = {
    login,
    logout,
    me
};