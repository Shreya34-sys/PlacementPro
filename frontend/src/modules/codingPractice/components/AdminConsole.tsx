import React, { useState, useEffect } from 'react';
import { Card, Button, Spinner, Alert, Table, ProgressBar } from 'react-bootstrap';
import {
  doc,
  writeBatch,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { firestoreDb } from '../../../utils/firebase';
import { getSyncMetadata } from '../services/problemService';

const getFunctionsUrl = () => {
  const projectId = (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined) || 'placementpro-22829';
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return `http://127.0.0.1:5001/${projectId}/us-central1`;
  }
  return `https://us-central1-${projectId}.cloudfunctions.net`;
};

const PLACEMENTPRO_SEED_PROBLEMS = [
  {
    id: 'pp-two-sum',
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'Easy',
    topics: ['Arrays', 'Hashing'],
    tags: ['arrays', 'hashing'],
    description: 'Given an array of integers and a target value, print the indices of the two numbers that add up to the target.',
    inputFormat: 'First line contains n.\nSecond line contains n integers.\nThird line contains target.',
    outputFormat: 'Print two zero-based indices separated by a space.',
    constraints: '2 <= n <= 100000\n-10^9 <= nums[i] <= 10^9',
    examples: [{ input: '4\n2 7 11 15\n9', output: '0 1', explanation: 'nums[0] + nums[1] = 9.' }],
    companies: ['Amazon', 'Google', 'Microsoft'],
    visible: [{ input: '4\n2 7 11 15\n9', expectedOutput: '0 1' }],
    hidden: [{ input: '3\n3 2 4\n6', expectedOutput: '1 2' }],
  },
  {
    id: 'pp-reverse-array',
    title: 'Reverse Array',
    slug: 'reverse-array',
    difficulty: 'Easy',
    topics: ['Arrays', 'Two Pointer'],
    tags: ['arrays', 'two-pointer'],
    description: 'Given an array, print the elements in reverse order.',
    inputFormat: 'First line contains n.\nSecond line contains n integers.',
    outputFormat: 'Print the reversed array.',
    constraints: '1 <= n <= 100000',
    examples: [{ input: '5\n1 2 3 4 5', output: '5 4 3 2 1' }],
    companies: ['TCS', 'Infosys', 'Accenture'],
    visible: [{ input: '5\n1 2 3 4 5', expectedOutput: '5 4 3 2 1' }],
    hidden: [{ input: '3\n10 20 30', expectedOutput: '30 20 10' }],
  },
  {
    id: 'pp-longest-substring',
    title: 'Longest Substring Without Repeating Characters',
    slug: 'longest-substring-without-repeating-characters',
    difficulty: 'Medium',
    topics: ['Strings', 'Sliding Window', 'Hashing'],
    tags: ['strings', 'sliding-window', 'hashing'],
    description: 'Given a string, print the length of the longest substring without repeating characters.',
    inputFormat: 'A single string s.',
    outputFormat: 'Print one integer.',
    constraints: '0 <= s.length <= 50000',
    examples: [{ input: 'abcabcbb', output: '3', explanation: 'The answer is abc.' }],
    companies: ['Amazon', 'Microsoft'],
    visible: [{ input: 'abcabcbb', expectedOutput: '3' }],
    hidden: [{ input: 'bbbbb', expectedOutput: '1' }],
  },
  {
    id: 'pp-merge-intervals',
    title: 'Merge Intervals',
    slug: 'merge-intervals',
    difficulty: 'Medium',
    topics: ['Arrays', 'Sorting'],
    tags: ['arrays', 'sorting'],
    description: 'Given intervals, merge all overlapping intervals and print the merged list.',
    inputFormat: 'First line contains n.\nNext n lines contain start and end.',
    outputFormat: 'Print each merged interval on a new line.',
    constraints: '1 <= n <= 100000',
    examples: [{ input: '4\n1 3\n2 6\n8 10\n15 18', output: '1 6\n8 10\n15 18' }],
    companies: ['Google', 'Wipro', 'Capgemini'],
    visible: [{ input: '4\n1 3\n2 6\n8 10\n15 18', expectedOutput: '1 6\n8 10\n15 18' }],
    hidden: [{ input: '2\n1 4\n4 5', expectedOutput: '1 5' }],
  },
  {
    id: 'pp-word-search',
    title: 'Word Search',
    slug: 'word-search',
    difficulty: 'Hard',
    topics: ['Backtracking', 'Graph'],
    tags: ['backtracking', 'graph'],
    description: 'Given a grid of characters and a word, print YES if the word exists by moving horizontally or vertically without reusing a cell.',
    inputFormat: 'First line contains rows and columns.\nNext rows lines contain the grid.\nLast line contains the target word.',
    outputFormat: 'Print YES or NO.',
    constraints: '1 <= rows, columns <= 12',
    examples: [{ input: '3 4\nABCE\nSFCS\nADEE\nABCCED', output: 'YES' }],
    companies: ['Amazon', 'Microsoft'],
    visible: [{ input: '3 4\nABCE\nSFCS\nADEE\nABCCED', expectedOutput: 'YES' }],
    hidden: [{ input: '3 4\nABCE\nSFCS\nADEE\nABCB', expectedOutput: 'NO' }],
  },
];

export const AdminConsole: React.FC = () => {
  const [meta, setMeta] = useState<any>(null);
  const [questionBankMeta, setQuestionBankMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncingQuestionBank, setSyncingQuestionBank] = useState(false);
  const [seedingPlacementPro, setSeedingPlacementPro] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchMeta = async () => {
    setLoading(true);
    try {
      const [codeforcesData, questionBankData] = await Promise.all([
        getSyncMetadata('codeforces'),
        getSyncMetadata('placementproQuestionBank'),
      ]);
      setMeta(codeforcesData);
      setQuestionBankMeta(questionBankData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePlacementProBankSync = async () => {
    setSyncingQuestionBank(true);
    setSyncResult(null);

    try {
      const response = await fetch(`${getFunctionsUrl()}/manualPlacementProQuestionBankSync`, {
        method: 'POST',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Question bank refresh failed.');
      }

      setSyncResult({
        success: true,
        message: `✓ Refreshed ${Number(data.totalSynced || 0).toLocaleString()} PlacementPro DSA questions.`,
      });
      fetchMeta();
    } catch (e) {
      setSyncResult({
        success: false,
        message: e instanceof Error ? e.message : 'PlacementPro question bank refresh failed.',
      });
    } finally {
      setSyncingQuestionBank(false);
    }
  };

  const handleSeedPlacementProProblems = async () => {
    if (!firestoreDb) {
      setSyncResult({ success: false, message: 'Firestore not configured. Check your .env.local file.' });
      return;
    }

    setSeedingPlacementPro(true);
    setSyncResult(null);

    try {
      const batch = writeBatch(firestoreDb);

      PLACEMENTPRO_SEED_PROBLEMS.forEach((problem) => {
        const { visible, hidden, ...problemData } = problem;
        batch.set(doc(firestoreDb, 'problems', problem.id), {
          ...problemData,
          source: 'placementpro',
          provider: 'placementpro',
          externalId: null,
          solvedCount: 0,
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });

        batch.set(doc(firestoreDb, 'testCases', problem.id), {
          visible,
          hidden,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      });

      await batch.commit();
      setSyncResult({ success: true, message: `✓ Seeded ${PLACEMENTPRO_SEED_PROBLEMS.length} PlacementPro DSA problems with visible and hidden tests.` });
    } catch (e) {
      setSyncResult({ success: false, message: e instanceof Error ? e.message : 'PlacementPro seed failed.' });
    } finally {
      setSeedingPlacementPro(false);
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  const handleSyncNow = async () => {
    if (!firestoreDb) {
      setSyncResult({ success: false, message: 'Firestore not configured. Check your .env.local file.' });
      return;
    }

    setSyncing(true);
    setSyncResult(null);
    setSyncProgress(0);

    try {
      setSyncProgress(5);
      const response = await fetch(`${getFunctionsUrl()}/manualCodeforcesSync`, {
        method: 'POST',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || `Codeforces sync failed (${response.status}).`);
      }

      setSyncProgress(100);
      setSyncResult({
        success: true,
        message: `✓ Synced ${Number(data.totalSynced || 0).toLocaleString()} problems from Codeforces to Firestore!`
      });
      fetchMeta();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Sync failed. Please try again.';
      console.error(e);
      setSyncResult({ success: false, message: msg });

      // Log failure to metadata
      if (firestoreDb) {
        try {
          await setDoc(doc(firestoreDb, 'syncMetadata', 'codeforces'), {
            lastSyncAt: serverTimestamp(),
            status: 'failed',
            lastError: msg,
          }, { merge: true });
        } catch (_) {}
      }
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
      <Card.Header className="bg-white py-3 border-bottom">
        <h5 className="fw-bold mb-0 text-dark">
          <i className="bi bi-shield-lock text-primary me-2"></i> Coding Practice Admin Console
        </h5>
      </Card.Header>

      <Card.Body className="p-4">
        <div className="mb-4">
          <h6 className="fw-bold text-dark fs-7 mb-2">Codeforces Problemset Synchronization</h6>
          <p className="text-secondary fs-8 leading-relaxed mb-0">
            Fetches the full Codeforces problem catalog directly from their public API and stores it in Firestore. 
            No API key required. Repeated syncs are <strong>idempotent</strong> — existing documents are updated, not duplicated.
          </p>
        </div>

        <div className="bg-primary-subtle border border-primary-subtle rounded-3 p-3 mb-4">
          <h6 className="fw-bold text-dark fs-7 mb-2">PlacementPro Native DSA Bank</h6>
          <p className="text-secondary fs-8 mb-3">
            Creates the first PlacementPro-owned problems and stores visible/hidden test cases in Firestore. Hidden tests stay out of the browser and are only used by the backend submit function.
          </p>
          <Button
            variant="primary"
            size="sm"
            className="fw-bold"
            onClick={handleSeedPlacementProProblems}
            disabled={seedingPlacementPro}
          >
            {seedingPlacementPro ? (
              <>
                <Spinner size="sm" animation="border" className="me-2" /> Seeding...
              </>
            ) : (
              <>
                <i className="bi bi-database-add me-2"></i> Seed PlacementPro DSA Problems
              </>
            )}
          </Button>
        </div>

        <div className="bg-light border rounded-3 p-3 mb-4">
          <h6 className="fw-bold text-dark fs-7 mb-2">PlacementPro Question Bank Refresh</h6>
          <p className="text-secondary fs-8 mb-3">
            Connects to the configured backend question provider and refreshes the PlacementPro DSA catalog. Imported questions appear under the PlacementPro source.
          </p>
          <div className="d-flex flex-wrap align-items-center gap-2">
            <Button
              variant="outline-primary"
              size="sm"
              className="fw-bold"
              onClick={handlePlacementProBankSync}
              disabled={syncingQuestionBank}
            >
              {syncingQuestionBank ? (
                <>
                  <Spinner size="sm" animation="border" className="me-2" /> Refreshing...
                </>
              ) : (
                <>
                  <i className="bi bi-cloud-download me-2"></i> Refresh PlacementPro Questions
                </>
              )}
            </Button>
            <span className="text-muted fs-8">
              Last refreshed: {questionBankMeta?.lastSyncAt
              ? (() => {
                  const ts = questionBankMeta.lastSyncAt;
                  const date = ts?.seconds
                    ? new Date(ts.seconds * 1000)
                    : ts?.toDate?.()
                    ? ts.toDate()
                    : new Date(ts);
                  return date.toLocaleString();
                })()
              : 'Never'}
              {questionBankMeta?.totalProblems !== undefined ? ` · ${questionBankMeta.totalProblems.toLocaleString()} questions` : ''}
            </span>
          </div>
        </div>

        {syncResult && (
          <Alert variant={syncResult.success ? 'success' : 'danger'} className="py-2.5 mb-4 fs-8 fw-semibold">
            {syncResult.message}
          </Alert>
        )}

        {syncing && (
          <div className="mb-4">
            <div className="d-flex justify-content-between fs-8 text-secondary mb-1">
              <span>Syncing problems from Codeforces...</span>
              <span>{syncProgress}%</span>
            </div>
            <ProgressBar now={syncProgress} variant="primary" animated striped style={{ height: '8px', borderRadius: '4px' }} />
          </div>
        )}

        {/* Sync Status Card */}
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" size="sm" className="mb-2" />
            <div className="text-muted fs-8">Fetching synchronization status...</div>
          </div>
        ) : (
          <div className="bg-light p-3 rounded-3 border mb-4">
            <Table borderless size="sm" className="mb-0 fs-8 text-secondary">
              <tbody>
                <tr>
                  <td className="fw-semibold text-dark" style={{ width: '200px' }}>Last Synchronization:</td>
                  <td>
                    {meta?.lastSyncAt
                      ? (() => {
                          const ts = meta.lastSyncAt;
                          const date = ts?.seconds
                            ? new Date(ts.seconds * 1000)
                            : ts?.toDate?.()
                            ? ts.toDate()
                            : new Date(ts);
                          return date.toLocaleString();
                        })()
                      : <span className="text-muted fst-italic">Never synced yet</span>}
                  </td>
                </tr>
                <tr>
                  <td className="fw-semibold text-dark">Status:</td>
                  <td>
                    <span className={`badge bg-${meta?.status === 'success' ? 'success' : meta ? 'danger' : 'secondary'} fs-9`}>
                      {meta?.status || 'Not Started'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="fw-semibold text-dark">Total Problems Synced:</td>
                  <td className="fw-bold text-dark">{meta?.totalProblems?.toLocaleString() || '0'}</td>
                </tr>
                {meta?.lastError && (
                  <tr>
                    <td className="fw-semibold text-danger">Last Error:</td>
                    <td className="text-danger font-monospace fs-9">{meta.lastError}</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        )}

        <Button
          variant="primary"
          className="fw-bold py-2 px-4 shadow-xs"
          onClick={handleSyncNow}
          disabled={syncing}
        >
          {syncing ? (
            <>
              <Spinner size="sm" animation="border" className="me-2" /> Syncing from Codeforces...
            </>
          ) : (
            <>
              <i className="bi bi-arrow-repeat me-2"></i>
              {meta?.totalProblems ? 'Re-Sync Now' : 'Start Initial Sync'}
            </>
          )}
        </Button>

        <div className="mt-3 fs-9 text-muted">
          <i className="bi bi-info-circle me-1"></i>
          This runs directly in the browser — no server or emulator required. First sync may take 1–2 minutes.
        </div>
      </Card.Body>
    </Card>
  );
};
