import React, { useState, useEffect } from 'react';
import { Card, Button, Spinner, Alert, Table, ProgressBar } from 'react-bootstrap';
import {
  collection,
  doc,
  writeBatch,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { firestoreDb } from '../../../utils/firebase';
import { getSyncMetadata } from '../services/problemService';

const CF_API_URL = 'https://codeforces.com/api/problemset.problems';

const mapRatingToDifficulty = (rating?: number): string => {
  if (!rating) return 'Easy';
  if (rating <= 1000) return 'Easy';
  if (rating <= 1400) return 'Medium';
  if (rating <= 1900) return 'Hard';
  return 'Expert';
};

export const AdminConsole: React.FC = () => {
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchMeta = async () => {
    setLoading(true);
    try {
      const data = await getSyncMetadata();
      setMeta(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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
      // 1. Fetch from Codeforces API (public, no key needed)
      setSyncProgress(5);
      const response = await fetch(CF_API_URL);
      if (!response.ok) throw new Error(`Codeforces API error: ${response.status}`);
      const data = await response.json();

      if (data.status !== 'OK') throw new Error(`Codeforces returned: ${data.status}`);

      const { problems, problemStatistics } = data.result;
      setSyncProgress(20);

      // 2. Build stats lookup map
      const statsMap = new Map<string, number>();
      for (const stat of problemStatistics) {
        if (stat.contestId !== undefined && stat.index !== undefined) {
          statsMap.set(`${stat.contestId}_${stat.index}`, stat.solvedCount || 0);
        }
      }

      // 3. Filter only PROGRAMMING problems with a rating
      const validProblems = problems.filter(
        (p: any) => p.type === 'PROGRAMMING' && p.contestId !== undefined && p.index !== undefined
      );

      setSyncProgress(30);

      // 4. Batch write in chunks of 500
      const BATCH_SIZE = 500;
      let written = 0;

      for (let i = 0; i < validProblems.length; i += BATCH_SIZE) {
        const chunk = validProblems.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(firestoreDb);

        for (const problem of chunk) {
          const problemId = `codeforces_${problem.contestId}_${problem.index}`;
          const solvedCount = statsMap.get(`${problem.contestId}_${problem.index}`) || 0;
          const docRef = doc(firestoreDb, 'problems', problemId);

          batch.set(
            docRef,
            {
              source: 'codeforces',
              contestId: problem.contestId,
              problemIndex: problem.index,
              title: problem.name,
              rating: problem.rating || null,
              difficulty: mapRatingToDifficulty(problem.rating),
              tags: Array.isArray(problem.tags) ? problem.tags : [],
              solvedCount,
              sourceUrl: `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`,
              isActive: true,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }

        await batch.commit();
        written += chunk.length;

        const progress = 30 + Math.round((written / validProblems.length) * 65);
        setSyncProgress(progress);
      }

      // 5. Write sync metadata
      const metaRef = doc(firestoreDb, 'syncMetadata', 'codeforces');
      await setDoc(metaRef, {
        lastSyncAt: serverTimestamp(),
        status: 'success',
        totalProblems: written,
        lastError: null,
      }, { merge: true });

      setSyncProgress(100);
      setSyncResult({
        success: true,
        message: `✓ Synced ${written.toLocaleString()} problems from Codeforces to Firestore!`
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
                      ? new Date(meta.lastSyncAt.seconds * 1000).toLocaleString()
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
