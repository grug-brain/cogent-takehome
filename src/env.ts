import "dotenv/config";
import { z } from "zod";

const zodNumber = z.string().regex(/^\d+$/).transform(Number);

const schema = z.object({
  redisHost: z.string().default("redis"),
  redisPort: zodNumber.default("6379"),
  thumborHost: z.string().default("thumbor"),
  thumborPort: zodNumber.default("80"),
  tornadoHost: z.string().default("127.0.0.1"),
  workerConcurrency: zodNumber.default("5"),
  jobAttempts: zodNumber.default("5"),
  queueLimit: zodNumber.default("5"),
  queueDuration: zodNumber.default("1000"),
});

const result = schema.safeParse({
  redisHost: process.env.REDIS_HOST,
  redisPort: process.env.REDIS_PORT,
  thumborHost: process.env.THUMBOR_HOST,
  thumborPort: process.env.THUMBOR_PORT,
  tornadoHost: process.env.TORNADO_HOST,
  workerConcurrency: process.env.WORKER_CONCURRENCY,
  jobAttempts: process.env.JOB_ATTEMPTS,
  queueLimit: process.env.QUEUE_LIMIT,
  queueDuration: process.env.QUEUE_DURATION,
});

if (!result.success) {
  throw new Error(result.error.message);
}

console.table(result.data);

export const env = result.data;
