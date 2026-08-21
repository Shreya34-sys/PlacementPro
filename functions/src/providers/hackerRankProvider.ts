import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import axios from 'axios';

type Difficulty = 'Easy' | 'Medium' | 'Hard';

interface HackerRankQuestion {
  id?: string;
  unique_id?: string;
  name?: string;
  type?: string;
  status?: string;
  problem_statement?: string;
  recommended_duration?: number;
  max_score?: number;
  tags?: string[];
  skills?: string[];
  languages?: string[];
  created_at?: string;
}

const DSA_TOPICS = [
  'Arrays', 'Strings', 'Linked List', 'Stack', 'Queue', 'Hashing',
  'Recursion', 'Backtracking', 'Sorting', 'Searching', 'Binary Tree',
  'BST', 'Heap', 'Priority Queue', 'Graph', 'Greedy', 'Dynamic Programming',
  'Bit Manipulation', 'Two Pointer', 'Sliding Window', 'Prefix Sum',
];

const TOPIC_ALIASES: Record<string, string[]> = {
  Arrays: ['array', 'arrays'],
  Strings: ['string', 'strings'],
  'Linked List': ['linked list', 'linked-list', 'linkedlist'],
  Stack: ['stack'],
  Queue: ['queue'],
  Hashing: ['hash', 'hashing', 'hashmap', 'hash map', 'dictionary'],
  Recursion: ['recursion', 'recursive'],
  Backtracking: ['backtracking', 'backtrack'],
  Sorting: ['sorting', 'sort'],
  Searching: ['searching', 'search'],
  'Binary Tree': ['binary tree', 'tree'],
  BST: ['bst', 'binary search tree'],
  Heap: ['heap'],
  'Priority Queue': ['priority queue', 'priorityqueue'],
  Graph: ['graph', 'graphs'],
  Greedy: ['greedy'],
  'Dynamic Programming': ['dynamic programming', 'dp'],
  'Bit Manipulation': ['bit manipulation', 'bitwise', 'bits'],
  'Two Pointer': ['two pointer', 'two pointers', 'two-pointer'],
  'Sliding Window': ['sliding window'],
  'Prefix Sum': ['prefix sum', 'prefix sums'],
};

const QUESTION_BANK_API_URL = process.env.QUESTION_BANK_API_URL || 'https://www.hackerrank.com/x/api/v3';
const QUESTION_BANK_API_KEY = process.env.QUESTION_BANK_API_KEY;

export const syncQuestionBankQuestionsLogic = async (): Promise<{
  success: boolean;
  totalSynced: number;
  error: string | null;
}> => {
  const db = admin.firestore();
  const syncMetaRef = db.collection('syncMetadata').doc('placementproQuestionBank');

  if (!QUESTION_BANK_API_KEY) {
    const message = 'The server-side question bank credential is not configured.';
    await syncMetaRef.set({
      lastSyncAt: FieldValue.serverTimestamp(),
      status: 'failed',
      totalProblems: 0,
      lastError: message,
    }, { merge: true });
    return { success: false, totalSynced: 0, error: message };
  }

  try {
    const questions = await fetchAllQuestions();
    const codingQuestions = questions.filter((question) => {
      const type = question.type?.toLowerCase();
      const status = question.status?.toLowerCase();
      return type === 'code' && status !== 'archived';
    });

    let totalSynced = 0;
    let batch = db.batch();
    let operationCount = 0;

    for (const question of codingQuestions) {
      const externalId = question.id || question.unique_id;
      if (!externalId || !question.name) continue;

      const topics = inferDsaTopics(question);
      if (topics.length === 0) continue;

      const problemId = `placementpro_bank_${externalId}`;
      const docRef = db.collection('problems').doc(problemId);

      batch.set(docRef, {
        source: 'placementpro',
        provider: 'authorized-external',
        externalId,
        title: question.name,
        slug: slugify(question.name),
        description: stripHtml(question.problem_statement || ''),
        difficulty: inferDifficulty(question),
        topics,
        tags: normalizeTags([...(question.tags || []), ...(question.skills || [])]),
        solvedCount: 0,
        sourceUrl: null,
        isActive: true,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        recommendedDurationMinutes: question.recommended_duration || null,
        maxScore: question.max_score || null,
        languages: Array.isArray(question.languages) ? question.languages : [],
      }, { merge: true });

      operationCount++;
      totalSynced++;

      if (operationCount >= 450) {
        await batch.commit();
        batch = db.batch();
        operationCount = 0;
      }
    }

    if (operationCount > 0) {
      await batch.commit();
    }

    await syncMetaRef.set({
      lastSyncAt: FieldValue.serverTimestamp(),
      status: 'success',
      totalProblems: totalSynced,
      fetchedQuestions: questions.length,
      lastError: null,
    }, { merge: true });

    return { success: true, totalSynced, error: null };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await syncMetaRef.set({
      lastSyncAt: FieldValue.serverTimestamp(),
      status: 'failed',
      lastError: errorMsg,
    }, { merge: true });
    return { success: false, totalSynced: 0, error: errorMsg };
  }
};

const fetchAllQuestions = async (): Promise<HackerRankQuestion[]> => {
  const limit = Number(process.env.QUESTION_BANK_SYNC_LIMIT || 100);
  const maxPages = Number(process.env.QUESTION_BANK_SYNC_MAX_PAGES || 10);
  const questions: HackerRankQuestion[] = [];

  for (let page = 0; page < maxPages; page++) {
    const offset = page * limit;
    const data = await fetchQuestionsPage(limit, offset);
    const pageQuestions = Array.isArray(data.data) ? data.data : [];
    questions.push(...pageQuestions);

    const hasNext = Boolean(data.next);
    if (!hasNext || pageQuestions.length < limit) break;
  }

  return questions;
};

const fetchQuestionsPage = async (limit: number, offset: number) => {
  const params = {
    limit,
    offset,
    type: 'code',
    status: 'active',
  };

  const response = await axios.get(`${QUESTION_BANK_API_URL}/questions`, {
    params,
    headers: buildHeaders(),
    timeout: 30000,
  });
  return response.data;
};

const buildHeaders = () => ({
  Authorization: `Bearer ${QUESTION_BANK_API_KEY}`,
  Accept: 'application/json',
});

const inferDsaTopics = (question: HackerRankQuestion) => {
  const searchable = [
    question.name,
    question.problem_statement,
    ...(question.tags || []),
    ...(question.skills || []),
  ].join(' ').toLowerCase();

  const topics = DSA_TOPICS.filter((topic) => (
    TOPIC_ALIASES[topic]?.some((alias) => searchable.includes(alias))
  ));

  return topics;
};

const inferDifficulty = (question: HackerRankQuestion): Difficulty => {
  const text = [...(question.tags || []), ...(question.skills || [])].join(' ').toLowerCase();
  if (text.includes('hard') || (question.max_score || 0) >= 80) return 'Hard';
  if (text.includes('medium') || (question.max_score || 0) >= 40) return 'Medium';
  return 'Easy';
};

const normalizeTags = (tags: string[]) => (
  Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)))
);

const stripHtml = (html: string) => (
  html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
);

const slugify = (value: string) => (
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
);
