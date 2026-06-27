// services/scheduler/SchedulerService.js
//
// Scheduling is NOT fully implemented yet (per requirements). This defines the
// interface + an in-memory store so the API contract is stable now, and a real
// engine (node-cron, BullMQ, or a DB-backed worker) can be dropped in later
// WITHOUT changing controllers or the frontend.
//
// To make it real later, implement an "engine" that:
//   1) persists jobs (DB instead of the in-memory Map),
//   2) at `scheduledAt`, calls the matching MetaService action,
//   3) updates job status (queued -> processing -> completed/failed).
//
// The controller already calls scheduler.schedule(); only this file changes.

import { randomUUID } from 'node:crypto';
import logger from '../../utils/logger.js';

const SUPPORTED_TARGETS = new Set([
  'instagram.post',
  'facebook.post',
  'instagram.comment.reply',
]);

export class SchedulerService {
  constructor() {
    // In-memory only (no DB yet). Lost on restart — intentional placeholder.
    this.jobs = new Map();
    this.engineActive = false; // becomes true once a real engine is wired in.
  }

  /**
   * Queue a job. Validates and stores it, but does NOT execute it yet.
   * @param {object} input
   * @param {string} input.target      e.g. 'instagram.post'
   * @param {string} input.scheduledAt ISO timestamp in the future
   * @param {object} input.payload     action-specific body (imageUrl, caption…)
   * @returns {object} the stored job descriptor
   */
  schedule({ target, scheduledAt, payload }) {
    if (!SUPPORTED_TARGETS.has(target)) {
      const err = new Error(
        `Unsupported schedule target "${target}". Supported: ${[...SUPPORTED_TARGETS].join(', ')}`
      );
      err.statusCode = 400;
      throw err;
    }

    const when = new Date(scheduledAt);
    if (Number.isNaN(when.getTime())) {
      const err = new Error('scheduledAt must be a valid ISO date/time string.');
      err.statusCode = 400;
      throw err;
    }
    if (when.getTime() <= Date.now()) {
      const err = new Error('scheduledAt must be in the future.');
      err.statusCode = 400;
      throw err;
    }

    const job = {
      id: randomUUID(),
      target,
      payload: payload ?? {},
      scheduledAt: when.toISOString(),
      status: 'queued',
      engineActive: this.engineActive,
      createdAt: new Date().toISOString(),
      note: this.engineActive
        ? 'Job queued and will be executed by the scheduler engine.'
        : 'Job stored but NOT yet executed — scheduler engine is not active. ' +
          'Wire up node-cron/BullMQ in SchedulerService to enable execution.',
    };

    this.jobs.set(job.id, job);
    logger.info(`Scheduled job created (${job.target})`, { id: job.id, scheduledAt: job.scheduledAt });
    return job;
  }

  list() {
    return [...this.jobs.values()].sort(
      (a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt)
    );
  }

  get(id) {
    return this.jobs.get(id) ?? null;
  }

  cancel(id) {
    return this.jobs.delete(id);
  }
}

const scheduler = new SchedulerService();
export default scheduler;
