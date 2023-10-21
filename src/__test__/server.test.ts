import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { connection } from "../redis";
import { app } from "../server";

import fs from "fs";

import { Queue } from "bullmq";
import path from "path";

const img = fs.readFileSync(path.resolve(__dirname, "./img.jpeg"));
const buffer = Buffer.from(img);

beforeEach(() => {
  const name = `${Date.now()}`;
  app.locals.queueName = name;
  app.locals.queue = new Queue(name, { connection });
  app.locals.createJob = async (body) => {
    const job = await app.locals.queue.add("resize", {
      body,
    });

    return job;
  };
});

afterEach(() => {
  try {
    app.locals.queue.obliterate({ force: true });
  } catch (e) {}
});

describe("server", () => {
  describe("POST /job", () => {
    describe("200", () => {
      it("should respond with job id and status", async () => {
        const res = await request(app).post("/job").send(buffer);
        expect([res.body.id, res.body.status]).toEqual(["1", "waiting"]);
      });
    });
    describe("500", () => {
      it("should respond with 500 if job creation fails", async () => {
        app.locals.createJob = async () => {
          throw new Error("error");
        };
        const res = await request(app).post("/job").send(buffer);
        expect(res.status).toEqual(500);
      });
    });
  });

  describe("GET /job/:id", () => {
    describe("200", () => {
      it("should respond with job status", async () => {
        const res = await request(app).post("/job");
        const res2 = await request(app).get(`/job/${res.body.id}`);

        expect(["active", "waiting", "completed"]).toContain(res2.body.status);
      });
    });
    describe("404", () => {
      it("should respond with 404 if job does not exist", async () => {
        const res = await request(app).get(`/job/pikachu`);
        expect(res.status).toEqual(404);
      });
    });
  });

  describe("GET /jobs", () => {
    describe("200", () => {
      it("should respond with a list of jobs", async () => {
        await request(app).post("/job");
        const res = await request(app).get("/jobs");

        expect(res.body.length).toBe(1);
      });
    });

    describe("500", () => {
      it("should respond with 500 if job status retrieval fails", async () => {
        app.locals.queue.getJobs = async () => {
          throw new Error("error");
        };
        const res = await request(app).get(`/jobs`);
        expect(res.status).toEqual(500);
      });
    });
  });
});
