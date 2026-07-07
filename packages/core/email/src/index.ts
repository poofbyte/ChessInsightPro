import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn("[Email] SMTP_USER or SMTP_PASS not set. Emails will not be actually sent, only logged.");
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

const DEFAULT_FROM = process.env.EMAIL_FROM || process.env.SMTP_USER || "noreply@chessinsight.pro";

async function sendMail({ to, subject, html, text }: { to: string; subject: string; html: string; text?: string }) {
  const t = getTransporter();
  if (!t) {
    console.log(`[STUB EMAIL] To: ${to} | Subject: ${subject}`);
    if (text) console.log(`[STUB EMAIL] Content: ${text}`);
    return { success: true, stub: true };
  }

  try {
    const info = await t.sendMail({
      from: DEFAULT_FROM,
      to,
      subject,
      html,
      text,
    });
    return { success: true, data: { messageId: info.messageId } };
  } catch (error) {
    console.error("[Email Error] sendMail failed:", error);
    return { success: false, error };
  }
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const subject = "Reset your ChessInsight Pro password";
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset Request</h2>
      <p>We received a request to reset your password for your ChessInsight Pro account.</p>
      <p>Click the button below to set a new password:</p>
      <div style="margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #14b8a6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
      </div>
      <p style="color: #64748b; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
      <p style="color: #64748b; font-size: 12px; margin-top: 40px;">This link will expire in 1 hour.</p>
    </div>
  `;
  return sendMail({ to, subject, html });
}

export async function sendWelcomeEmail(to: string) {
  const subject = "Welcome to ChessInsight Pro!";
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to ChessInsight Pro! ♟️</h2>
      <p>We're thrilled to have you on board.</p>
      <p>With ChessInsight Pro, you can analyze your games, discover your weaknesses, and solve personalized puzzles to improve your play.</p>
      <p>Head over to your dashboard to get started and sync your first Lichess or Chess.com games.</p>
      <div style="margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://chessinsight.pro"}/dashboard" style="background-color: #14b8a6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Dashboard</a>
      </div>
    </div>
  `;
  return sendMail({ to, subject, html });
}

export async function sendUpgradeApprovedEmail(to: string, plan: string, price: string | number) {
  const subject = "Your ChessInsight Pro Upgrade is Approved! 🎉";
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Upgrade Successful!</h2>
      <p>Great news! Your manual payment of <strong>${price} BDT</strong> has been verified, and your account has been upgraded to the <strong>${plan}</strong> plan.</p>
      <p>Your new features and quotas are now active. You can check your status anytime on your Profile page.</p>
      <div style="margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://chessinsight.pro"}/profile" style="background-color: #14b8a6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View My Profile</a>
      </div>
      <p>Thank you for supporting ChessInsight Pro!</p>
    </div>
  `;
  return sendMail({ to, subject, html });
}

export async function sendUpgradeRejectedEmail(to: string, reason?: string) {
  const subject = "Update regarding your ChessInsight Pro Upgrade";
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Upgrade Request Update</h2>
      <p>We've reviewed your recent upgrade request, but unfortunately, we could not verify your payment at this time.</p>
      ${reason ? `<p><strong>Reason provided:</strong> ${reason}</p>` : ''}
      <p>If you believe this is a mistake, or if you need help completing your payment, please reply directly to this email or contact our support team.</p>
    </div>
  `;
  return sendMail({ to, subject, html });
}

export async function sendContactConfirmationEmail(to: string, name: string) {
  const subject = "We received your message - ChessInsight Pro";
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #0f172a; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #14b8a6; margin: 0; font-size: 24px;">ChessInsight Pro</h1>
      </div>
      <div style="padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-top: none;">
        <h2 style="color: #0f172a; margin-top: 0;">Thank you for contacting us, ${name}!</h2>
        <p style="color: #334155; line-height: 1.6;">We've received your message and will get back to you as soon as possible. Our team typically responds within 24-48 hours.</p>
        <p style="color: #334155; line-height: 1.6;">If you have an urgent matter, please reply directly to this email and we'll prioritize your request.</p>
        <div style="margin: 32px 0; padding: 16px; background-color: #f8fafc; border-radius: 6px; border-left: 4px solid #14b8a6;">
          <p style="color: #64748b; font-size: 14px; margin: 0;">This is an automated confirmation. Please do not reply to this email directly unless requested.</p>
        </div>
      </div>
      <div style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} ChessInsight Pro. All rights reserved.</p>
      </div>
    </div>
  `;
  const text = `Thank you for contacting us, ${name}! We've received your message and will get back to you as soon as possible.`;
  return sendMail({ to, subject, html, text });
}

export async function sendContactReplyEmail(to: string, name: string, replyBody: string, originalSubject: string) {
  const subject = `Re: ${originalSubject} - ChessInsight Pro`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #0f172a; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #14b8a6; margin: 0; font-size: 24px;">ChessInsight Pro</h1>
      </div>
      <div style="padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-top: none;">
        <h2 style="color: #0f172a; margin-top: 0;">Hello ${name},</h2>
        <p style="color: #334155; line-height: 1.6;">Our team has replied to your message regarding <strong>${originalSubject}</strong>:</p>
        <div style="margin: 24px 0; padding: 20px; background-color: #f8fafc; border-radius: 6px; border-left: 4px solid #14b8a6;">
          <p style="color: #0f172a; line-height: 1.6; white-space: pre-wrap; margin: 0;">${replyBody}</p>
        </div>
        <p style="color: #334155; line-height: 1.6;">If you have any further questions, feel free to reply to this email.</p>
      </div>
      <div style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} ChessInsight Pro. All rights reserved.</p>
      </div>
    </div>
  `;
  const text = `Hello ${name},\n\nOur team has replied to your message regarding "${originalSubject}":\n\n${replyBody}\n\nIf you have any further questions, feel free to reply to this email.`;
  return sendMail({ to, subject, html, text });
}

export async function sendAdminUpgradeRequestNotification(userEmail: string, plan: string, price: number | string, quotas: any) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "hiranmayroy183@gmail.com";
  const subject = `[Admin] New Upgrade Request from ${userEmail}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>New Upgrade Request Submitted</h2>
      <p><strong>User:</strong> ${userEmail}</p>
      <p><strong>Requested Plan:</strong> ${plan}</p>
      <p><strong>Price:</strong> ${price} BDT</p>
      ${quotas ? `<p><strong>Requested Quotas:</strong><br/><pre>${JSON.stringify(quotas, null, 2)}</pre></p>` : ''}
      <div style="margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://chessinsight.pro"}/admin/upgrade-requests" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Review in Admin Panel</a>
      </div>
    </div>
  `;
  return sendMail({ to: adminEmail, subject, html });
}
