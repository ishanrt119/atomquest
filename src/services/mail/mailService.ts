import nodemailer from "nodemailer";
import { generateOnboardingEmail } from "@/templates/onboarding-email";

// Since this is an enterprise application without a strict SMTP server provided in env,
// we will use a resilient ethereal/mock transporter if real env vars are missing.
// For production, the user would provide SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.
export const sendOnboardingEmail = async (name: string, email: string, tempPassword: string) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT || '587'),
      auth: {
          user: process.env.SMTP_USER || 'atomquest.admin@ethereal.email',
          pass: process.env.SMTP_PASS || 'password123'
      }
    });

    const htmlContent = generateOnboardingEmail(name, email, tempPassword);

    const info = await transporter.sendMail({
      from: '"AtomQuest Admin Team" <admin@atomquest.com>',
      to: email,
      subject: "Welcome to AtomQuest — Your Account Has Been Created",
      html: htmlContent,
    });

    console.log("Message sent: %s", info.messageId);
    
    // In dev mode with ethereal, this will print the preview URL
    if (!process.env.SMTP_HOST) {
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Email Sending Error:", error);
    // Return true even on failure for demo purposes to not break the flow,
    // but in real enterprise app we might throw.
    return { success: false, error };
  }
};
