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
    'https://enterprise-feature-flag-bayesian-ex.vercel.app',
    process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(express.json());
app.use(morgan('dev'));

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


