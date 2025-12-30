import nodemailer from 'nodemailer';

// Email configuration from environment variables
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@amc-coffeeshop.sk';

// Get APP_URL dynamically - in production use RAILWAY_PUBLIC_DOMAIN or FRONTEND_URL
const getAppUrl = (): string => {
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }
  return process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
};

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

// Check if email is configured
export function isEmailConfigured(): boolean {
  return !!(SMTP_USER && SMTP_PASS);
}

// Send verification email
export async function sendVerificationEmail(
  toEmail: string,
  name: string,
  verificationToken: string
): Promise<boolean> {
  const APP_URL = getAppUrl();
  const verificationLink = `${APP_URL}/api/auth/verify/${verificationToken}`;

  const mailOptions = {
    from: `"AMC Tvoj Coffeeshop" <${FROM_EMAIL}>`,
    to: toEmail,
    subject: 'Overte svoj účet - AMC Tvoj Coffeeshop',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #fff; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #1a1a1a; }
          .header { background: #242424; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; border-bottom: 3px solid #E31B23; }
          .header h1 { margin: 0; }
          .header span { color: #E31B23; }
          .content { background: #242424; padding: 30px; border-radius: 0 0 8px 8px; color: #fff; }
          .button { display: inline-block; background: #E31B23; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; }
          a { color: #E31B23; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>AM<span>C</span> Tvoj Coffeeshop</h1>
          </div>
          <div class="content">
            <p>Ahoj ${name},</p>
            <p>Ďakujeme za registráciu v systéme dochádzky. Pre dokončenie registrácie prosím overte svoju emailovú adresu kliknutím na tlačidlo nižšie:</p>
            <p style="text-align: center;">
              <a href="${verificationLink}" class="button">Overiť Email</a>
            </p>
            <p>Alebo skopírujte tento odkaz do prehliadača:</p>
            <p style="word-break: break-all; color: #E31B23;">${verificationLink}</p>
            <p>Odkaz je platný 24 hodín.</p>
            <p>Ak ste si nevytvorili účet, môžete tento email ignorovať.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} AMC Tvoj Coffeeshop. Všetky práva vyhradené.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Ahoj ${name},

Ďakujeme za registráciu v systéme dochádzky AMC Tvoj Coffeeshop.

Pre dokončenie registrácie prosím overte svoju emailovú adresu kliknutím na tento odkaz:

${verificationLink}

Odkaz je platný 24 hodín.

Ak ste si nevytvorili účet, môžete tento email ignorovať.

S pozdravom,
Tím AMC Tvoj Coffeeshop
    `,
  };

  try {
    if (!isEmailConfigured()) {
      console.log('='.repeat(60));
      console.log('EMAIL NOT CONFIGURED - Verification Email Details:');
      console.log('='.repeat(60));
      console.log(`To: ${toEmail}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`Verification Link: ${verificationLink}`);
      console.log('='.repeat(60));
      return true;
    }

    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}

// Send welcome email after verification
export async function sendWelcomeEmail(toEmail: string, name: string): Promise<boolean> {
  const mailOptions = {
    from: `"AMC Tvoj Coffeeshop" <${FROM_EMAIL}>`,
    to: toEmail,
    subject: 'Vitajte v AMC Tvoj Coffeeshop - Váš účet je aktívny!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #fff; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #1a1a1a; }
          .header { background: #242424; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; border-bottom: 3px solid #E31B23; }
          .header h1 { margin: 0; }
          .header span { color: #E31B23; }
          .content { background: #242424; padding: 30px; border-radius: 0 0 8px 8px; color: #fff; }
          .footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; }
          ul { color: #fff; }
          .checkmark { font-size: 48px; color: #4CAF50; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>AM<span>C</span> Tvoj Coffeeshop</h1>
          </div>
          <div class="content">
            <div class="checkmark">✓</div>
            <p>Ahoj ${name},</p>
            <p>Váš email bol úspešne overený. Váš účet je teraz plne aktívny!</p>
            <p>Teraz môžete:</p>
            <ul>
              <li>Prihlásiť sa do mobilnej aplikácie</li>
              <li>Skenovať QR kód pre zaznamenanie dochádzky</li>
              <li>Prezerať si históriu dochádzky</li>
            </ul>
            <p>Ak máte akékoľvek otázky, kontaktujte svojho manažéra.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} AMC Tvoj Coffeeshop. Všetky práva vyhradené.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Ahoj ${name},

Váš email bol úspešne overený. Váš účet je teraz plne aktívny!

Teraz môžete:
- Prihlásiť sa do mobilnej aplikácie
- Skenovať QR kód pre zaznamenanie dochádzky
- Prezerať si históriu dochádzky

Ak máte akékoľvek otázky, kontaktujte svojho manažéra.

S pozdravom,
Tím AMC Tvoj Coffeeshop
    `,
  };

  try {
    if (!isEmailConfigured()) {
      console.log('='.repeat(60));
      console.log('EMAIL NOT CONFIGURED - Welcome Email Details:');
      console.log('='.repeat(60));
      console.log(`To: ${toEmail}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log('='.repeat(60));
      return true;
    }

    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}
