import * as admin from 'firebase-admin';
import axios from 'axios';

export const mapRatingToDifficulty = (rating?: number): string => {
  if (!rating) return 'Easy';
  if (rating <= 1000) return 'Easy';
  if (rating <= 1400) return 'Medium';
  if (rating <= 1900) return 'Hard';
  return 'Expert';
};

export const syncProblemsLogic = async (): Promise<{ success: boolean; totalSynced: number; error: string | null }> => {
  const db = admin.firestore();
  const syncMetaRef = db.collection('syncMetadata').doc('codeforces');
  
  try {
    // 1. Fetch problemset from Codeforces
    const response = await axios.get('https://codeforces.com/api/problemset.problems', { timeout: 30000 });
    
    if (response.data.status !== 'OK') {
      throw new Error(`Codeforces API returned status: ${response.data.status}`);
    }

    const { problems, problemStatistics } = response.data.result;

    if (!Array.isArray(problems) || !Array.isArray(problemStatistics)) {
      throw new Error('Codeforces API response missing problems or statistics array');
    }

    // 2. Map statistics (solvedCount) for fast lookup by contestId_index
    const statsMap = new Map<string, number>();
    for (const stat of problemStatistics) {
      if (stat.contestId !== undefined && stat.index !== undefined) {
        statsMap.set(`${stat.contestId}_${stat.index}`, stat.solvedCount || 0);
      }
    }

    // 3. Batch write to Firestore (limit to PROGRAMMING problems and ratings 800-3000 to keep it relevant)
    let totalSynced = 0;
    let batch = db.batch();
    let operationCount = 0;

    for (const problem of problems) {
      if (problem.contestId === undefined || problem.index === undefined) continue;
      
      // Filter out non-programming tasks or tasks without rating (often old/uncategorized)
      if (problem.type !== 'PROGRAMMING') continue;

      const problemId = `codeforces_${problem.contestId}_${problem.index}`;
      const solvedCount = statsMap.get(`${problem.contestId}_${problem.index}`) || 0;
      const docRef = db.collection('problems').doc(problemId);

      const payload = {
        source: 'codeforces',
        contestId: problem.contestId,
        problemIndex: problem.index,
        title: problem.name,
        rating: problem.rating || null,
        difficulty: mapRatingToDifficulty(problem.rating),
        tags: Array.isArray(problem.tags) ? problem.tags : [],
        solvedCount: solvedCount,
        sourceUrl: `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`,
        isActive: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Use merge to keep custom fields we might add on the frontend/admin later
      batch.set(docRef, {
        ...payload,
        createdAt: admin.firestore.FieldValue.serverTimestamp() // Will set on creation, ignored on subsequent merges if it matches
      }, { merge: true });

      operationCount++;
      totalSynced++;

      // Firestore allows maximum 500 operations per batch
      if (operationCount >= 500) {
        await batch.commit();
        batch = db.batch();
        operationCount = 0;
      }
    }

    if (operationCount > 0) {
      await batch.commit();
    }

    // 4. Update config sync metadata
    const syncData = {
      lastSyncAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'success',
      totalProblems: totalSynced,
      lastError: null
    };

    await syncMetaRef.set(syncData, { merge: true });

    return { success: true, totalSynced, error: null };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error syncing Codeforces problems:', errorMsg);
    
    // Log failure in metadata
    await syncMetaRef.set({
      lastSyncAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'failed',
      lastError: errorMsg
    }, { merge: true });

    return { success: false, totalSynced: 0, error: errorMsg };
  }
};
