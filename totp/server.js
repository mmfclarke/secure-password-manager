require("dotenv").config();
const express = require("express");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("TOTP service is running...");
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`TOTP service running on port ${PORT}`);
});
