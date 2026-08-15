import { collection, query, where, getDocs, doc, getDoc, limit, orderBy, startAfter, QueryConstraint } from 'firebase/firestore';
import { firestoreDb } from '../../../utils/firebase';
import { Problem } from '../types/problem';

export const getProblems = async (filters: {
  tag?: string;
  difficulty?: string;
  rating?: number;
  source?: string;
  pageSize?: number;
  lastDoc?: any;
}) => {
  if (!firestoreDb) return { problems: [], lastDoc: null };

  const constraints: QueryConstraint[] = [where('isActive', '==', true)];

  if (filters.difficulty && filters.difficulty !== 'All') {
    constraints.push(where('difficulty', '==', filters.difficulty));
  }
  if (filters.source && filters.source !== 'All') {
    constraints.push(where('source', '==', filters.source));
  }
  if (filters.rating) {
    constraints.push(where('rating', '==', filters.rating));
  }
  if (filters.tag && filters.tag !== 'All') {
    // Firestore array-contains query for tag filtering
    constraints.push(where('tags', 'array-contains', filters.tag.toLowerCase()));
  }

  // Standard ordering by rating, then contestId/problemIndex
  constraints.push(orderBy('rating', 'asc'));
  constraints.push(orderBy('contestId', 'asc'));

  const size = filters.pageSize || 20;
  constraints.push(limit(size));

  if (filters.lastDoc) {
    constraints.push(startAfter(filters.lastDoc));
  }

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

  return { problems, lastDoc: lastVisible };
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

export const getSyncMetadata = async () => {
  if (!firestoreDb) return null;
  const docRef = doc(firestoreDb, 'syncMetadata', 'codeforces');
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
};
