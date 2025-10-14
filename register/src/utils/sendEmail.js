// import nodemailer from "nodemailer";
// import { asyncHandler } from "./asyncHandler.js";

// export const sendVerificationEmail = asyncHandler(async (email, token) => {
//   const link = `http://localhost:5000/api/v1/registerService/verify-email?token=${token}`;

//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS, 
//     },
//   });

//   await transporter.sendMail({
//     from: `"Talkz " <${process.env.EMAIL_USER}>`,
//     to: email,
//     subject: "Verify your email",
//     html: `<p>Please verify your email by clicking the link below:</p><a href="${link}">${link}</a>`,
//   });
// });
