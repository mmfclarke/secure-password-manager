const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },

  // MfA secret (base32 string)
  mfaSecret: {
    type: String,
  },
});

module.exports = mongoose.model("User", userSchema);