import { db } from "./db";
import {
  jobs,
  type Job,
  type InsertJob,
  type UpdateJobRequest
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  createJob(job: InsertJob): Promise<Job>;
  getJob(id: number): Promise<Job | undefined>;
  getJobs(): Promise<Job[]>;
  updateJob(id: number, updates: UpdateJobRequest): Promise<Job | undefined>;
}

export class DatabaseStorage implements IStorage {
  async createJob(insertJob: InsertJob): Promise<Job> {
    const [job] = await db.insert(jobs).values(insertJob).returning();
    return job;
  }

  async getJob(id: number): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job;
  }

  async getJobs(): Promise<Job[]> {
    return await db.select().from(jobs).orderBy(desc(jobs.createdAt));
  }

  async updateJob(id: number, updates: UpdateJobRequest): Promise<Job | undefined> {
    const [updatedJob] = await db
      .update(jobs)
      .set(updates)
      .where(eq(jobs.id, id))
      .returning();
    return updatedJob;
  }
}

export const storage = new DatabaseStorage();
