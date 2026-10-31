
import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";

export const emailQueue = new Queue("email-scheduler", {
  connection: redisConnection,
});

console.log("Email scheduling queue initialized");
