import pino from "pino-http";

export const logger = pino({
  transport: {
    target: "pino/file",
    options: {
      destination: `${__dirname}/../logs/app.log`,
    },
  },
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
});
