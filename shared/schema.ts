import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  prompt: text("prompt").notNull(),
  model: text("model").default("musicgen-medium"),
  preset: text("preset"),
  durationSec: integer("duration_sec").default(30),
  format: text("format").default("mp3"),
  seed: integer("seed"),
  generationParams: jsonb("generation_params"), // {temperature, top_k, top_p, cfg_scale}
  qualityParams: jsonb("quality_params"), // {num_candidates, rerank, lufs_target, limiter}
  audioUrl: text("audio_url"),
  selectedCandidate: integer("selected_candidate"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
});

// === BASE SCHEMAS ===
export const insertJobSchema = createInsertSchema(jobs).omit({ 
  id: true, 
  createdAt: true, 
  startedAt: true, 
  finishedAt: true,
  status: true,
  audioUrl: true,
  error: true,
  selectedCandidate: true 
});

// === EXPLICIT API CONTRACT TYPES ===
export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type CreateJobRequest = InsertJob;
export type JobResponse = Job;

// For the worker to update job status
export type UpdateJobRequest = Partial<Job>;
