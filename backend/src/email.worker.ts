
import "dotenv/config";
import { Worker } from "bullmq";
import { redisConnection } from "./config/redis.js";
import nodemailer from "nodemailer";
import EmailHistory from "./models/EmailHistory.js";
import { connectDatabase } from "./config/database.js";

await connectDatabase();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});



const emailWorker = new Worker(
  "email-scheduler",
  async (job) => {
    const { to, subject, body, userId } = job.data;
    const jobId = String(job.id);

    console.log("Sending email for job:", jobId);

    await EmailHistory.findOneAndUpdate(
      { jobId, userId },
      { status: "processing", startedAt: new Date() },
    );

    try {
      const info = await transporter.sendMail({
        from: `"Email Scheduler" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text: body,
      });

      await EmailHistory.findOneAndUpdate(
        { jobId, userId },
        {
          status: "completed",
          completedAt: new Date(),
          messageId: info.messageId,
          $unset: { errorMessage: 1 },
        },
      );

      console.log("Preview URL:", nodemailer.getTestMessageUrl(info));

      return { messageId: info.messageId };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown email error";

      await EmailHistory.findOneAndUpdate(
        { jobId, userId },
        {
          status: "failed",
          completedAt: new Date(),
          errorMessage,
        },
      );

      throw error;
    }
  },
  { connection: redisConnection },
);

emailWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

emailWorker.on("failed", (job, error) => {
  console.error(`Job ${job?.id} failed:`, error.message);
});

console.log("Email worker is waiting for jobs...");
