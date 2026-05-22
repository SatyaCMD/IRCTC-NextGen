const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createTicket, getAllTickets, resolveTicket } = require('../controllers/supportController');
const authMiddleware = require('../middleware/authMiddleware');

// Ensure uploads directory exists only if not on Vercel
const uploadDir = path.join(__dirname, '../public/uploads');
if (!process.env.VERCEL && !process.env.VERCEL_REGION) {
    if (!fs.existsSync(uploadDir)) {
        try {
            fs.mkdirSync(uploadDir, { recursive: true });
        } catch (err) {
            console.error('Failed to create upload directory:', err);
        }
    }
}

// Configure Multer for document uploads
let storage;
if (process.env.VERCEL || process.env.VERCEL_REGION) {
    // Vercel has a read-only filesystem, so we MUST use memory storage
    storage = multer.memoryStorage();
} else {
    // Render and Local dev can use disk storage
    storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, uploadDir);
        },
        filename: function (req, file, cb) {
            cb(null, 'ticket-' + Date.now() + path.extname(file.originalname));
        }
    });
}

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Routes
router.post('/', authMiddleware, upload.array('documents', 5), createTicket);
router.get('/admin', authMiddleware, getAllTickets);
router.put('/admin/:id/resolve', authMiddleware, resolveTicket);

module.exports = router;
