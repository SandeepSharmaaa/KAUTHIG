const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const config = require('./config/env');
const errorHandler = require('./middleware/errorHandler');


const app = express();

app.use(cors({
    origin: config.frontendOrigin,
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});







app.use(errorHandler);

app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
});