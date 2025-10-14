import amqplib from "amqplib";

let channel;

export const connectRabbitMQ = async () => {
  const connection = await amqplib.connect(process.env.RABBITMQ_URL || "amqp://localhost");
  channel = await connection.createChannel();
  await channel.assertQueue(process.env.QUEUE_NAME, { durable: true });
  console.log("✅ chatHandlerService connected to RabbitMQ");
};

export const publishEmailEvent = async (data) => {
  if (!channel) throw new Error("RabbitMQ channel not initialized");
  channel.sendToQueue(process.env.QUEUE_NAME, Buffer.from(JSON.stringify(data)), { persistent: true });
  console.log(`✅ Message sent to RabbitMQ to queue ${process.env.QUEUE_NAME}`);
};
