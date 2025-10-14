import { connectRabbitMQ } from "./queues/rabbitmq.js";
import { consumeEmailEvents } from "./consumer/email.consumer.js";


const startServer = async () => {
  try {
    (async () => {
      await connectRabbitMQ();
      consumeEmailEvents();
    })();
  } catch (err) {
    console.error("❌ Failed to start email-service:", err);
    process.exit(1);
  }
};

startServer();
