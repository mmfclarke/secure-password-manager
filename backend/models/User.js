const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  masterPasswordHash: {
    type: String,
    required: true,
  },
  totpSecret: {
    type: String,
    default: null,
  },
  mfaEnabled: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);