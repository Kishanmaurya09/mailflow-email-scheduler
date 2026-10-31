
import mongoose, { Schema, Document } from "mongoose";

export interface IEmailHistory extends Document {
  userId: string;
  jobId: string;
  to: string;
  subject: string;
  body: string;
  status: "scheduled" | "processing" | "completed" | "failed";
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  messageId?: string;
}

const emailHistorySchema = new Schema<IEmailHistory>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    jobId: {
      type: String,
      required: true,
      unique: true,
    },
    to: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "processing", "completed", "failed"],
      default: "scheduled",
      required: true,
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    startedAt: Date,
    completedAt: Date,
    errorMessage: String,
    messageId: String,
  },
  { timestamps: true },
);

const EmailHistory = mongoose.model<IEmailHistory>(
  "EmailHistory",
  emailHistorySchema,
);

export default EmailHistory;
