const nodemailer = require('nodemailer');

const createTransporter = () => {
  const provider = (process.env.EMAIL_PROVIDER || 'smtp').toLowerCase();

  if (provider === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });
};

const buildPasswordResetEmail = ({ name, resetUrl, expiresInMinutes = 60 }) => {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your FocusFlow password</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0f172a;">
    <tr>
      <td align="center" style="padding:48px 16px;">
        <table role="presentation" width="100%" style="max-width:520px;background-color:#1e293b;border-radius:16px;border:1px solid #334155;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1 0%,#7c3aed 100%);padding:32px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background:rgba(255,255,255,0.15);border-radius:12px;padding:10px 14px;">
                    <span style="color:#ffffff;font-size:18px;font-weight:700;">F</span>
                  </td>
                  <td style="padding-left:12px;">
                    <span style="color:#ffffff;font-size:18px;font-weight:700;">FocusFlow</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#312e81;border:1px solid #4338ca;border-radius:50%;width:56px;height:56px;text-align:center;vertical-align:middle;">
                    <span style="font-size:26px;line-height:56px;">🔑</span>
                  </td>
                </tr>
              </table>
              <h1 style="margin:0 0 8px;color:#f8fafc;font-size:24px;font-weight:700;">Reset your password</h1>
              <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6;">
                Hey ${name ? `<strong style="color:#cbd5e1;">${name}</strong>` : 'there'} 👋 — we received a request to reset the password for your FocusFlow account. Click the button below to choose a new one.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom:28px;">
                <tr>
                  <td style="border-radius:12px;background:linear-gradient(135deg,#6366f1 0%,#7c3aed 100%);">
                    <a href="${resetUrl}" target="_blank"
                       style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:12px;">
                      Reset password →
                    </a>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#0f172a;border:1px solid #334155;border-radius:10px;padding:14px 18px;">
                    <p style="margin:0;color:#64748b;font-size:13px;line-height:1.5;">
                      ⏱ This link expires in <strong style="color:#94a3b8;">${expiresInMinutes} minutes</strong>. If you didn't request a reset, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 4px;color:#64748b;font-size:12px;">Button not working? Copy and paste this URL:</p>
              <p style="margin:0;word-break:break-all;">
                <a href="${resetUrl}" style="color:#818cf8;font-size:12px;">${resetUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #334155;margin:0;" /></td>
          </tr>
          <tr>
            <td style="padding:24px 40px;">
              <p style="margin:0;color:#475569;font-size:12px;line-height:1.6;">
                If you did not make this request, please ignore this email or
                <a href="mailto:support@focusflow.app" style="color:#6366f1;text-decoration:none;">contact support</a>.
              </p>
              <p style="margin:12px 0 0;color:#334155;font-size:12px;">© ${year} FocusFlow · Built for makers</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const transporter = createTransporter();
  const fromName  = process.env.EMAIL_FROM_NAME || 'FocusFlow';
  const fromEmail = process.env.EMAIL_FROM      || process.env.EMAIL_USER;

  const info = await transporter.sendMail({
    from:    `"${fromName}" <${fromEmail}>`,
    to,
    subject: '🔑 Reset your FocusFlow password',
    text: [
      `Hi ${name || 'there'},`,
      '',
      'We received a request to reset your FocusFlow password.',
      '',
      'Reset link (valid for 60 minutes):',
      resetUrl,
      '',
      "If you didn't request this, you can safely ignore this email.",
      '',
      '— The FocusFlow Team',
    ].join('\n'),
    html: buildPasswordResetEmail({ name, resetUrl, expiresInMinutes: 60 }),
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Reset email sent:', info.messageId);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) console.log('📬 Preview URL:', previewUrl);
  }

  return info;
};

const verifyEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email transporter ready');
  } catch (err) {
    console.warn('⚠️  Email transporter not configured:', err.message);
  }
};

module.exports = { sendPasswordResetEmail, verifyEmailConfig };