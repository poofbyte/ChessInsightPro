import { Resend } from 'resend';

// Helper to get Resend instance safely
function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Email] RESEND_API_KEY is not set. Emails will not be actually sent, only logged.");
    return null;
  }
  return new Resend(apiKey);
}

const DEFAULT_SENDER = process.env.RESEND_FROM_EMAIL || "ChessInsight Pro <noreply@chessinsight.com>";

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const resend = getResend();
  
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

  if (!resend) {
    console.log(`[STUB EMAIL] To: ${to} | Subject: ${subject}`);
    console.log(`[STUB EMAIL] Content: Reset URL is ${resetUrl}`);
    return { success: true, stub: true };
  }

  try {
    const data = await resend.emails.send({
      from: DEFAULT_SENDER,
      to,
      subject,
      html
    });
    return { success: true, data };
  } catch (error) {
    console.error("[Email Error] sendPasswordResetEmail failed:", error);
    return { success: false, error };
  }
}

export async function sendWelcomeEmail(to: string) {
  const resend = getResend();
  
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

  if (!resend) {
    console.log(`[STUB EMAIL] To: ${to} | Subject: ${subject}`);
    return { success: true, stub: true };
  }

  try {
    const data = await resend.emails.send({
      from: DEFAULT_SENDER,
      to,
      subject,
      html
    });
    return { success: true, data };
  } catch (error) {
    console.error("[Email Error] sendWelcomeEmail failed:", error);
    return { success: false, error };
  }
}

export async function sendUpgradeApprovedEmail(to: string, plan: string, price: string | number) {
  const resend = getResend();
  
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

  if (!resend) {
    console.log(`[STUB EMAIL] To: ${to} | Subject: ${subject}`);
    return { success: true, stub: true };
  }

  try {
    const data = await resend.emails.send({
      from: DEFAULT_SENDER,
      to,
      subject,
      html
    });
    return { success: true, data };
  } catch (error) {
    console.error("[Email Error] sendUpgradeApprovedEmail failed:", error);
    return { success: false, error };
  }
}

export async function sendUpgradeRejectedEmail(to: string, reason?: string) {
  const resend = getResend();
  
  const subject = "Update regarding your ChessInsight Pro Upgrade";
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Upgrade Request Update</h2>
      <p>We've reviewed your recent upgrade request, but unfortunately, we could not verify your payment at this time.</p>
      ${reason ? `<p><strong>Reason provided:</strong> ${reason}</p>` : ''}
      <p>If you believe this is a mistake, or if you need help completing your payment, please reply directly to this email or contact our support team.</p>
    </div>
  `;

  if (!resend) {
    console.log(`[STUB EMAIL] To: ${to} | Subject: ${subject}`);
    return { success: true, stub: true };
  }

  try {
    const data = await resend.emails.send({
      from: DEFAULT_SENDER,
      to,
      subject,
      html
    });
    return { success: true, data };
  } catch (error) {
    console.error("[Email Error] sendUpgradeRejectedEmail failed:", error);
    return { success: false, error };
  }
}

export async function sendAdminUpgradeRequestNotification(userEmail: string, plan: string, price: number | string, quotas: any) {
  const resend = getResend();
  
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

  if (!resend) {
    console.log(`[STUB EMAIL] To: ${adminEmail} | Subject: ${subject}`);
    return { success: true, stub: true };
  }

  try {
    const data = await resend.emails.send({
      from: DEFAULT_SENDER,
      to: adminEmail,
      subject,
      html
    });
    return { success: true, data };
  } catch (error) {
    console.error("[Email Error] sendAdminUpgradeRequestNotification failed:", error);
    return { success: false, error };
  }
}
