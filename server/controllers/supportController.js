const SupportTicket = require('../models/SupportTicket');
const emailService = require('../services/emailService');
const User = require('../models/User');

exports.createTicket = async (req, res) => {
    try {
        const { issueType, description } = req.body;
        const userId = req.user.id; // From authMiddleware

        // Handle uploaded files
        const documents = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

        // Generate random ticket number TKT-XXXXX
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        const ticketNumber = `TKT-${randomNum}`;

        const ticket = new SupportTicket({
            ticketNumber,
            user: userId,
            issueType,
            description,
            documents
        });

        await ticket.save();

        // Get user details for email
        const user = await User.findById(userId);

        // Send Email asynchronously
        try { await emailService.sendTicketRaisedEmail(user.email, user.name || 'User', ticketNumber, issueType); } catch(err) { console.error("Email silently failed:", err.message); }

        res.status(201).json({ message: 'Ticket raised successfully', ticketNumber });
    } catch (err) {
        console.error('Error creating ticket:', err);
        res.status(500).json({ message: 'Server error while creating ticket' });
    }
};

exports.getAllTickets = async (req, res) => {
    try {
        const tickets = await SupportTicket.find()
            .populate('user', 'name email mobile')
            .sort({ createdAt: -1 });
        
        res.json(tickets);
    } catch (err) {
        console.error('Error fetching tickets:', err);
        res.status(500).json({ message: 'Server error while fetching tickets' });
    }
};

exports.resolveTicket = async (req, res) => {
    try {
        const { id } = req.params;

        const ticket = await SupportTicket.findById(id).populate('user', 'name email');
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (ticket.status === 'Resolved') {
            return res.status(400).json({ message: 'Ticket is already resolved' });
        }

        ticket.status = 'Resolved';
        await ticket.save();

        // Send resolution email
        try { await emailService.sendTicketResolvedEmail(ticket.user.email, ticket.user.name || 'User', ticket.ticketNumber, ticket.issueType); } catch(err) { console.error("Email silently failed:", err.message); }

        res.json({ message: 'Ticket marked as resolved successfully', ticket });
    } catch (err) {
        console.error('Error resolving ticket:', err);
        res.status(500).json({ message: 'Server error while resolving ticket' });
    }
};
