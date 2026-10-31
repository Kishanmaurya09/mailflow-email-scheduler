
import { emailQueue } from "./queues/email.queue.js";

async function testQueue() {
  const job = await emailQueue.add(
  "send-email",
  {
    to: "test@example.com",
    subject: "Test scheduled email",
    body: "This is a test job.",
  },
  {
    delay: 60_000,
  },
);

  console.log("Job added successfully:", job.id);

  await emailQueue.close();
  await (await import("./config/redis.js")).redisConnection.quit();
  process.exit(0);
}

testQueue().catch((error) => {
  console.error("Queue test failed:", error);
  process.exit(1);
});
