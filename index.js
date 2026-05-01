const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
dotenv.config();

const screeningRoutes = require('./routes/screening');
const historyRoutes = require('./routes/history');
const requestLogger = require('./middleware/requestLogger');
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(requestLogger);
app.use('/api', rateLimiter);

app.use('/api', screeningRoutes);
app.use('/api', historyRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));