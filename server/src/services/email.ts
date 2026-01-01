import { Resend } from 'resend';

// Email configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'AMC Tvoj Coffeeshop <onboarding@resend.dev>';

// Initialize Resend client
const resend = new Resend(RESEND_API_KEY);

// Get APP_URL dynamically - in production use RAILWAY_PUBLIC_DOMAIN or FRONTEND_URL
const getAppUrl = (): string => {
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }
  return process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
};

// Check if email is configured
export function isEmailConfigured(): boolean {
  return !!RESEND_API_KEY;
}

// Send verification email
export async function sendVerificationEmail(
  toEmail: string,
  name: string,
  verificationToken: string
): Promise<boolean> {
  const APP_URL = getAppUrl();
  const verificationLink = `${APP_URL}/api/auth/verify/${verificationToken}`;

  try {
    if (!isEmailConfigured()) {
      console.log('='.repeat(60));
      console.log('EMAIL NOT CONFIGURED - Verification Email Details:');
      console.log('='.repeat(60));
      console.log(`To: ${toEmail}`);
      console.log(`Verification Link: ${verificationLink}`);
      console.log('Set RESEND_API_KEY to enable email sending');
      console.log('='.repeat(60));
      return true;
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: 'Overte svoj účet - AMC Tvoj Coffeeshop',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #fff; margin: 0; padding: 0; background: #1a1a1a; }
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
    });

    if (error) {
      console.error('❌ Resend error sending verification email:', error);
      return false;
    }

    console.log(`✅ Verification email sent to ${toEmail}, ID: ${data?.id}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    return false;
  }
}

// Send password reset email
export async function sendPasswordResetEmail(
  toEmail: string,
  name: string,
  resetToken: string
): Promise<boolean> {
  const APP_URL = getAppUrl();
  const resetLink = `${APP_URL}/api/auth/reset-password/${resetToken}`;

  try {
    if (!isEmailConfigured()) {
      console.log('='.repeat(60));
      console.log('EMAIL NOT CONFIGURED - Password Reset Email Details:');
      console.log('='.repeat(60));
      console.log(`To: ${toEmail}`);
      console.log(`Reset Link: ${resetLink}`);
      console.log('Set RESEND_API_KEY to enable email sending');
      console.log('='.repeat(60));
      return true;
    }

    console.log(`📧 Sending password reset email to ${toEmail} via Resend...`);

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: 'Obnovenie hesla - AMC Tvoj Coffeeshop',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #fff; margin: 0; padding: 0; background: #1a1a1a; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #1a1a1a; }
            .header { background: #242424; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; border-bottom: 3px solid #E31B23; }
            .header h1 { margin: 0; }
            .header span { color: #E31B23; }
            .content { background: #242424; padding: 30px; border-radius: 0 0 8px 8px; color: #fff; }
            .button { display: inline-block; background: #E31B23; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; }
            a { color: #E31B23; }
            .warning { color: #ffcc00; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>AM<span>C</span> Tvoj Coffeeshop</h1>
            </div>
            <div class="content">
              <p>Ahoj ${name},</p>
              <p>Dostali sme žiadosť o obnovenie hesla pre váš účet. Ak ste o to nepožiadali, môžete tento email ignorovať.</p>
              <p>Pre obnovenie hesla kliknite na tlačidlo nižšie:</p>
              <p style="text-align: center;">
                <a href="${resetLink}" class="button">Obnoviť heslo</a>
              </p>
              <p>Alebo skopírujte tento odkaz do prehliadača:</p>
              <p style="word-break: break-all; color: #E31B23;">${resetLink}</p>
              <p class="warning">⚠️ Odkaz je platný iba 1 hodinu.</p>
              <p>Ak ste o obnovenie hesla nepožiadali, ignorujte tento email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} AMC Tvoj Coffeeshop. Všetky práva vyhradené.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      return false;
    }

    console.log(`✅ Password reset email sent to ${toEmail}, ID: ${data?.id}`);
    return true;
  } catch (error: any) {
    console.error('❌ Error sending password reset email:', error);
    console.error('   Error message:', error.message);
    return false;
  }
}

// Send welcome email after verification
export async function sendWelcomeEmail(toEmail: string, name: string): Promise<boolean> {
  try {
    if (!isEmailConfigured()) {
      console.log('='.repeat(60));
      console.log('EMAIL NOT CONFIGURED - Welcome Email Details:');
      console.log('='.repeat(60));
      console.log(`To: ${toEmail}`);
      console.log('Set RESEND_API_KEY to enable email sending');
      console.log('='.repeat(60));
      return true;
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: 'Vitajte v AMC Tvoj Coffeeshop - Váš účet je aktívny!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #fff; margin: 0; padding: 0; background: #1a1a1a; }
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
    });

    if (error) {
      console.error('❌ Resend error sending welcome email:', error);
      return false;
    }

    console.log(`✅ Welcome email sent to ${toEmail}, ID: ${data?.id}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    return false;
  }
}
