const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const screeningRoutes = require('./routes/screening');
const requestLogger = require('./middleware/requestLogger');
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(express.json());
app.use(requestLogger);
app.use('/api', rateLimiter);

app.use('/api', screeningRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));