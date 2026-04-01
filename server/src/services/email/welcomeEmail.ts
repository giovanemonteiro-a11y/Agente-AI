import { sendEmail, EMAIL_FROM_ADDRESS } from '../../config/email';
import { logger } from '../../utils/logger';

const APP_URL = process.env.APP_URL ?? 'http://localhost:5173';

export async function sendWelcomeEmail(
  name: string,
  email: string,
  password: string
): Promise<void> {
  const firstName = name.split(' ')[0];
  const fullName = name;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo à AI SICI</title>
</head>
<body style="margin:0; padding:0; background-color:#0A0A14; font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0A14; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; background:linear-gradient(135deg, rgba(26,86,219,0.08), rgba(124,58,237,0.05)); border:1px solid rgba(255,255,255,0.1); border-radius:16px; overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 24px; text-align:center; border-bottom:1px solid rgba(255,255,255,0.06);">
              <div style="display:inline-block; width:48px; height:48px; background:linear-gradient(135deg,#1A56DB,#7C3AED,#E040FB); border-radius:12px; line-height:48px; text-align:center; font-size:20px; color:white; margin-bottom:12px;">⚡</div>
              <h1 style="margin:0; font-size:22px; font-weight:700; background:linear-gradient(90deg,#3B76F6,#E040FB); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;">AI SICI</h1>
              <p style="margin:4px 0 0; font-size:12px; color:#A0A0C0;">Sistema de Inteligência de Cliente Integrado</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 20px; font-size:16px; color:#F0F0FF; line-height:1.6;">
                Olá, <strong>${fullName}</strong>
              </p>
              <p style="margin:0 0 24px; font-size:15px; color:#A0A0C0; line-height:1.6;">
                Parabéns! Você foi cadastrado(a) na <strong style="color:#3B76F6;">AI SICI</strong>. Sua senha temporária é:
              </p>
              <!-- Password box -->
              <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.12); border-radius:12px; padding:16px 20px; text-align:center; margin-bottom:24px;">
                <p style="margin:0 0 4px; font-size:11px; text-transform:uppercase; letter-spacing:1.5px; color:#606080;">Sua senha temporária</p>
                <p style="margin:0; font-size:20px; font-weight:700; font-family:monospace; color:#F0F0FF; letter-spacing:2px;">${password}</p>
              </div>
              <p style="margin:0 0 24px; font-size:13px; color:#606080; line-height:1.5;">
                No primeiro acesso, você será solicitado(a) a criar uma nova senha para garantir sua privacidade e segurança.
              </p>
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${APP_URL}/login" style="display:inline-block; background:linear-gradient(90deg,#1A56DB,#7C3AED,#E040FB); color:white; text-decoration:none; padding:14px 40px; border-radius:12px; font-size:14px; font-weight:600; letter-spacing:0.5px;">
                      Acessar a plataforma
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px; border-top:1px solid rgba(255,255,255,0.06); text-align:center;">
              <p style="margin:0; font-size:11px; color:#606080;">
                V4 Company · AI SICI · Agência Inteligente
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  const text = `Olá, ${fullName}\n\nParabéns! Você foi cadastrado(a) na AI SICI.\nSua senha temporária é: ${password}\n\nAcesse a plataforma: ${APP_URL}/login\n\nNo primeiro acesso, você será solicitado(a) a criar uma nova senha.\n\nV4 Company · AI SICI`;

  try {
    await sendEmail({
      to: email,
      subject: `Bem-vindo à AI SICI — Seu acesso está pronto`,
      html,
      text,
    });
    logger.info(`[Email] Welcome email sent to ${email}`);
  } catch (err) {
    logger.warn(`[Email] Failed to send welcome email to ${email}: ${err instanceof Error ? err.message : String(err)}`);
    // Don't throw — user creation should not fail because of email
  }
}
