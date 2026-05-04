const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
dotenv.config();

const getRouter    = require('./routes/getScreenings');
const postRouter   = require('./routes/postScreening');
const putRouter    = require('./routes/putScreening');
const deleteRouter = require('./routes/deleteScreening');

const requestLogger = require('./middleware/requestLogger');
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.redirect('/login.html');
});

app.use(requestLogger);
app.use('/api', rateLimiter);

app.use('/api', getRouter);
app.use('/api', postRouter);
app.use('/api/screenings', putRouter);
app.use('/api/screenings', deleteRouter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;