import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import Redis from "ioredis";

// Initialize Redis if URL is provided
let redis: Redis | null = null;
if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL);
    console.log("Connected to Redis");
  } catch (error) {
    console.error("Failed to connect to Redis:", error);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Create a new job
  app.post(api.jobs.create.path, async (req, res) => {
    try {
      const input = api.jobs.create.input.parse(req.body);
      const job = await storage.createJob(input);
      
      // Push to Redis if available
      if (redis) {
        try {
          await redis.rpush("jobs", String(job.id));
          console.log(`Pushed job ${job.id} to Redis queue 'jobs'`);
        } catch (error) {
          console.error("Failed to push job to Redis:", error);
          // Don't fail the request, just log it. The worker might poll DB as fallback.
        }
      } else {
        console.log(`Redis not configured, job ${job.id} saved to DB only.`);
      }
      
      res.status(201).json(job);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Get a specific job
  app.get(api.jobs.get.path, async (req, res) => {
    const job = await storage.getJob(Number(req.params.id));
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json(job);
  });

  // List all jobs
  app.get(api.jobs.list.path, async (req, res) => {
    const jobs = await storage.getJobs();
    res.json(jobs);
  });

  // Helper endpoints matching requirements
  app.get("/api/models", (_req, res) => {
    res.json({
      models: ["musicgen-medium", "musicgen-small", "musicgen-large"],
      presets: ["pop", "rock", "jazz", "lofi"]
    });
  });

  app.get("/api/health", async (_req, res) => {
    // Check DB connection
    let dbStatus = "unknown";
    try {
      await storage.getJobs();
      dbStatus = "connected";
    } catch (e) {
      dbStatus = "disconnected";
    }

    res.json({
      status: "ok",
      database: dbStatus,
      redis: redis ? "connected" : "not_configured"
    });
  });

  // Update a job (used by worker)
  app.patch(api.jobs.update.path, async (req, res) => {
    try {
      // Use partial schema for updates
      const input = api.jobs.update.input.parse(req.body);
      const job = await storage.updateJob(Number(req.params.id), input);
      
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
      
      res.json(job);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Seed some example data if empty
  const existingJobs = await storage.getJobs();
  if (existingJobs.length === 0) {
    console.log("Seeding database with example jobs...");
    await storage.createJob({
      prompt: "Lo-fi hip hop beat with jazzy piano chords",
      durationSec: 30,
      format: "mp3",
      status: "completed",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" // Example MP3
    });
    await storage.createJob({
      prompt: "Epic orchestral soundtrack for a fantasy movie",
      durationSec: 15,
      format: "mp3",
      status: "pending"
    });
  }

  return httpServer;
}
