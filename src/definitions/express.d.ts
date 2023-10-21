import { Job, Queue } from "bullmq";
import "express";

declare global {
  namespace Express {
    interface Locals {
      queueName: string;
      queue: Queue;
      createJob: (
        body: Buffer,
        contentType: string
      ) => Promise<Job<ThumbnailJob>>;
    }
  }
}
