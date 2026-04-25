import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

// ===== SEND EMAIL VERIFICATION CODE =====
export const sendVerificationEmail = async (user, code) => {
    try {
        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #1a73e8;">⚽ Verify Your Email</h1>
                
                <p>Hi ${user.name},</p>
                
                <p>Thank you for registering for FIFA World Cup 2026 Booking! Please use the verification code below to confirm your email address.</p>
                
                <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; border-radius: 12px; margin: 30px 0; text-align: center;">
                    <p style="color: #fbbf24; font-size: 14px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px;">Your Verification Code</p>
                    <h1 style="color: #ffffff; font-size: 48px; letter-spacing: 8px; margin: 0; font-weight: bold;">${code}</h1>
                </div>
                
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>⚠️ Important:</strong></p>
                    <ul style="margin-bottom: 0;">
                        <li>This code expires in <strong>15 minutes</strong></li>
                        <li>Do not share this code with anyone</li>
                        <li>If you didn't request this, please ignore this email</li>
                    </ul>
                </div>
                
                <p>Need help? Contact us:</p>
                <p>
                    📧 Email: ${process.env.CONTACT_EMAIL || 'worldcupbookinghub@gmail.com'}<br>
                    📱 WhatsApp: ${process.env.WHATSAPP_PRIMARY || '+1 (615) 414-5082'}
                </p>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                
                <p style="color: #666; font-size: 12px;">
                    FIFA World Cup 2026 Booking Platform<br>
                    This is an automated email, please do not reply.
                </p>
            </div>
        `;

        const result = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'FIFA World Cup 2026 <noreply@yourdomain.com>',
            to: user.email,
            subject: '🔐 Verify Your Email - FIFA World Cup 2026',
            html: emailContent
        });

        console.log('✅ Verification email sent:', result);
        return result;
    } catch (error) {
        console.error('❌ Verification email error:', error);
        throw error;
    }
};

// ===== SEND PASSWORD RESET CODE (for Phase 1, Steps 1.8-1.9) =====
export const sendPasswordResetEmail = async (user, code) => {
    try {
        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #1a73e8;">🔑 Reset Your Password</h1>
                
                <p>Hi ${user.name},</p>
                
                <p>We received a request to reset your password. Use the code below to proceed:</p>
                
                <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 30px; border-radius: 12px; margin: 30px 0; text-align: center;">
                    <p style="color: #fef2f2; font-size: 14px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px;">Password Reset Code</p>
                    <h1 style="color: #ffffff; font-size: 48px; letter-spacing: 8px; margin: 0; font-weight: bold;">${code}</h1>
                </div>
                
                <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>⚠️ Important:</strong></p>
                    <ul style="margin-bottom: 0;">
                        <li>This code expires in <strong>15 minutes</strong></li>
                        <li>Do not share this code with anyone</li>
                        <li>If you didn't request this, please secure your account immediately</li>
                    </ul>
                </div>
                
                <p>Need help? Contact us:</p>
                <p>
                    📧 Email: ${process.env.CONTACT_EMAIL || 'worldcupbookinghub@gmail.com'}<br>
                    📱 WhatsApp: ${process.env.WHATSAPP_PRIMARY || '+1 (615) 414-5082'}
                </p>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                
                <p style="color: #666; font-size: 12px;">
                    FIFA World Cup 2026 Booking Platform<br>
                    This is an automated email, please do not reply.
                </p>
            </div>
        `;

        const result = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'FIFA World Cup 2026 <noreply@yourdomain.com>',
            to: user.email,
            subject: '🔑 Password Reset - FIFA World Cup 2026',
            html: emailContent
        });

        console.log('✅ Password reset email sent:', result);
        return result;
    } catch (error) {
        console.error('❌ Password reset email error:', error);
        throw error;
    }
};

// ===== SEND BOOKING CONFIRMATION EMAIL =====
export const sendBookingConfirmation = async (user, booking) => {
    try {
        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #1a73e8;">🎉 Booking Confirmed!</h1>
                
                <p>Hi ${user.name},</p>
                
                <p>Your World Cup 2026 booking has been confirmed!</p>
                
                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h2 style="margin-top: 0;">Booking Details:</h2>
                    <p><strong>Booking ID:</strong> ${booking._id}</p>
                    <p><strong>Type:</strong> ${booking.type}</p>
                    <p><strong>Total Amount:</strong> $${booking.total_price}</p>
                    <p><strong>Payment Status:</strong> ${booking.payment_status}</p>
                    <p><strong>Date:</strong> ${new Date(booking.createdAt).toLocaleDateString()}</p>
                </div>
                
                ${booking.type === 'ticket' ? `
                    <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3>Match Details:</h3>
                        <p><strong>Match:</strong> ${booking.match ? booking.match.team1 + ' vs ' + booking.match.team2 : 'TBA'}</p>
                        <p><strong>Stadium:</strong> ${booking.match ? booking.match.stadium : 'TBA'}</p>
                        <p><strong>Date:</strong> ${booking.match ? booking.match.date : 'TBA'}</p>
                    </div>
                ` : ''}
                
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>⚠️ Next Steps:</strong></p>
                    <ul>
                        <li>Complete payment to confirm your booking</li>
                        <li>You'll receive tickets via email after payment</li>
                        <li>Contact us on WhatsApp: ${process.env.WHATSAPP_PRIMARY || '+1 (615) 414-5082'}</li>
                    </ul>
                </div>
                
                <p>Need help? Contact us:</p>
                <p>
                    📧 Email: ${process.env.CONTACT_EMAIL || 'worldcupbookinghub@gmail.com'}<br>
                    📱 WhatsApp: ${process.env.WHATSAPP_PRIMARY || '+1 (615) 414-5082'}
                </p>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                
                <p style="color: #666; font-size: 12px;">
                    FIFA World Cup 2026 Booking Platform<br>
                    This is an automated email, please do not reply.
                </p>
            </div>
        `;

        const result = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'FIFA World Cup 2026 <noreply@yourdomain.com>',
            to: user.email,
            subject: '🎟️ World Cup 2026 - Booking Confirmation',
            html: emailContent
        });

        console.log('✅ Email sent:', result);
        return result;
    } catch (error) {
        console.error('❌ Email error:', error);
        throw error;
    }
};

// ===== SEND PAYMENT CONFIRMATION EMAIL =====
export const sendPaymentConfirmation = async (user, booking, payment) => {
    try {
        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #4caf50;">✅ Payment Received!</h1>
                
                <p>Hi ${user.name},</p>
                
                <p>We've received your payment for World Cup 2026 booking!</p>
                
                <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h2 style="margin-top: 0;">Payment Details:</h2>
                    <p><strong>Payment ID:</strong> ${payment._id}</p>
                    <p><strong>Amount Paid:</strong> $${payment.amount}</p>
                    <p><strong>Payment Method:</strong> ${payment.paymentMethod}</p>
                    <p><strong>Status:</strong> ${payment.status}</p>
                    <p><strong>Date:</strong> ${new Date(payment.paidAt).toLocaleDateString()}</p>
                </div>
                
                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Booking Summary:</h3>
                    <p><strong>Booking ID:</strong> ${booking._id}</p>
                    <p><strong>Type:</strong> ${booking.type}</p>
                </div>
                
                <div style="background: #d1f2eb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>✅ What's Next:</strong></p>
                    <ul>
                        <li>Your tickets will be sent within 24 hours</li>
                        <li>Check your account dashboard for updates</li>
                        <li>Save this email as receipt</li>
                    </ul>
                </div>
                
                <p>Questions? Contact us:</p>
                <p>
                    📧 Email: ${process.env.CONTACT_EMAIL || 'worldcupbookinghub@gmail.com'}<br>
                    📱 WhatsApp: ${process.env.WHATSAPP_PRIMARY || '+1 (615) 414-5082'}
                </p>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                
                <p style="color: #666; font-size: 12px;">
                    FIFA World Cup 2026 Booking Platform<br>
                    This is an automated email, please do not reply.
                </p>
            </div>
        `;

        const result = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'FIFA World Cup 2026 <noreply@yourdomain.com>',
            to: user.email,
            subject: '💳 World Cup 2026 - Payment Confirmation',
            html: emailContent
        });

        console.log('✅ Payment email sent:', result);
        return result;
    } catch (error) {
        console.error('❌ Payment email error:', error);
        throw error;
    }
};

// ===== SEND WELCOME EMAIL =====
export const sendWelcomeEmail = async (user) => {
    try {
        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #1a73e8;">⚽ Welcome to World Cup 2026!</h1>
                
                <p>Hi ${user.name},</p>
                
                <p>Your email has been verified successfully! You now have full access to your account.</p>
                
                <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h2 style="margin-top: 0;">Account Details:</h2>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>WhatsApp:</strong> ${user.whatsapp}</p>
                    <p><strong>Status:</strong> ✅ Verified</p>
                </div>
                
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>🎯 Get Started:</strong></p>
                    <ul>
                        <li>Browse available matches</li>
                        <li>Book tickets, hotels, and flights</li>
                        <li>Track your bookings in your account</li>
                    </ul>
                </div>
                
                <p>Need help? We're here for you:</p>
                <p>
                    📧 Email: ${process.env.CONTACT_EMAIL || 'worldcupbookinghub@gmail.com'}<br>
                    📱 WhatsApp: ${process.env.WHATSAPP_PRIMARY || '+1 (615) 414-5082'}
                </p>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                
                <p style="color: #666; font-size: 12px;">
                    FIFA World Cup 2026 Booking Platform<br>
                    This is an automated email, please do not reply.
                </p>
            </div>
        `;

        const result = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'FIFA World Cup 2026 <noreply@yourdomain.com>',
            to: user.email,
            subject: '⚽ Welcome to FIFA World Cup 2026 Booking',
            html: emailContent
        });

        console.log('✅ Welcome email sent:', result);
        return result;
    } catch (error) {
        console.error('❌ Welcome email error:', error);
        throw error;
    }
};

// ===== SEND PAYMENT SUBMITTED EMAIL TO ADMIN =====
export const sendPaymentSubmittedToAdmin = async (user, payment, bookings) => {
    try {
        const adminEmail = process.env.CONTACT_EMAIL || 'worldcupbookinghub@gmail.com';

        const bookingsList = bookings.map(b => `
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">${b.bookingReference}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${b.bookingType}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${b.itemName}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">$${b.totalPrice}</td>
            </tr>
        `).join('');

        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #1a73e8;">💰 New Payment Submitted!</h1>

                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                    <p style="margin: 0;"><strong>⚠️ Action Required:</strong> A customer has submitted payment proof. Please review and approve/reject in the admin panel.</p>
                </div>

                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h2 style="margin-top: 0;">Customer Details:</h2>
                    <p><strong>Name:</strong> ${user.name}</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>WhatsApp:</strong> ${user.whatsapp || 'N/A'}</p>
                    <p><strong>Country:</strong> ${user.country || 'N/A'}</p>
                </div>

                <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h2 style="margin-top: 0;">Payment Details:</h2>
                    <p><strong>Payment Reference:</strong> ${payment.paymentReference}</p>
                    <p><strong>Payment Method:</strong> ${payment.paymentMethod}</p>
                    <p><strong>Total Amount:</strong> <span style="color: #16a34a; font-size: 1.2rem; font-weight: bold;">$${payment.amount}</span></p>
                    <p><strong>Transaction ID:</strong> ${payment.transactionId || 'Not provided'}</p>
                    <p><strong>Submitted At:</strong> ${new Date().toLocaleString()}</p>
                </div>

                <div style="margin: 20px 0;">
                    <h2>Bookings Included:</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #1a73e8; color: white;">
                                <th style="padding: 8px; text-align: left;">Reference</th>
                                <th style="padding: 8px; text-align: left;">Type</th>
                                <th style="padding: 8px; text-align: left;">Item</th>
                                <th style="padding: 8px; text-align: left;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${bookingsList}
                        </tbody>
                    </table>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://worldcupbookinghub.com/admin.html" 
                       style="background: #1a73e8; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 1.1rem;">
                        🔐 Go to Admin Panel
                    </a>
                </div>

                <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                <p style="color: #666; font-size: 12px;">
                    FIFA World Cup 2026 Booking Platform — Admin Notification
                </p>
            </div>
        `;

        const result = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'noreply@worldcupbookinghub.com',
            to: adminEmail,
            subject: `💰 New Payment Submitted — $${payment.amount} — ${user.name}`,
            html: emailContent
        });

        console.log('✅ Admin payment notification sent:', result);
        return result;
    } catch (error) {
        console.error('❌ Admin payment notification error:', error);
        throw error;
    }
};

export default {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendBookingConfirmation,
    sendPaymentConfirmation,
    sendWelcomeEmail,
    sendPaymentSubmittedToAdmin
};