const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// SETUP MFA (generate QR + save secret)
exports.setupMFA = async (req, res) => {
  try {
    console.log(" setupMFA HIT");

    const secret = speakeasy.generateSecret({ length: 20 });

    const user = await User.findById(req.user._id);

    console.log("SETUP USER:", user.email, user._id);

    user.mfaSecret = secret.base32;
    await user.save();

    console.log(" SAVED MFA SECRET:", user.mfaSecret);

    const qrCode = await qrcode.toDataURL(secret.otpauth_url);

    res.json({ qrCode });

  } catch (err) {
    console.error("ERROR IN setupMFA:", err);
    res.status(500).json({ message: "Error setting up MFA" });
  }
};

// VERIFY MFA (check 6-digit code + issue JWT)
exports.verifyMFA = async (req, res) => {
  try {
    const { token, userId } = req.body;

    const user = await User.findById(userId);

    if (!user || !user.mfaSecret) {
      return res.status(400).json({ message: "MFA not set up" });
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: "base32",
      token,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({ message: "Invalid MFA token" });
    }

    // issue JWT AFTER MFA passes
    const jwtToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token: jwtToken });

  } catch (err) {
    console.error("ERROR IN verifyMFA:", err);
    res.status(500).json({ message: "Error verifying MFA" });
  }
};