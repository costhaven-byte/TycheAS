import nodemailer from 'nodemailer'
import { env } from '../config.js'

let transporter

export function getTransporter() {
  if (!env.gmailUser || !env.gmailPass) {
    throw new Error('GMAIL_USER / GMAIL_APP_PASSWORD are not set in .env')
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: env.gmailUser, pass: env.gmailPass },
    })
  }
  return transporter
}

export async function verifyConnection() {
  return getTransporter().verify()
}

export async function sendEmail({ to, subject, text, html }) {
  const info = await getTransporter().sendMail({
    from: `${env.senderName} <${env.gmailUser}>`,
    replyTo: env.replyTo || env.gmailUser,
    to,
    subject,
    text,
    html,
  })
  return info.messageId
}
