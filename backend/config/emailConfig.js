import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    TO_EMAIL,
    FROM_EMAIL,
    FROM_NAME
} = process.env || {};

// Configurar transporter de nodemailer
const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT ? Number(SMTP_PORT) : 587,
    secure: SMTP_PORT && Number(SMTP_PORT) === 465, // true solo si puerto 465
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
    },
});

// función rápida para evitar envío si no configurado
function canSendEmail() {
    return SMTP_HOST && SMTP_USER && SMTP_PASS && TO_EMAIL;
}

export { transporter, canSendEmail, FROM_EMAIL, FROM_NAME, TO_EMAIL };