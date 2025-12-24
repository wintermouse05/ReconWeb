require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const scanRoutes = require('./routes/scanRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const codeReviewRoutes = require('./routes/codeReviewRoutes');
const remediationRoutes = require('./routes/remediationRoutes');

const app = express();

const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim())
  : ['http://localhost:5173'];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/code-review', codeReviewRoutes);
app.use('/api/remediation', remediationRoutes);

app.use((err, _req, res, _next) => {
  // Fallback error handler to avoid leaking implementation details
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ message });
});

const PORT = process.env.PORT || 5000;

const bootstrap = async () => {
  try {
    await connectDB(process.env.MONGODB_URI);
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
};

bootstrap();
