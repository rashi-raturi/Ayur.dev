import nodemailer from 'nodemailer';

let transporter;
let isEthereal = false;

// Function to create Ethereal test account automatically (NO SIGNUP REQUIRED!)
const createEtherealTransporter = async () => {
    try {
        const testAccount = await nodemailer.createTestAccount();
        
        console.log('\n🎉 Using Ethereal Email (Test Mode - No signup needed!)');
        console.log('📧 Test Email:', testAccount.user);
        console.log('🔑 Password:', testAccount.pass);
        console.log('📬 View emails at: https://ethereal.email/messages\n');
        
        isEthereal = true;
        return nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });
    } catch (error) {
        console.error('Error creating Ethereal account:', error);
        throw error;
    }
};

// Initialize transporter based on configuration
const initializeTransporter = async () => {
    const emailService = process.env.EMAIL_SERVICE || 'ethereal';
    
    // Use Ethereal if no credentials are set or explicitly requested
    if (emailService === 'ethereal' || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        return await createEtherealTransporter();
    }
    
    // Configure based on service
    let config;
    if (emailService === 'gmail') {
        console.log('📧 Using Gmail SMTP');
        config = {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD }
        };
    } else if (emailService === 'brevo') {
        console.log('📧 Using Brevo SMTP');
        config = {
            host: 'smtp-relay.brevo.com',
            port: 587,
            secure: false,
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD }
        };
    } else if (emailService === 'mailtrap') {
        console.log('📧 Using Mailtrap SMTP');
        config = {
            host: 'smtp.mailtrap.io',
            port: 2525,
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD }
        };
    } else {
        console.log('📧 Using Custom SMTP');
        config = {
            host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD }
        };
    }
    
    const t = nodemailer.createTransport(config);
    
    // Verify connection
    try {
        await t.verify();
        console.log('✅ Email server is ready to send messages\n');
    } catch (error) {
        console.log('❌ Email connection error:', error.message);
        console.log('⚠️  Falling back to Ethereal Email (test mode)\n');
        return await createEtherealTransporter();
    }
    
    return t;
};

// Initialize on module load
(async () => {
    try {
        transporter = await initializeTransporter();
    } catch (error) {
        console.error('Failed to initialize email transporter:', error);
    }
})();

// Export wrapper that logs preview URLs for Ethereal
export default {
    async sendMail(mailOptions) {
        if (!transporter) {
            transporter = await initializeTransporter();
        }
        
        const info = await transporter.sendMail(mailOptions);
        
        // If using Ethereal, log the preview URL
        if (isEthereal) {
            const previewUrl = nodemailer.getTestMessageUrl(info);
            console.log('\n📬 EMAIL SENT! Preview at:', previewUrl);
            console.log('   (Copy this URL to your browser to see the email)\n');
        }
        
        return info;
    },
    
    async verify() {
        if (!transporter) {
            transporter = await initializeTransporter();
        }
        return transporter.verify();
    }
};
