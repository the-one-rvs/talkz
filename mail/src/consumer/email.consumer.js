import { getChannel } from "../queues/rabbitmq.js";
import { sendVerificationEmail, sendOfflineEmail } from "../utils/sendEmail.js";
import { config } from "../env.js";

export const consumeEmailEvents = async () => {
  const channel = getChannel();

  channel.consume(config.queueName, async (msg) => {
    if (!msg) return;

    const content = msg.content.toString();
    let data;

    try {
      data = JSON.parse(content);
    } catch (err) {
      console.error(" Invalid message format:", content);
      channel.ack(msg);
      return;
    }

    try {
      switch (data.type) {
        case "EMAIL_VERIFICATION":
          await sendVerificationEmail(data.to, data.token);
          break;

        case "OFFLINE_MESSAGE":
          await sendOfflineEmail(data.to, data.from, data.message);
          break;

        default:
          console.log("⚠️ Unknown message type:", data.type);
      }

      channel.ack(msg);
    } catch (err) {
      console.error("❌ Failed to process email event:", err.message);
      channel.nack(msg, false, false); 
    }
  });

  console.log(`📩 Listening to queue: ${config.queueName}`);
};
