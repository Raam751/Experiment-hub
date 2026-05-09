const express = require('express');
require('express-async-errors');    // Must be required right after express
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// Middleware
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.FRONTEND_URL       // set this to your Vercel URL in production
].filter(Boolean);

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(express.json());           // Parses JSON request bodies
app.use(morgan('dev'));            // Logs: "POST /auth/login 200 12ms"

// Routes

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Routes — ORDER MATTERS! Unauthenticated/API-key routes first.
app.use('/auth', require('./routes/auth.routes'));
app.use('/', require('./routes/runtime.routes'));       // No JWT — assign + events
app.use('/internal', require('./routes/internal.routes')); // API key — bandit callback
app.use('/experiments', require('./routes/experiment.routes'));
app.use('/experiments', require('./routes/metrics.routes'));
app.use('/experiments', require('./routes/optimize.routes'));
app.use('/experiments', require('./routes/simulate.routes'));
app.use('/', require('./routes/variant.routes'));

const logger = require('./configs/logger');

app.use((err, req, res, next) => {
    logger.error({ err, path: req.path, method: req.method }, err.message);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
        }
    });
});

// handling 404 error
app.use((req, res, next) => {
    res.status(404).json({ error: 'Not Found' });
});


module.exports = app;


