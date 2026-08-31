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
    port: process.env.PORT,
    db: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        name: process.env.DB_NAME
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN
    },
    reservationHoldMinutes: Number(process.env.RESERVATION_HOLD_MINUTES),
    frontendOrigin: process.env.FRONTEND_ORIGIN
};