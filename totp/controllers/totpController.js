const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const axios = require("axios");

const backendApi = axios.create({
  baseURL: process.env.BACKEND_API_URL,
  headers: {
    "x-internal-secret": process.env.TOTP_INTERNAL_SECRET,
  },
});

exports.setupMFA = async (req, res) => {
  try {
    const { userId } = req.body;

    const secret = speakeasy.generateSecret({ length: 20 });

    await backendApi.put(`/api/internal/users/${userId}/totp`, {
      totpSecret: secret.base32,
    });

    const otpauthUrl = speakeasy.otpauthURL({
      secret: secret.base32,
      label: "SecurePasswordManager",
      issuer: "SecurePasswordManager",
      encoding: "base32",
    });

    const qrCode = await qrcode.toDataURL(otpauthUrl);

    res.json({ qrCode });
  } catch (err) {
    console.error("setupMFA error:", err.message);
    res.status(500).json({ message: "Failed to set up MFA" });
  }
};

exports.verifyMFA = async (req, res) => {
  try {
    const { userId, token } = req.body;

    const { data: secretData } = await backendApi.get(
      `/api/internal/users/${userId}/totp-secret`
    );

    const verified = speakeasy.totp.verify({
      secret: secretData.totpSecret,
      encoding: "base32",
      token,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({ message: "Invalid MFA token" });
    }

    const { data: authData } = await backendApi.post(
      `/api/internal/users/${userId}/complete-mfa`
    );

    res.json({ token: authData.token });
  } catch (err) {
    console.error("verifyMFA error:", err.message);
    res.status(500).json({ message: "Failed to verify MFA" });
  }
};
