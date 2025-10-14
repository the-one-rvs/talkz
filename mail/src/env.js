import dotenv from 'dotenv';
dotenv.config({
    path: './env'
});



export const config = {
  rabbitUrl: process.env.RABBITMQ_URL,
  queueName: process.env.QUEUE_NAME || "email_queue",
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
  clientUrl: process.env.CLIENT_URL,
};
