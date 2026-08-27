import { collection, query, where, getDocs, doc, getDoc, limit, startAfter, QueryConstraint } from 'firebase/firestore';
import { firestoreDb } from '../../../utils/firebase';
import { Problem, ProblemTestCase } from '../types/problem';

export const getProblems = async (filters: {
  tag?: string;
  topic?: string;
  difficulty?: string;
  rating?: number;
  source?: string;
  status?: string;
  company?: string;
  search?: string;
  pageSize?: number;
  lastDoc?: any;
  progressMap?: Record<string, { solved?: boolean; attempted?: boolean }>;
}) => {
  if (!firestoreDb) return { problems: [], lastDoc: null };

  const constraints: QueryConstraint[] = [];

  if (filters.difficulty && filters.difficulty !== 'All') {
    constraints.push(where('difficulty', '==', filters.difficulty));
  }
  if (filters.source && filters.source !== 'All') {
    constraints.push(where('source', '==', filters.source));
  }
  constraints.push(where('isActive', '==', true));
  if (filters.rating) {
    constraints.push(where('rating', '==', filters.rating));
  }
  if (filters.source === 'placementpro' && filters.topic && filters.topic !== 'All') {
    constraints.push(where('topics', 'array-contains', filters.topic));
  } else if (filters.tag && filters.tag !== 'All') {
    constraints.push(where('tags', 'array-contains', filters.tag.toLowerCase()));
  }
  if (filters.company && filters.company !== 'All') {
    constraints.push(where('companies', 'array-contains', filters.company));
  }

  const size = filters.pageSize || 20;
  constraints.push(limit(size));

  if (filters.lastDoc) {
    constraints.push(startAfter(filters.lastDoc));
  }

  try {
    const q = query(collection(firestoreDb, 'problems'), ...constraints);
    const snapshot = await getDocs(q);

    const problems: Problem[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      problems.push({
        id: docSnap.id,
        ...data,
      } as Problem);
    });

    const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

    return { problems: applyClientFilters(problems, filters), lastDoc: lastVisible };
  } catch (error: any) {
    // If index error, fall back to simpler query
    console.warn('Firestore query error (may need index):', error.message);
    
    // Fallback: just get problems without ordering
    const fallbackQ = query(collection(firestoreDb, 'problems'), limit(size));
    const snapshot = await getDocs(fallbackQ);

    const problems: Problem[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      problems.push({
        id: docSnap.id,
        ...data,
      } as Problem);
    });

    const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
    return { problems: applyClientFilters(problems, filters), lastDoc: lastVisible };
  }
};

const applyClientFilters = (
  problems: Problem[],
  filters: {
    search?: string;
    status?: string;
    progressMap?: Record<string, { solved?: boolean; attempted?: boolean }>;
  }
) => {
  const search = filters.search?.trim().toLowerCase();

  return problems.filter((problem) => {
    if (search && !problem.title.toLowerCase().includes(search) && !problem.id.toLowerCase().includes(search)) {
      return false;
    }

    if (!filters.status || filters.status === 'All') {
      return true;
    }

    const progress = filters.progressMap?.[problem.id];
    if (filters.status === 'Solved') return Boolean(progress?.solved);
    if (filters.status === 'Attempted') return Boolean(progress?.attempted && !progress?.solved);
    if (filters.status === 'Unattempted') return !progress?.attempted && !progress?.solved;
    return true;
  });
};

export const getProblemById = async (problemId: string): Promise<Problem | null> => {
  if (!firestoreDb) return null;
  const docRef = doc(firestoreDb, 'problems', problemId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Problem;
  }
  return null;
};

export const getSyncMetadata = async (provider = 'codeforces') => {
  if (!firestoreDb) return null;
  const docRef = doc(firestoreDb, 'syncMetadata', provider);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
};

export const getVisibleTestCases = async (problemId: string): Promise<ProblemTestCase[]> => {
  if (!firestoreDb) return [];
  const docRef = doc(firestoreDb, 'testCases', problemId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return [];

  const data = docSnap.data();
  return Array.isArray(data.visible) ? data.visible : [];
};
