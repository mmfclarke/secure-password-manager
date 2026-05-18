const express = require("express");
const router = express.Router();
const Credential = require("../models/Credential");
const authMiddleware = require("../middleware/authMiddleware");
const mongoose = require("mongoose");

// Protect all routes
router.use(authMiddleware);

// Input Validation
function validateCredentialInput(body, { requireEncryptedData }) {

  // Ensure request body exists
  if (!body || typeof body !== "object") {
    return "Invalid request body";
  }

  let { 
    title, 
    website,
    category, 
    encryptedData 
  } = body;

  if (title !==undefined && typeof title !== "string") {
    return "Title must be a string";
  }

  if (website !==undefined && typeof website !== "string") {
    return "Website must be a string";
  }

  if (category !==undefined && typeof category !== "string") {
    return "Category must be a string";
  }

  if (encryptedData !== undefined && typeof encryptedData !== "object") {
    return "Encrypted data must be an object";
  }

  if (title) {
    title = title.trim();   
  }

  if (website) {
    website = website.trim();
  }

  if (category) {
    category = category.trim().toLowerCase();
  }

  if (!title || title.length === 0) {
    return "Title is required";
  }

  if (requireEncryptedData && !encryptedData) {
    return "Encrypted data is required";
  }

  if (title && title.length > 100) {
    return "Title is too long";
  }

  if (website && website.length > 200) {
    return "Website is too long";
  }

  if (category && category.length > 50) {
    return "Category is too long";
  }

  if (encryptedData) {
    const requiredFields = [
      "ciphertext", "iv", "salt"
    ];

    for (const field of requiredFields) {
      if (!encryptedData[field] || typeof encryptedData[field] !== "string") {
        return `Encrypted data must include ${field} as a string`;
      }
    }
  }

  return {
    title,
    website, 
    category,
    encryptedData
  };
}

// CREATE
router.post("/", async (req, res) => {
  try {
    const result = validateCredentialInput(req.body, { 
      requireEncryptedData: true 
    });

    if (typeof result === "string") {
      return res.status(400).json({
        error: result,
      });
    }

    const {
      title, 
      website,
      category, 
      encryptedData
    } = result;

    const credential = await Credential.create({
      userId: req.user._id,
      title,
      website,
      category,
      encryptedData,
    });

    res.status(201).json(credential);

  } catch (err) {
    console.error(err);

    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: "Failed to create credential" });
  }
});

// GET ALL
router.get("/", async (req, res) => {
  try {
    const credentials = await Credential.find({
      userId: req.user._id,
    });

    res.json(credentials);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch credentials" });
  }
});

// GET ONE
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "Not found" });
    }

    const credential = await Credential.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!credential) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json(credential);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch credential" });
  }
});

// UPDATE
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "Not found" });
    }

    const result = validateCredentialInput(req.body, {
      requireEncryptedData: false,
    });

    if (typeof result === "string") {
      return res.status(400).json({
        error: result,
      });
    }

    const update = {};

    for (const key of ["title", "website", "category", "encryptedData"]) {
      if (result[key] !== undefined) {
        update[key] = result[key];
      }
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const updated = await Credential.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      update,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json(updated);

  } catch (err) {
  console.error(err);

  if (err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ error: "Failed to update credential" });
}
});
// DELETE
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: "Not found" });
    }

    const deleted = await Credential.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json({ message: "Deleted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete credential" });
  }
});

module.exports = router; 
