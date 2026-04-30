require("dotenv").config();

// Validate required env vars
const REQUIRED_ENV = [
  "MONGO_URI",
  "JWT_SECRET",
  "FRONTEND_ORIGIN",
  "TOTP_INTERNAL_SECRET"
];

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`Missing required env var: ${key}`);
    process.exit(1);
  }
}

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const credentialsRoutes = require("./routes/credentialsRoutes");
const internalRoutes = require("./routes/internalRoutes");

const app = express();

// Security middleware
app.use(helmet());

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN,
  credentials: true,
}));

app.use(express.json({ limit: "100kb" }));

// Health check route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);

// Auth rate limiter (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

// Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/credentials", credentialsRoutes);
app.use("/api/internal", internalRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON payload" });
  }

  res.status(500).json({ error: "Server error" });
});

// Connect DB + start server
mongoose.connect(process.env.MONGO_URI, {
  tlsCAFile: process.env.MONGO_TLS_CA_FILE,
})
.then(() => {
  console.log("MongoDB connected");

  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})
.catch((err) => {
  console.error("MongoDB connection error:", err);
  process.exit(1);
});
