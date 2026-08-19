import { collection, doc, getDocs, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { firestoreDb } from '../../../utils/firebase';
import { UserProgress } from '../types/problem';

export const getUserProgress = async (userId: string): Promise<Record<string, UserProgress>> => {
  if (!firestoreDb) return {};
  const progressCol = collection(firestoreDb, `userProgress/${userId}/problems`);
  const snapshot = await getDocs(progressCol);
  
  const progressMap: Record<string, UserProgress> = {};
  snapshot.forEach((docSnap) => {
    progressMap[docSnap.id] = docSnap.data() as UserProgress;
  });
  return progressMap;
};

export const getBookmarks = async (userId: string): Promise<string[]> => {
  if (!firestoreDb) return [];
  const bookmarksCol = collection(firestoreDb, `users/${userId}/bookmarks`);
  const snapshot = await getDocs(bookmarksCol);
  
  const bookmarks: string[] = [];
  snapshot.forEach((docSnap) => {
    bookmarks.push(docSnap.id);
  });
  return bookmarks;
};

export const toggleBookmark = async (userId: string, problemId: string, isBookmarked: boolean) => {
  if (!firestoreDb) return;
  const docRef = doc(firestoreDb, `users/${userId}/bookmarks`, problemId);
  if (isBookmarked) {
    await deleteDoc(docRef);
  } else {
    await setDoc(docRef, {
      problemId,
      createdAt: new Date().toISOString()
    });
  }
};
