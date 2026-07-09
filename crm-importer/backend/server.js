const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const importRouter = require('./routes/import');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS for frontend integration
app.use(cors({
  origin: '*', // Allow requests from any origin (e.g. Next.js port)
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register routes
app.use('/api', importRouter);

app.get('/', (req, res) => {
  res.json({
    status: "online",
    message: "GrowEasy CRM Importer Backend API is online.",
    openaiConfigured: !!process.env.OPENAI_API_KEY
  });
});

app.use((err, req, res, next) => {
  console.error("❌ Express Unhandled Error:", err);
  res.status(500).json({ error: "Something went wrong: " + err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
