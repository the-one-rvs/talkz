import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import "dotenv/config";

const __dirname = path.resolve();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * 📨 Send Verification Email
 */
export const sendVerificationEmail = async (to, token) => {
  const verifyUrl = `${process.env.VERIFY_URL}/verify-email?token=${token}`;
  const logoPath = path.join(__dirname, "assets", "logo.png");

  const mailOptions = {
    from: `"TalkZ" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Verify your TalkZ Account",
    attachments: [
      {
        filename: "logo.png",
        path: logoPath,
        cid: "talkzlogo", // content id used in img src
      },
    ],
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f9f9fb; padding: 30px; color: #333;">
        <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 3px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; padding: 20px 0; background-color: #000;">
            <img src="cid:talkzlogo" alt="TalkZ Logo" style="width: 150px; height: 100px; border-radius: 10px;" />
            <h2 style="color: #fff; margin-top: 10px;">Welcome to TalkZ 👋</h2>
          </div>

          <div style="padding: 25px;">
            <p style="font-size: 16px;">Hey there,</p>
            <p style="font-size: 15px; line-height: 1.5;">
              Thank you for joining <b>TalkZ</b>! Please verify your email address by clicking the button below:
            </p>

            <div style="text-align: center; margin: 25px 0;">
              <a href="${verifyUrl}" 
                 style="background-color: #007bff; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold;">
                Verify Email
              </a>
            </div>

            <p style="font-size: 14px; color: #555;">
              If you didn’t register, you can safely ignore this email.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />

            <p style="font-size: 13px; text-align: center; color: #888;">
              &copy; ${new Date().getFullYear()} TalkZ — Connecting conversations securely.
            </p>
          </div>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`📧 Verification email sent to ${to}`);
};

/**
 * 💬 Send Offline Message Notification
 */
export const sendOfflineEmail = async (to, fromUser, message) => {
  const logoPath = path.join(__dirname, "assets", "logo.png");

  const mailOptions = {
    from: `"TalkZ" <${process.env.EMAIL_USER}>`,
    to,
    subject: `💬 New message from ${fromUser}`,
    attachments: [
      {
        filename: "logo.png",
        path: logoPath,
        cid: "talkzlogo",
      },
    ],
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f9f9fb; padding: 30px; color: #333;">
        <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 3px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; padding: 20px 0; background-color: #000;">
            <img src="cid:talkzlogo" alt="TalkZ Logo" style="width: 150px; height: 100px; border-radius: 10px;" />
            <h2 style="color: #fff; margin-top: 10px;">You’ve got a new message 💬</h2>
          </div>

          <div style="padding: 25px;">
            <p style="font-size: 16px;">Hey there,</p>
            <p style="font-size: 15px; line-height: 1.5;">
              <b>${fromUser}</b> sent you a new message while you were offline:
            </p>

            <blockquote style="font-style: italic; background: #f1f3f5; border-left: 4px solid #007bff; padding: 12px 16px; border-radius: 6px; margin: 20px 0;">
              ${message}
            </blockquote>

            <p style="font-size: 15px;">
              Log in to <b>TalkZ</b> to reply and continue your chat.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />

            <p style="font-size: 13px; text-align: center; color: #888;">
              &copy; ${new Date().getFullYear()} TalkZ — Stay connected, anytime, anywhere.
            </p>
          </div>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`📧 Offline message email sent to ${to}`);
};
