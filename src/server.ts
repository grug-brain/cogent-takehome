import { Job, Queue, Worker } from "bullmq";
import express from "express";
import { v4 as uuid } from "uuid";
import { env } from "./env";
import { connection } from "./redis";

type ThumbnailJob = {
  body: {
    type: string;
    data: number[];
  };
  contentType: string;
  url: string;
};

const THUMBOR_HOST = `http://${env.thumborHost}:${env.thumborPort}`;

const app = express();
app.locals.queueName = "thumbnails";
app.locals.queue = new Queue(app.locals.queueName, { connection });
app.locals.createJob = async (body, contentType) => {
  const queuedJob = await app.locals.queue.add(
    "resize",
    { body, contentType },
    {
      jobId: uuid(),
    }
  );

  return queuedJob;
};

new Worker(
  app.locals.queueName,
  async (job: Job<ThumbnailJob>) => {
    const headers = new Headers();
    headers.append("Content-Type", job.data.contentType);

    const response = await fetch(`${THUMBOR_HOST}/image`, {
      method: "POST",
      headers,
      body: Buffer.from(job.data.body.data),
    });

    const originUrl = encodeURIComponent(
      `${THUMBOR_HOST}${response.headers.get("location")}`
    );
    const thumborPath = `unsafe/fit-in/100x100/smart/${originUrl}`;
    const thumborProcessUrl = `${THUMBOR_HOST}/${thumborPath}`;
    const publicUrl = `${env.tornadoHost}/${thumborPath}`;

    await fetch(thumborProcessUrl);

    job.updateProgress(100);
    job.updateData({ ...job.data, url: publicUrl });
  },
  {
    autorun: true,
    connection,
  }
);

app
  .use(express.raw({ type: "*/*", limit: "2mb" }))
  .get("/health", (req, res) => res.send(200))
  .post("/job", async (req, res) => {
    try {
      const job = await app.locals.createJob(
        req.body,
        req.headers["content-type"] || "image/png"
      );
      const status = await job.getState();
      const { id } = job;
      res.send({ id, status });
    } catch (e) {
      res.status(500).send({ message: "job creation failed" });
    }
  })
  .get("/job/:id", async (req, res) => {
    const { id } = req.params;
    const job = await app.locals.queue.getJob(id);
    if (!job) {
      return res.status(404).send({ message: "job not found" });
    }
    try {
      const status = await job.getState();
      res.json({ status, url: job.data.url });
    } catch (e) {
      res.status(500).send({ message: "job status retrieval failed" });
    }
  })
  .get("/jobs", async (req, res) => {
    try {
      const jobs = await app.locals.queue.getJobs();
      const list = jobs.map((j) => ({
        id: j.id,
        status: j.getState(),
      }));
      res.json(list);
    } catch (e) {
      res.status(500).send({ message: "job list retrieval failed" });
    }
  });

export { app };
