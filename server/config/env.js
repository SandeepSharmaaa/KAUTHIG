require('dotenv').config();

const requiredVars = [
    'PORT',
    'DB_HOST',
    'DB_PORT',
    'DB_USER',
    'DB_NAME',
    'JWT_SECRET',
    'JWT_EXPIRES_IN',
    'RESERVATION_HOLD_MINUTES'
];

const missing = requiredVars.filter((key) => !process.env[key]);

if (missing.length > 0) {
    console.error('Missing required environment variables:', missing.join(', '));
    process.exit(1);
}

module.exports = {
    port: parseInt(process.env.PORT, 10) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    db: {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10) || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD || '',
        name: process.env.DB_NAME
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    },
    reservationHoldMinutes: Number(process.env.RESERVATION_HOLD_MINUTES) || 30,
    frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000'
};