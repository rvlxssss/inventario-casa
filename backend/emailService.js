const nodemailer = require('nodemailer');

// Configure transporter
// In production, use environment variables for secure credentials
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail', // e.g., 'gmail', 'outlook'
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendRecoveryEmail = async (to, token) => {
    const resetLink = `http://localhost:5173/#/reset-password?token=${token}`;

    // If no credentials are provided, just log the link (Dev Mode)
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log("========================================");
        console.log(" [DEV MODE] Password Recovery Link:");
        console.log(` To: ${to}`);
        console.log(` Link: ${resetLink}`);
        console.log("========================================");
        return true;
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: 'Recuperación de Contraseña - PantryPal',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #333;">Recupera tu contraseña</h2>
                <p>Has solicitado restablecer tu contraseña en PantryPal.</p>
                <p>Haz clic en el siguiente botón para continuar:</p>
                <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">Restablecer Contraseña</a>
                <p style="margin-top: 20px; font-size: 12px; color: #888;">Si no solicitaste esto, puedes ignorar este correo.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}`);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
};

module.exports = { sendRecoveryEmail };
