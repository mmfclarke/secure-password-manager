const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const totpRoutes = require('./routes/totpRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Connect to DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("TOTP DB connected"))
  .catch(err => console.error(err));

app.use('/totp', totpRoutes);

const PORT = process.env.PORT || 4000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("TOTP DB connected");

    app.listen(PORT, () => {
      console.log(`TOTP service running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error("DB connection error:", err);
  });