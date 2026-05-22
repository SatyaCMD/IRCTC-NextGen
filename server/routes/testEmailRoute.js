const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

router.get('/', async (req, res) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        // Test the connection
        await transporter.verify();

        // Try to send a test email
        const info = await transporter.sendMail({
            from: \`"IRCTC NextGen Test" <\${process.env.SMTP_USER}>\`,
            to: process.env.SMTP_USER, // Send to themselves
            subject: 'SMTP Diagnostic Test',
            text: 'If you are reading this, your Render SMTP configuration is working perfectly on port 465!'
        });

        res.json({
            status: 'SUCCESS',
            message: 'Email connected and sent successfully!',
            messageId: info.messageId,
            envVariablesDetected: {
                host: process.env.SMTP_HOST ? 'Present' : 'MISSING',
                user: process.env.SMTP_USER ? 'Present' : 'MISSING',
                pass: process.env.SMTP_PASS ? 'Present' : 'MISSING'
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'FAILED',
            errorName: error.name,
            errorMessage: error.message,
            errorCode: error.code,
            errorCommand: error.command,
            envVariablesDetected: {
                host: process.env.SMTP_HOST ? 'Present' : 'MISSING',
                user: process.env.SMTP_USER ? 'Present' : 'MISSING',
                pass: process.env.SMTP_PASS ? 'Present' : 'MISSING'
            }
        });
    }
});

module.exports = router;
