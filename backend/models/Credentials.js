const mongoose = require("mongoose");

const encryptedDataSchema = new mongoose.Schema({
  ciphertext: {
    type: String,
    required: true,
  },
  iv: {
    type: String,
    required: true,
  },
  salt: {
    type: String,
    required: true,
  },
}, { _id: false });

const credentialSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  website: {
    type: String,
    default: null,
  },
  category: {
    type: String,
    enum: ["personal", "work", "finance", "social", "other"],
    default: "other",
  },
  encryptedData: {
    type: encryptedDataSchema,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("Credential", credentialSchema);