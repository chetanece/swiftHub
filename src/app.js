const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const passport = require('passport');
const httpStatus = require('http-status');
const config = require('./config/config');
const morgan = require('./config/morgan');
const { jwtStrategy } = require('./config/passport');
const { authLimiter } = require('./middleware/rateLimiter');
const routes = require('./routes/v1');
const { errorConverter, errorHandler } = require('./middleware/error');
const ApiError = require('./utils/ApiError');

const app = express();

// Logging middleware (disabled in test environment)
if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// Security & parsing middlewares
app.use(helmet());
app.use(express.json({ limit: '50mb' })); // or higher if needed
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(compression());
app.use(cors());

// JWT authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

// Rate limiter (production only)
if (config.env === 'production') {
  app.use('/v1/auth', authLimiter);
}

// Default root route
app.get('/', (req, res) => {
  res.status(200).send('Server is up and running!');
});

// API routes
app.use('/v1', routes);

// Handle 404 for undefined routes
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// Error handling middlewares
app.use(errorConverter);
app.use(errorHandler);

module.exports = app;
