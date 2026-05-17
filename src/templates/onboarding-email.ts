export const generateOnboardingEmail = (name: string, email: string, tempPassword: string) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to AtomQuest</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f9fafb;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .header {
      background-color: #111827;
      padding: 32px 40px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.025em;
    }
    .content {
      padding: 40px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 24px;
      color: #111827;
    }
    .credentials-box {
      background-color: #f3f4f6;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 24px;
      margin: 24px 0;
    }
    .credential-row {
      margin-bottom: 12px;
    }
    .credential-row:last-child {
      margin-bottom: 0;
    }
    .credential-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6b7280;
      font-weight: 600;
      display: block;
      margin-bottom: 4px;
    }
    .credential-value {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 16px;
      font-weight: 500;
      color: #111827;
    }
    .button-container {
      text-align: center;
      margin: 32px 0;
    }
    .button {
      display: inline-block;
      background-color: #2563eb;
      color: #ffffff !important;
      font-weight: 500;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 6px;
      transition: background-color 0.2s;
    }
    .button:hover {
      background-color: #1d4ed8;
    }
    .security-note {
      font-size: 14px;
      color: #6b7280;
      background-color: #fffbeb;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      margin-top: 32px;
    }
    .footer {
      background-color: #f9fafb;
      padding: 24px 40px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AtomQuest</h1>
    </div>
    
    <div class="content">
      <div class="greeting">Hello ${name},</div>
      
      <p>Your AtomQuest account has been created successfully by your administrator. You can now log in to the enterprise goal setting and tracking portal.</p>
      
      <div class="credentials-box">
        <div class="credential-row">
          <span class="credential-label">Email / Username</span>
          <span class="credential-value">${email}</span>
        </div>
        <div class="credential-row">
          <span class="credential-label">Temporary Password</span>
          <span class="credential-value">${tempPassword}</span>
        </div>
      </div>
      
      <div class="button-container">
        <!-- Replace with your actual production domain if environment variable is available, else fallback -->
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" class="button">Log In to AtomQuest</a>
      </div>
      
      <div class="security-note">
        <strong>Security Notice:</strong> For security reasons, you will be required to change your password immediately upon your first login. Do not share your credentials with anyone.
      </div>
    </div>
    
    <div class="footer">
      <p>Regards,<br>AtomQuest Admin Team</p>
      <p style="font-size: 12px; margin-top: 16px;">This is an automated message, please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `;
};
