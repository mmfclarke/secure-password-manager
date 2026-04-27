const express = require('express');
const router = express.Router();

const { setupMFA, verifyMFA } = require('../controllers/totpController');

router.post('/setup', setupMFA);
router.post('/verify', verifyMFA);

module.exports = router;