import "dotenv/config";
import { z } from "zod";

const zodNumber = z.string().regex(/^\d+$/).transform(Number);

const schema = z.object({
  redisHost: z.string().default("redis"),
  redisPort: zodNumber.default("6379"),
  thumborHost: z.string().default("thumbor"),
  thumborPort: zodNumber.default("80"),
  tornadoHost: z.string().default("127.0.0.1"),
});

const result = schema.safeParse({
  redisHost: process.env.REDIS_HOST,
  redisPort: process.env.REDIS_PORT,
  thumborHost: process.env.THUMBOR_HOST,
  thumborPort: process.env.THUMBOR_PORT,
  tornadoHost: process.env.TORNADO_HOST,
});

if (!result.success) {
  throw new Error(result.error.message);
}

console.table(result.data);

export const env = result.data;
