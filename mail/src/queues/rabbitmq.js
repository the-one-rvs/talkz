import amqplib from "amqplib";
import { config } from "../env.js";

let channel;

export const connectRabbitMQ = async () => {
  const connection = await amqplib.connect(config.rabbitUrl);
  channel = await connection.createChannel();
  await channel.assertQueue(config.queueName, { durable: true });
  console.log("✅ Email-Service connected to RabbitMQ");

  return channel;
};

export const getChannel = () => channel;
