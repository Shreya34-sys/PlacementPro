import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import { syncProblemsLogic } from './codeforces/syncProblems';
import { syncQuestionBankQuestionsLogic } from './providers/hackerRankProvider';
import { getJudgeLanguagesLogic, runCodeLogic, submitSolutionLogic } from './submissions/execute';

admin.initializeApp();

const questionBankApiKey = defineSecret('QUESTION_BANK_API_KEY');

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

export const manualPlacementProQuestionBankSync = onRequest(
  { cors: true, timeoutSeconds: 300, memory: '512MiB', secrets: [questionBankApiKey] },
  async (req, res) => {
    try {
      const result = await syncQuestionBankQuestionsLogic();
      if (result.success) {
        res.status(200).json({
          message: 'PlacementPro question bank refreshed successfully!',
          totalSynced: result.totalSynced,
        });
      } else {
        console.error('PlacementPro question bank refresh failed:', result.error);
        const isConfigurationError = result.error === 'The server-side question bank credential is not configured.';
        res.status(isConfigurationError ? 503 : 500).json({
          code: isConfigurationError ? 'QUESTION_BANK_NOT_CONFIGURED' : 'QUESTION_BANK_REFRESH_FAILED',
          message: isConfigurationError
            ? 'The PlacementPro question bank is not configured for this environment.'
            : 'Failed to refresh the PlacementPro question bank',
        });
      }
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      console.error('PlacementPro question bank refresh failed:', err);
      res.status(500).json({
        message: 'Failed to refresh the PlacementPro question bank',
      });
    }
  }
);

export const submitSolution = onRequest(
  { cors: true, timeoutSeconds: 60, memory: '256MiB' },
  async (req, res) => {
    await submitSolutionLogic(req, res);
  }
);

export const runCode = onRequest(
  { cors: true, timeoutSeconds: 60, memory: '256MiB' },
  async (req, res) => {
    await runCodeLogic(req, res);
  }
);

export const getJudgeLanguages = onRequest(
  { cors: true, timeoutSeconds: 30, memory: '256MiB' },
  async (req, res) => {
    await getJudgeLanguagesLogic(req, res);
  }
);
