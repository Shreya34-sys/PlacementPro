import { onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import { syncProblemsLogic } from './codeforces/syncProblems';
import { submitSolutionLogic } from './submissions/execute';

admin.initializeApp();

export const manualCodeforcesSync = onRequest(
  { cors: true, timeoutSeconds: 300, memory: '512MiB' },
  async (req, res) => {
    try {
      const result = await syncProblemsLogic();
      if (result.success) {
        res.status(200).json({
          message: 'Codeforces problems synchronized successfully!',
          totalSynced: result.totalSynced
        });
      } else {
        res.status(500).json({
          message: 'Failed to sync Codeforces problems',
          error: result.error
        });
      }
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      res.status(500).json({ error: err });
    }
  }
);

export const scheduledCodeforcesSync = onSchedule(
  {
    schedule: 'every 24 hours',
    timeZone: 'UTC',
    timeoutSeconds: 300,
    memory: '512MiB'
  },
  async (event) => {
    console.log('Running daily scheduled Codeforces problems sync...');
    const result = await syncProblemsLogic();
    console.log(`Sync status: ${result.success ? 'Success' : 'Failed'}. Total Synced: ${result.totalSynced}`);
  }
);

export const submitSolution = onRequest(
  { cors: true, timeoutSeconds: 60, memory: '256MiB' },
  async (req, res) => {
    await submitSolutionLogic(req, res);
  }
);
