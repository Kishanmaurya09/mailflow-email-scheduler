import EmailHistory from "./models/EmailHistory.js";
import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDatabase } from "./config/database.js";
import { emailQueue } from "./queues/email.queue.js";
import { authMiddleware, type AuthRequest } from "./middleware/auth.middleware.js";
import authRouter from "./routes/auth.routes.js";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use("/auth", authRouter);

app.get("/", (_req, res) => {
  res.send("Email Scheduler API is running!");
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Email Scheduler API is healthy",
  });
});

// Schedule an email

app.post("/schedule-email", authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    const { to, subject, body, delayInSeconds } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (
      typeof to !== "string" || !to.trim() ||
      typeof subject !== "string" || !subject.trim() ||
      typeof body !== "string" || !body.trim()
    ) {
      res.status(400).json({
        success: false,
        message: "to, subject, and body are required",
      });
      return;
    }

    const delay = Number(delayInSeconds);

    if (!Number.isFinite(delay) || delay < 0) {
      res.status(400).json({
        success: false,
        message: "delayInSeconds must be a non-negative number",
      });
      return;
    }

    const cleanTo = to.trim();
    const cleanSubject = subject.trim();
    const cleanBody = body.trim();
    const scheduledAt = new Date(Date.now() + delay * 1000);

    const job = await emailQueue.add(
      "send-email",
      {
        to: cleanTo,
        subject: cleanSubject,
        body: cleanBody,
        userId,
      },
      { delay: delay * 1000 },
    );

    try {
      await EmailHistory.create({
        userId,
        jobId: String(job.id),
        to: cleanTo,
        subject: cleanSubject,
        body: cleanBody,
        status: "scheduled",
        scheduledAt,
      });
    } catch (historyError) {
      await job.remove();
      throw historyError;
    }

    res.status(201).json({
      success: true,
      message: "Email scheduled successfully",
      jobId: job.id,
      delayInSeconds: delay,
    });
  } catch (error) {
    console.error("Scheduling failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to schedule email",
    });
  }
});


// Get only the logged-in user's emails
app.get("/scheduled-emails", authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const jobs = await emailQueue.getJobs([
      "waiting",
      "delayed",
      "active",
      "completed",
      "failed",
    ]);

    const userJobs = jobs.filter((job) => job.data.userId === userId);

    res.json({
      success: true,
      jobs: await Promise.all(
        userJobs.map(async (job) => {
          const state = await job.getState();

          return {
            id: job.id,
            to: job.data.to,
            subject: job.data.subject,
            body: job.data.body,
            delayInSeconds: Math.ceil((job.opts.delay ?? 0) / 1000),
            status: state,
          };
        }),
      ),
    });
  } catch (error) {
    console.error("Fetching jobs failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch scheduled emails",
    });
  }
});

// Get one email — owner only
app.get("/scheduled-emails/:id", authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    const jobId = Array.isArray(req.params.id)
  ? req.params.id[0]
  : req.params.id;

const job = await emailQueue.getJob(jobId);

    if (!job || job.data.userId !== userId) {
      res.status(404).json({
        success: false,
        message: "Email not found",
      });
      return;
    }

    const state = await job.getState();

    res.json({
      success: true,
      email: {
        id: job.id,
        to: job.data.to,
        subject: job.data.subject,
        body: job.data.body,
        status: state,
        delayInSeconds: Math.ceil((job.opts.delay ?? 0) / 1000),
      },
    });
  } catch (error) {
    console.error("Fetching email failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch email",
    });
  }
});

// Cancel a scheduled email — owner only
app.delete("/scheduled-emails/:id", authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    const jobId = Array.isArray(req.params.id)
  ? req.params.id[0]
  : req.params.id;

const job = await emailQueue.getJob(jobId);

    if (!job || job.data.userId !== userId) {
      res.status(404).json({
        success: false,
        message: "Email job not found",
      });
      return;
    }

    const state = await job.getState();

    if (state === "active" || state === "completed" || state === "failed") {
      res.status(409).json({
        success: false,
        message: `Cannot cancel an email that is ${state}`,
      });
      return;
    }

    await job.remove();

    res.json({
      success: true,
      message: "Scheduled email cancelled successfully",
      jobId: req.params.id,
    });
  } catch (error) {
    console.error("Cancelling email failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel scheduled email",
    });
  }
});

// Delete completed/failed email history — owner only
app.delete("/scheduled-emails/:id/history", authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    const jobId = Array.isArray(req.params.id)
  ? req.params.id[0]
  : req.params.id;

const job = await emailQueue.getJob(jobId);

    if (!job || job.data.userId !== userId) {
      res.status(404).json({
        success: false,
        message: "Email history not found",
      });
      return;
    }

    const state = await job.getState();

    if (state !== "completed" && state !== "failed") {
      res.status(409).json({
        success: false,
        message: "Only completed or failed email history can be deleted",
      });
      return;
    }

    await job.remove();

    res.json({
      success: true,
      message: "Email history deleted successfully",
      jobId: req.params.id,
    });
  } catch (error) {
    console.error("Deleting email history failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete email history",
    });
  }
});

// Edit a scheduled email — owner only

app.patch("/scheduled-emails/:id", authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    const jobId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const job = await emailQueue.getJob(jobId);

    if (!job || job.data.userId !== userId) {
      res.status(404).json({
        success: false,
        message: "Email job not found",
      });
      return;
    }

    const state = await job.getState();

    if (state !== "waiting" && state !== "delayed") {
      res.status(409).json({
        success: false,
        message: "Only waiting or delayed emails can be edited",
      });
      return;
    }

    const { to, subject, body, delayInSeconds } = req.body;

    if (
      typeof to !== "string" || !to.trim() ||
      typeof subject !== "string" || !subject.trim() ||
      typeof body !== "string" || !body.trim()
    ) {
      res.status(400).json({
        success: false,
        message: "to, subject, and body are required",
      });
      return;
    }

    const delay = Number(delayInSeconds);

    if (!Number.isFinite(delay) || delay < 0) {
      res.status(400).json({
        success: false,
        message: "delayInSeconds must be a non-negative number",
      });
      return;
    }

    const cleanTo = to.trim();
    const cleanSubject = subject.trim();
    const cleanBody = body.trim();

    // Confirm the history record belongs to this user.
    const history = await EmailHistory.findOne({
      jobId: String(job.id),
      userId,
    });

    if (!history) {
      res.status(404).json({
        success: false,
        message: "Email history record not found",
      });
      return;
    }

    const updatedJob = await emailQueue.add(
      "send-email",
      {
        to: cleanTo,
        subject: cleanSubject,
        body: cleanBody,
        userId,
      },
      { delay: delay * 1000 },
    );

    try {
      history.jobId = String(updatedJob.id);
      history.to = cleanTo;
      history.subject = cleanSubject;
      history.body = cleanBody;
      history.status = "scheduled";
      history.scheduledAt = new Date(Date.now() + delay * 1000);
      history.startedAt = undefined;
      history.completedAt = undefined;
      history.errorMessage = undefined;
      history.messageId = undefined;

      await history.save();
    } catch (historyError) {
      await updatedJob.remove();
      throw historyError;
    }

    await job.remove();

    res.json({
      success: true,
      message: "Scheduled email updated successfully",
      jobId: updatedJob.id,
    });
  } catch (error) {
    console.error("Updating email failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update scheduled email",
    });
  }
});



app.get("/email-history", authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const history = await EmailHistory.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    console.error("Fetching email history failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch email history",
    });
  }
});



connectDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  });
