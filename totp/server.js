const express = require("express");
const cors = require("cors");
require("dotenv").config();

const totpRoutes = require("./routes/totpRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/totp", totpRoutes);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`TOTP service running on port ${PORT}`);
});
