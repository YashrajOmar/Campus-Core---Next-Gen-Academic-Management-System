import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    console.error("CRITICAL: SMTP configuration is missing in .env");
    return NextResponse.json({
      error: "Email service not configured. Please add SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS to your .env file."
    }, { status: 500 });
  }

  // Create reusable transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    host,
    port: parseInt(port),
    secure: port === "465", // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });

  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required." }, { status: 400 });
    }

    // Send mail with defined transport object
    await transporter.sendMail({
      from: `"CampusCore" <${user}>`,
      to: email,
      subject: "Your CampusCore Verification Code",
      text: `Your CampusCore verification code is: ${otp}`, // plain text body
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #8b5cf6; text-align: center;">CampusCore</h2>
          <p>Hello,</p>
          <p>Thank you for joining CampusCore. Use the verification code below to complete your registration:</p>
          <div style="font-size: 36px; font-weight: bold; letter-spacing: 4px; color: #8b5cf6; padding: 30px; text-align: center; background: #f9f7ff; border-radius: 8px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="font-size: 14px; color: #666;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #1e1b4b; margin: 30px 0;" />
          <p style="font-size: 12px; color: #999; text-align: center;">&copy; 2026 CampusCore Academic Management System</p>
        </div>
      `,
    });

    console.log(`OTP sent successfully to ${email}`);
    return NextResponse.json({ message: "OTP sent!" }, { status: 200 });
  } catch (err: any) {
    console.error("Nodemailer Sending Error:", err);
    return NextResponse.json({
      error: "Failed to send email. Ensure your SMTP credentials and security settings (e.g. App Password) are correct.",
      details: err.message
    }, { status: 500 });

  }
}
