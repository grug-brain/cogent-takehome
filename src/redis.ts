import { env } from "./env";

export const connection = {
  host: env.redisHost,
  port: env.redisPort,
};
