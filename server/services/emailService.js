const nodemailer = require('nodemailer');
const { jsPDF } = require('jspdf');
require('jspdf-autotable');

let transporter;

async function initEmailService() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        // Use real SMTP credentials from .env
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
        console.log(`Live SMTP Server Initialized (${process.env.SMTP_HOST}). Emails will be sent to real inboxes.`);
    } else {
        // Fallback to Ethereal Email Account (Fake SMTP for testing)
        nodemailer.createTestAccount((err, account) => {
            if (err) {
                console.error('Failed to create a testing account. ' + err.message);
                return;
            }
            
            transporter = nodemailer.createTransport({
                host: account.smtp.host,
                port: account.smtp.port,
                secure: account.smtp.secure,
                auth: {
                    user: account.user,
                    pass: account.pass
                }
            });
            console.log(`Ethereal Email initialized. Emails will be logged to console. Add SMTP credentials in .env to use real emails.`);
        });
    }
}

initEmailService();

const getBaseHtml = (title, content, preheader = "") => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <span style="display:none;font-size:1px;color:#f3f4f6;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</span>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f3f4f6; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); max-width: 600px; margin: 0 auto;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #ffffff; border-bottom: 2px solid #e2e8f0;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td width="25%" align="center" style="padding: 15px;">
                                        <img src="cid:ashokstambh" height="55" alt="Emblem of India" style="display: block; border: 0;" />
                                    </td>
                                    <td width="50%" align="center" style="padding: 20px 0;">
                                        <h1 style="color: #000000; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 1px; white-space: nowrap;">IRCTC NextGen</h1>
                                        <p style="color: #334155; margin: 5px 0 0 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; white-space: nowrap;">${title}</p>
                                    </td>
                                    <td width="25%" align="center" style="padding: 15px;">
                                        <img src="cid:irlogo" height="55" alt="IRCTC Logo" style="display: block; border: 0;" />
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 30px; color: #334155; font-size: 15px; line-height: 1.6;">
                            ${content}
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 25px 30px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px; line-height: 1.5;">
                            <p style="margin: 0 0 10px 0;">
                                <strong>Need Help?</strong> Contact our 24/7 customer support at<br>
                                <a href="mailto:support@irctc-nextgen.com" style="color: #2563eb; text-decoration: none;">support@irctc-nextgen.com</a> | 1800-111-139
                            </p>
                            <p style="margin: 0 0 15px 0;">
                                You are receiving this email because of an automated action performed on your IRCTC NextGen account. 
                                Please do not reply directly to this message.
                            </p>
                            <div style="padding-top: 15px; border-top: 1px solid #cbd5e1;">
                                <p style="margin: 0;">&copy; ${new Date().getFullYear()} IRCTC NextGen. All rights reserved.</p>
                                <p style="margin: 5px 0 0 0;">Ministry of Railways, Government of India</p>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

exports.sendSecurityAlert = async (userEmail, action, ip, device, location) => {
    if (!transporter) return;

    const content = `
        <h2 style="color: #0f172a; margin-top: 0;">Security Alert: ${action}</h2>
        <p>Dear Customer,</p>
        <p>We detected a new security event on your IRCTC NextGen account. Please review the details below:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 25px 0; background-color: #f8fafc; border-radius: 6px; overflow: hidden; border: 1px solid #e2e8f0;">
            <tr><td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #475569; width: 35%;"><strong>Action</strong></td><td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 600;">${action}</td></tr>
            <tr><td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #475569;"><strong>Date & Time</strong></td><td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)</td></tr>
            <tr><td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #475569;"><strong>IP Address</strong></td><td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${ip}</td></tr>
            <tr><td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #475569;"><strong>Location</strong></td><td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${location}</td></tr>
            <tr><td style="padding: 12px 15px; color: #475569;"><strong>Device/Browser</strong></td><td style="padding: 12px 15px; color: #0f172a;">${device}</td></tr>
        </table>
        
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin-top: 25px;">
            <p style="margin: 0; color: #991b1b; font-size: 14px;">
                <strong>Did you not authorize this?</strong><br>
                If you do not recognize this activity, please <a href="#" style="color: #dc2626; text-decoration: underline;">reset your password immediately</a> and contact our security desk.
            </p>
        </div>
        <p style="margin-top: 30px; margin-bottom: 0;">Warm Regards,<br><strong>IRCTC Security Team</strong></p>
    `;

    const message = {
        from: `"IRCTC NextGen Security" <${process.env.SMTP_USER}>`,
        to: userEmail,
        subject: `[IRCTC Security] Notice of Account Activity: ${action}`,
        html: getBaseHtml('Security Notification', content, `A new ${action} event was detected on your account.`),
        attachments: [
            { filename: 'ashokstambh_logo.jpg', path: require('path').join(__dirname, '../../client/public/ashokstambh_logo.jpg'), cid: 'ashokstambh' },
            { filename: 'ir-logo.png', path: require('path').join(__dirname, '../../client/public/ir-logo.png'), cid: 'irlogo' }
        ]
    };

    const info = await transporter.sendMail(message);
    if (!process.env.SMTP_HOST) {
        console.log(`Security Alert sent to ${userEmail}. Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    } else {
        console.log(`Security Alert sent to ${userEmail}.`);
    }
};

exports.sendWalletReceipt = async (userEmail, amount, newBalance) => {
    if (!transporter) return;

    const content = `
        <h2 style="color: #0f172a; margin-top: 0; text-align: center;">Payment Receipt</h2>
        <p style="text-align: center; color: #64748b;">Your IRCTC Wallet has been recharged successfully.</p>
        
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 25px; border-radius: 8px; text-align: center; margin: 30px 0;">
            <p style="margin: 0 0 5px 0; color: #166534; font-size: 14px; text-transform: uppercase; font-weight: 600;">Amount Added</p>
            <h1 style="color: #15803d; margin: 0; font-size: 36px; letter-spacing: -1px;">₹${amount.toFixed(2)}</h1>
        </div>
        
        <h4 style="color: #334155; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Transaction Details</h4>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <tr><td style="padding: 10px 0; border-bottom: 1px dashed #cbd5e1; color: #64748b;">Transaction Date</td><td style="padding: 10px 0; border-bottom: 1px dashed #cbd5e1; text-align: right; color: #0f172a; font-weight: 500;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px dashed #cbd5e1; color: #64748b;">Transaction Type</td><td style="padding: 10px 0; border-bottom: 1px dashed #cbd5e1; text-align: right; color: #0f172a; font-weight: 500;">Wallet Top-up</td></tr>
            <tr><td style="padding: 10px 0; color: #64748b;"><strong>Available Balance</strong></td><td style="padding: 10px 0; text-align: right; color: #0f172a; font-weight: 700;">₹${newBalance.toFixed(2)}</td></tr>
        </table>
        
        <p style="margin-top: 30px; margin-bottom: 0;">Warm Regards,<br><strong>IRCTC Billing Team</strong></p>
    `;

    const message = {
        from: `"IRCTC NextGen Billing" <${process.env.SMTP_USER}>`,
        to: userEmail,
        subject: `[IRCTC Payment] Receipt for Wallet Top-up of ₹${amount}`,
        html: getBaseHtml('Wallet Top-up Receipt', content, `Your wallet was successfully credited with ₹${amount}.`),
        attachments: [
            { filename: 'ashokstambh_logo.jpg', path: require('path').join(__dirname, '../../client/public/ashokstambh_logo.jpg'), cid: 'ashokstambh' },
            { filename: 'ir-logo.png', path: require('path').join(__dirname, '../../client/public/ir-logo.png'), cid: 'irlogo' }
        ]
    };

    const info = await transporter.sendMail(message);
    if (!process.env.SMTP_HOST) {
        console.log(`Wallet Receipt sent to ${userEmail}. Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    } else {
        console.log(`Wallet Receipt sent to ${userEmail}.`);
    }
};

exports.sendCancellationNotice = async (userEmail, booking) => {
    if (!transporter) return;

    const content = `
        <h2 style="color: #0f172a; margin-top: 0;">Cancellation Confirmed</h2>
        <p>Dear Customer,</p>
        <p>Your booking with PNR <strong>${booking.pnrNumber}</strong> has been successfully cancelled as per your request. The refund details are provided below.</p>
        
        <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #78350f; width: 40%;"><strong>PNR Number:</strong></td><td style="padding: 8px 0; color: #92400e; font-weight: 600;">${booking.pnrNumber}</td></tr>
                <tr><td style="padding: 8px 0; color: #78350f;"><strong>Service Type:</strong></td><td style="padding: 8px 0; color: #92400e;">${booking.serviceType || 'Train Ticket'}</td></tr>
                <tr><td style="padding: 8px 0; color: #78350f;"><strong>Refund Amount:</strong></td><td style="padding: 8px 0; color: #b45309; font-weight: 700; font-size: 18px;">₹${booking.finalPrice}</td></tr>
                <tr><td style="padding: 8px 0; color: #78350f;"><strong>Refund Status:</strong></td><td style="padding: 8px 0; color: #166534; font-weight: 600;">Processed to Wallet</td></tr>
            </table>
        </div>
        
        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
            Please note that cancellation charges apply as per IRCTC policies. The refund amount has been instantly credited to your IRCTC Wallet. You can use this balance for your future bookings.
        </p>
        <p style="margin-top: 30px; margin-bottom: 0;">Warm Regards,<br><strong>IRCTC Customer Service</strong></p>
    `;

    const message = {
        from: `"IRCTC NextGen Bookings" <${process.env.SMTP_USER}>`,
        to: userEmail,
        subject: `[IRCTC Cancellation] Refund Initiated for PNR ${booking.pnrNumber}`,
        html: getBaseHtml('Cancellation Confirmation', content, `Your booking for PNR ${booking.pnrNumber} was cancelled.`),
        attachments: [
            { filename: 'ashokstambh_logo.jpg', path: require('path').join(__dirname, '../../client/public/ashokstambh_logo.jpg'), cid: 'ashokstambh' },
            { filename: 'ir-logo.png', path: require('path').join(__dirname, '../../client/public/ir-logo.png'), cid: 'irlogo' }
        ]
    };

    const info = await transporter.sendMail(message);
    if (!process.env.SMTP_HOST) {
        console.log(`Cancellation notice sent to ${userEmail}. Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    } else {
        console.log(`Cancellation notice sent to ${userEmail}.`);
    }
};

exports.sendBookingConfirmation = async (userEmail, booking) => {
    if (!transporter) return;

    // --- EXACT PDF REPLICATION LOGIC ---
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    
    const isFood = booking.serviceType === 'E Catering';
    const isHotel = booking.serviceType === 'Hotels';
    const isSpecialService = isHotel || isFood || (booking.serviceType && booking.serviceType.toLowerCase().includes('holiday')) || (booking.serviceType && booking.serviceType.toLowerCase().includes('retiring'));
    const isFlight = booking.serviceType === 'Flight';
    const isBus = booking.serviceType === 'Bus';

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    if (isSpecialService) {
        doc.text('Booking Confirmation Voucher', pageWidth / 2, 15, { align: 'center' });
    } else {
        doc.text('Electronic Reservation Slip (ERS)', pageWidth / 2, 15, { align: 'center' });
    }

    doc.setFontSize(16);
    doc.setTextColor(0, 51, 153);
    doc.text(isFlight ? "AVIATION" : isBus ? "BUS" : "IRCTC", 15, 20);
    
    doc.setTextColor(255, 153, 51);
    doc.text("G20", pageWidth - 35, 20);

    doc.setTextColor(0, 0, 0);

    doc.setFillColor(153, 204, 255);
    doc.rect(70, 32, 70, 6, 'F');
    if (!isSpecialService) {
        doc.triangle(140, 30, 140, 40, 145, 35, 'F');
    }

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    
    if (isSpecialService) {
        doc.text(isFood ? "Delivery Station" : "City/Location", 35, 30, { align: 'center' });
        doc.text("Service Details", 105, 36, { align: 'center' });
        doc.text(isFood ? "Delivery Station" : "City/Location", 175, 30, { align: 'center' });
    } else {
        doc.text(isHotel ? "City/Location" : "Booked From", 35, 30, { align: 'center' });
        doc.text(isHotel ? "Address Details" : "Boarding At", 105, 36, { align: 'center' });
        doc.text(isHotel ? "City/Location" : "To", 175, 30, { align: 'center' });
    }

    doc.setFont("helvetica", "normal");
    const source = booking.from || 'STATION';
    const dest = booking.to || 'DESTINATION';
    const formatStationName = (name, maxLen = 20) => name.length > maxLen ? name.substring(0, maxLen - 2) + '...' : name;
    
    doc.text(formatStationName(source.toUpperCase()), 35, 42, { align: 'center' });
    doc.text(formatStationName(isSpecialService ? dest.toUpperCase() : (isHotel ? dest.toUpperCase() : source.toUpperCase()), 30), 105, 42, { align: 'center' });
    doc.text(formatStationName(isSpecialService ? dest.toUpperCase() : (isHotel ? source.toUpperCase() : dest.toUpperCase())), 175, 42, { align: 'center' });

    const dateStr = booking.journeyDate ? new Date(booking.journeyDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const timeStr = booking.departureTime || '12:00';
    const arrTimeStr = '08:45';

    if (isSpecialService) {
        doc.text(isFood ? `Delivery Date: ${dateStr}` : `Check-in Date: ${dateStr}`, 35, 48, { align: 'center' });
        doc.setFont("helvetica", "bold");
        doc.text(isFood ? `Time: ${timeStr} | ${dateStr}` : `Check-in: ${timeStr} | ${dateStr}`, 105, 48, { align: 'center' });
        doc.setFont("helvetica", "normal");
        doc.text(isFood ? `Delivery: ${arrTimeStr}` : `Check-out: ${arrTimeStr}`, 175, 48, { align: 'center' });
    } else {
        doc.text(isHotel ? `Check-in Date: ${dateStr}` : `Start Date: ${dateStr}`, 35, 48, { align: 'center' });
        doc.setFont("helvetica", "bold");
        doc.text(isHotel ? `Check-in: ${timeStr} | ${dateStr}` : `Departure: ${timeStr} | ${dateStr}`, 105, 48, { align: 'center' });
        doc.setFont("helvetica", "normal");
        doc.text(isHotel ? `Check-out: ${arrTimeStr}` : `Arrival: ${arrTimeStr} | ${dateStr}`, 175, 48, { align: 'center' });
    }

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(10, 52, 200, 52);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    
    if (isSpecialService) {
        doc.text("Booking ID", 35, 57, { align: 'center' });
        doc.text(isFood ? "Restaurant/Vendor" : "Hotel/Room Name", 105, 57, { align: 'center' });
        doc.text("Type", 160, 57, { align: 'center' });
        doc.text("Booking Date", 190, 57, { align: 'center' });
    } else {
        doc.text("PNR", 35, 57, { align: 'center' });
        doc.text(isHotel ? "Hotel Name" : `Service Name`, 105, 57, { align: 'center' });
        doc.text("Class", 160, 57, { align: 'center' });
        doc.text("Pantry", 190, 57, { align: 'center' });
    }

    doc.setTextColor(0, 51, 153);
    const idStr = booking.pnrNumber || booking._id.toString().slice(-10).toUpperCase();
    doc.text(idStr, 35, 62, { align: 'center' });

    const serviceName = booking.trainId?.name || booking.serviceId?.name || "IRCTC Service";
    doc.text(serviceName.length > 25 ? serviceName.substring(0, 23) + '...' : serviceName, 105, 62, { align: 'center' });

    doc.text(booking.serviceClass || booking.trainClass || 'Standard', 160, 62, { align: 'center' });
    doc.setFontSize(8);
    
    if (isSpecialService) {
        doc.text(new Date(booking.createdAt).toLocaleDateString(), 190, 62, { align: 'center' });
        doc.line(10, 66, 200, 66);
    } else {
        doc.text(booking.pantryItems?.length ? "YES" : "NO", 190, 62, { align: 'center' });
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text("Quota", 35, 68, { align: 'center' });
        doc.text("Distance", 105, 68, { align: 'center' });
        doc.text("Booking Date", 175, 68, { align: 'center' });
        doc.setFont("helvetica", "normal");
        doc.text(booking.quota || 'GENERAL (GN)', 35, 73, { align: 'center' });
        doc.text("500 KM", 105, 73, { align: 'center' });
        doc.text(new Date(booking.createdAt).toLocaleString(), 175, 73, { align: 'center' });
        doc.line(10, 75, 200, 75);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    const startYTable = isSpecialService ? 71 : 80;
    doc.text(isFood ? "Order/Customer Details" : "Passenger Details", 12, startYTable);

    let passCols, passRows;
    if (isSpecialService) {
        passCols = ["#", "Name", "Age", "Gender", "Status"];
        passRows = booking.passengers.map((p, idx) => [(idx + 1).toString(), p.name.toUpperCase(), p.age.toString(), p.gender.charAt(0).toUpperCase(), 'CONFIRMED']);
    } else {
        passCols = ["#", "Name", "Age", "Gender", "Booking Status", "Current Status"];
        passRows = booking.passengers.map((p, idx) => {
            let seat = booking.seatNumbers && booking.seatNumbers[idx] ? booking.seatNumbers[idx] : (p.seatPreference || 'G-1/12/M');
            return [(idx + 1).toString(), p.name.toUpperCase(), p.age.toString(), p.gender.charAt(0).toUpperCase(), `CNF / ${seat}`, `CNF / ${seat}`];
        });
    }

    doc.autoTable({
        startY: startYTable + 2,
        head: [passCols],
        body: passRows,
        theme: 'plain',
        styles: { fontSize: 8, cellPadding: 1, textColor: [0, 0, 0] },
        headStyles: { fontStyle: 'bold' }
    });

    const py = doc.lastAutoTable?.finalY || 100;
    doc.line(10, py + 2, 200, py + 2);

    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    if (!isSpecialService) {
        doc.text("Acronyms:             RLWL: REMOTE LOCATION WAITLIST                 PQWL: POOLED QUOTA WAITLIST                 RSWL: ROAD-SIDE WAITLIST", 12, py + 6);
        doc.text(`Transaction ID: ${booking._id}`, 12, py + 16);
    }
    doc.setFontSize(8);
    doc.text(`Contact Details:     Email: ${userEmail}                 Mobile: N/A`, 12, py + (!isSpecialService ? 10 : 8));

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const pyOffset = isSpecialService ? 16 : 26;
    doc.text("Payment Details", 12, py + pyOffset);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

    const tPrice = booking.finalPrice;
    const baseFare = tPrice / 1.18;
    const tax = tPrice - baseFare;
    doc.text(isSpecialService ? "Service Fare" : "Ticket Fare", 12, py + pyOffset + 6); doc.text(`Rs. ${baseFare.toFixed(2)}`, 100, py + pyOffset + 6);
    doc.text("Taxes & Fees (Incl. of GST)", 12, py + pyOffset + 11); doc.text(`Rs. ${tax.toFixed(2)}`, 100, py + pyOffset + 11);
    doc.setFont("helvetica", "bold");
    doc.text("Total Paid (all inclusive)", 12, py + pyOffset + 16); doc.text(`Rs. ${tPrice.toFixed(2)}`, 100, py + pyOffset + 16);

    doc.setFillColor(0, 0, 0);
    const qrSize = 30;
    const px = 150;
    const pY = py + 14;

    doc.rect(px, pY, 7, 7, 'F'); doc.setFillColor(255, 255, 255); doc.rect(px + 1, pY + 1, 5, 5, 'F'); doc.setFillColor(0, 0, 0); doc.rect(px + 2, pY + 2, 3, 3, 'F');
    doc.rect(px + qrSize - 7, pY, 7, 7, 'F'); doc.setFillColor(255, 255, 255); doc.rect(px + qrSize - 6, pY + 1, 5, 5, 'F'); doc.setFillColor(0, 0, 0); doc.rect(px + qrSize - 5, pY + 2, 3, 3, 'F');
    doc.rect(px, pY + qrSize - 7, 7, 7, 'F'); doc.setFillColor(255, 255, 255); doc.rect(px + 1, pY + qrSize - 6, 5, 5, 'F'); doc.setFillColor(0, 0, 0); doc.rect(px + 2, pY + qrSize - 5, 3, 3, 'F');
    for (let x = 0; x < qrSize; x += 1.5) {
        for (let y = 0; y < qrSize; y += 1.5) {
            if ((x < 8 && y < 8) || (x > qrSize - 8 && y < 8) || (x < 8 && y > qrSize - 8)) continue;
            if (Math.random() > 0.5) doc.rect(px + x, pY + y, 1.5, 1.5, 'F');
        }
    }

    const footY = py + (isSpecialService ? 105 : 105);
    doc.setFillColor(240, 248, 255);
    doc.rect(10, footY, 190, 20, 'F');
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("24/7 Customer Support", 15, footY + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("For any queries, please contact our dedicated helpdesk at 1800-111-139 or email us at support@irctc-nextgen.com", 15, footY + 13);

    doc.setFillColor(255, 230, 153);
    doc.rect(10, footY + 27, 190, 15, 'F');
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 150);
    doc.text("EXPLORE INDIA WITH IRCTC NEXTGEN", pageWidth / 2, footY + 36, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.line(10, footY + 50, 200, footY + 50);
    doc.setFont("helvetica", "bolditalic");
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.text(`VOUCHER GENERATED BY: IRCTC NEXTGEN SYSTEM  |  ISSUED ON: ${new Date().toLocaleString()}  |  IP: SECURED`, 12, footY + 55);

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    const content = `
        <h2 style="color: #0f172a; margin-top: 0; text-align: center;">E-Ticket Booking Confirmed</h2>
        <p style="text-align: center; color: #64748b; margin-bottom: 25px;">Your booking has been successfully processed.</p>
        
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
            <p style="margin: 0; color: #166534; font-size: 13px; text-transform: uppercase; font-weight: 600;">PNR Number</p>
            <h2 style="color: #15803d; margin: 5px 0 0 0; font-size: 28px; letter-spacing: 2px;">${idStr}</h2>
        </div>
        
        <h4 style="color: #334155; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Journey Details</h4>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
            <tr><td style="padding: 10px 0; border-bottom: 1px dashed #cbd5e1; color: #64748b; width: 40%;"><strong>Service</strong></td><td style="padding: 10px 0; border-bottom: 1px dashed #cbd5e1; text-align: right; color: #0f172a; font-weight: 600;">${serviceName}</td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px dashed #cbd5e1; color: #64748b;"><strong>Journey Date</strong></td><td style="padding: 10px 0; border-bottom: 1px dashed #cbd5e1; text-align: right; color: #0f172a;">${new Date(booking.journeyDate || new Date()).toLocaleDateString('en-IN')}</td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px dashed #cbd5e1; color: #64748b;"><strong>Total Fare</strong></td><td style="padding: 10px 0; border-bottom: 1px dashed #cbd5e1; text-align: right; color: #0f172a; font-weight: 700;">₹${booking.finalPrice}</td></tr>
            <tr><td style="padding: 10px 0; color: #64748b;"><strong>Passengers</strong></td><td style="padding: 10px 0; text-align: right; color: #0f172a;">${booking.passengers.length} Person(s)</td></tr>
        </table>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 13px; color: #475569;">
            <p style="margin: 0;"><strong>Important:</strong> Your official E-Ticket PDF is attached to this email. Please carry a digital or printed copy of the attached ticket along with a valid Government ID proof during your journey.</p>
        </div>
        
        <p style="margin-top: 30px; margin-bottom: 0;">We wish you a pleasant journey,<br><strong>IRCTC Ticketing Team</strong></p>
    `;

    const message = {
        from: `"IRCTC NextGen Ticketing" <${process.env.SMTP_USER}>`,
        to: userEmail,
        subject: `[IRCTC E-Ticket] Booking Confirmed - PNR ${idStr}`,
        html: getBaseHtml('Booking Confirmation', content, `Your e-ticket for PNR ${idStr} is confirmed and attached.`),
        attachments: [
            {
                filename: `IRCTC_Ticket_${idStr}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            },
            { filename: 'ashokstambh_logo.jpg', path: require('path').join(__dirname, '../../client/public/ashokstambh_logo.jpg'), cid: 'ashokstambh' },
            { filename: 'ir-logo.png', path: require('path').join(__dirname, '../../client/public/ir-logo.png'), cid: 'irlogo' }
        ]
    };

    const info = await transporter.sendMail(message);
    if (!process.env.SMTP_HOST) {
        console.log(`Booking Confirmation sent to ${userEmail}. Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    } else {
        console.log(`Booking Confirmation sent to ${userEmail}.`);
    }
};

exports.sendLoginOtpEmail = async (userEmail, otp) => {
    if (!transporter) return;

    const content = `
        <h2 style="color: #0f172a; margin-top: 0; text-align: center;">Your Login OTP</h2>
        <p style="text-align: center; color: #64748b;">Please use the following 6-digit code to complete your secure login.</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 25px; border-radius: 8px; text-align: center; margin: 30px 0;">
            <p style="margin: 0 0 5px 0; color: #475569; font-size: 14px; text-transform: uppercase; font-weight: 600;">Verification Code</p>
            <h1 style="color: #3b82f6; margin: 0; font-size: 42px; letter-spacing: 8px;">${otp}</h1>
        </div>
        
        <p style="text-align: center; font-size: 13px; color: #ef4444; margin-top: 20px;">
            This code will expire in 5 minutes. Do not share this code with anyone.
        </p>
        <p style="margin-top: 30px; margin-bottom: 0; text-align: center;">Warm Regards,<br><strong>IRCTC Security Desk</strong></p>
    `;

    const message = {
        from: `"IRCTC NextGen Security" <${process.env.SMTP_USER}>`,
        to: userEmail,
        subject: `[IRCTC 2FA] Your Secure Login Code is ${otp}`,
        html: getBaseHtml('2FA Login Code', content, `Your verification code is ${otp}`),
        attachments: [
            { filename: 'ashokstambh_logo.jpg', path: require('path').join(__dirname, '../../client/public/ashokstambh_logo.jpg'), cid: 'ashokstambh' },
            { filename: 'ir-logo.png', path: require('path').join(__dirname, '../../client/public/ir-logo.png'), cid: 'irlogo' }
        ]
    };

    const info = await transporter.sendMail(message);
    if (!process.env.SMTP_HOST) {
        console.log(`OTP Email sent to ${userEmail}. Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    } else {
        console.log(`OTP Email sent to ${userEmail}.`);
    }
};

exports.sendVerificationEmail = async (userEmail, token) => {
    if (!transporter) return;

    const verifyUrl = `http://localhost:3000/verify-email?token=${token}`;

    const content = `
        <h2 style="color: #0f172a; margin-top: 0; text-align: center;">Verify Your Email</h2>
        <p style="text-align: center; color: #64748b;">Welcome to IRCTC NextGen! Please click the button below to verify your email address and activate your account.</p>
        
        <div style="text-align: center; margin: 35px 0;">
            <a href="${verifyUrl}" style="background-color: #3b82f6; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; letter-spacing: 0.5px;">Verify Email Now</a>
        </div>
        
        <p style="text-align: center; font-size: 13px; color: #ef4444; margin-top: 20px;">
            This verification link will expire in 24 hours.
        </p>
        <p style="margin-top: 30px; margin-bottom: 0; text-align: center;">Warm Regards,<br><strong>IRCTC Onboarding Team</strong></p>
    `;

    const message = {
        from: `"IRCTC NextGen Onboarding" <${process.env.SMTP_USER}>`,
        to: userEmail,
        subject: `[Action Required] Verify your IRCTC NextGen Account`,
        html: getBaseHtml('Email Verification', content, `Please verify your email using this link: ${verifyUrl}`),
        attachments: [
            { filename: 'ashokstambh_logo.jpg', path: require('path').join(__dirname, '../../client/public/ashokstambh_logo.jpg'), cid: 'ashokstambh' },
            { filename: 'ir-logo.png', path: require('path').join(__dirname, '../../client/public/ir-logo.png'), cid: 'irlogo' }
        ]
    };

    const info = await transporter.sendMail(message);
    if (!process.env.SMTP_HOST) {
        console.log(`Verification Email sent to ${userEmail}. Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    } else {
        console.log(`Verification Email sent to ${userEmail}.`);
    }
};
