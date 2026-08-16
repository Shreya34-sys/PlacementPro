import { collection, query, where, orderBy, onSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestoreDb } from '../utils/firebase';
import { UserProfile } from '../types';
import { useState, useEffect } from 'react';

/**
 * Calculates total points based on coding, aptitude, and interview scores.
 * Formula: Coding XP + (Aptitude Score * 10) + (Interview Score * 10)
 */
export const calculateTotalPoints = (
  codingXp: number = 0,
  aptitudeScore: number = 0,
  interviewScore: number = 0
): number => {
  return codingXp + (aptitudeScore * 10) + (interviewScore * 10);
};

/**
 * Updates a user's leaderboard statistics in Firestore.
 */
export const updateUserLeaderboardStats = async (
  userId: string,
  updates: {
    codingXp?: number;
    problemsSolved?: number;
    aptitudeScore?: number;
    interviewScore?: number;
  }
) => {
  if (!firestoreDb) return;

  const userRef = doc(firestoreDb, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    console.error(`User ${userId} not found in Firestore.`);
    return;
  }

  const userData = userSnap.data() as UserProfile;

  const newCodingXp = updates.codingXp ?? userData.codingXp ?? 0;
  const newProblemsSolved = updates.problemsSolved ?? userData.problemsSolved ?? 0;
  const newAptitudeScore = updates.aptitudeScore ?? userData.aptitudeScore ?? 0;
  const newInterviewScore = updates.interviewScore ?? userData.interviewScore ?? 0;

  const newTotalPoints = calculateTotalPoints(newCodingXp, newAptitudeScore, newInterviewScore);

  await updateDoc(userRef, {
    codingXp: newCodingXp,
    problemsSolved: newProblemsSolved,
    aptitudeScore: newAptitudeScore,
    interviewScore: newInterviewScore,
    totalPoints: newTotalPoints,
  });
};

export interface LeaderboardEntry extends UserProfile {
  rank: number;
}

/**
 * React hook to listen to the leaderboard in real-time.
 */
export const useLeaderboard = (departmentFilter: string = 'All') => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!firestoreDb) {
      setLoading(false);
      return;
    }

    setLoading(true);
    // Fetch all users without orderBy to ensure users missing the totalPoints field are still returned
    let q = query(
      collection(firestoreDb, 'users')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const entries: LeaderboardEntry[] = [];
        let currentRank = 1;

        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as UserProfile;
          // Include all students, even if their scores are 0
          if (data.role === 'student') {
            if (departmentFilter === 'All' || data.department === departmentFilter) {
              entries.push({
                ...data,
                id: docSnap.id,
                rank: currentRank,
              });
              currentRank++;
            }
          }
        });

        // Sort locally to handle users who might have undefined totalPoints
        entries.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));

        // Re-assign ranks after sorting
        entries.forEach((entry, index) => {
          entry.rank = index + 1;
        });

        setLeaderboard(entries);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching leaderboard:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [departmentFilter]);

  return { leaderboard, loading, error };
};
