import nodemailer from "nodemailer";

// Jeden SMTP transport pre cely dev aj produkciu - meni sa len CIEL cez
// env premenne, nie kod appky:
// - dev: MailHog na localhost (docker-compose.yml), bez autentifikacie,
//   maily sa nikam neodosielaju, len sa daju pozriet na localhost:8025.
// - produkcia (Vercel): Resend - staci premenna RESEND_API_KEY, posiela sa
//   cez ich SMTP (https://resend.com/docs/send-with-smtp). Bez vlastnej
//   overenej domeny Resend doruci len na adresu, s ktorou je jeho ucet
//   zaregistrovany (odosielatel onboarding@resend.dev).
// - iny SMTP poskytovatel: SMTP_HOST/SMTP_PORT/SMTP_SECURE + SMTP_USER/
//   SMTP_PASS (maju prednost pred RESEND_API_KEY).
const resendApiKey = process.env.SMTP_HOST ? undefined : process.env.RESEND_API_KEY;

const transport = nodemailer.createTransport(
  resendApiKey
    ? { host: "smtp.resend.com", port: 465, secure: true, auth: { user: "resend", pass: resendApiKey } }
    : {
        host: process.env.SMTP_HOST ?? "localhost",
        port: Number(process.env.SMTP_PORT ?? 1025),
        secure: process.env.SMTP_SECURE === "true",
        auth:
          process.env.SMTP_USER && process.env.SMTP_PASS
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
      }
);

const MAIL_FROM =
  process.env.MAIL_FROM ??
  (resendApiKey ? "Pixel diár <onboarding@resend.dev>" : "Pixel diár <no-reply@pixeldiar.local>");

export async function sendMail(to: string, subject: string, html: string): Promise<void> {
  await transport.sendMail({ from: MAIL_FROM, to, subject, html });
}
