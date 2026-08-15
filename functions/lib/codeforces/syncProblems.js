"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncProblemsLogic = exports.mapRatingToDifficulty = void 0;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const axios_1 = __importDefault(require("axios"));
const mapRatingToDifficulty = (rating) => {
    if (!rating)
        return 'Easy';
    if (rating <= 1000)
        return 'Easy';
    if (rating <= 1400)
        return 'Medium';
    if (rating <= 1900)
        return 'Hard';
    return 'Expert';
};
exports.mapRatingToDifficulty = mapRatingToDifficulty;
const syncProblemsLogic = async () => {
    const db = admin.firestore();
    const syncMetaRef = db.collection('syncMetadata').doc('codeforces');
    try {
        // 1. Fetch problemset from Codeforces
        const response = await axios_1.default.get('https://codeforces.com/api/problemset.problems', { timeout: 30000 });
        if (response.data.status !== 'OK') {
            throw new Error(`Codeforces API returned status: ${response.data.status}`);
        }
        const { problems, problemStatistics } = response.data.result;
        if (!Array.isArray(problems) || !Array.isArray(problemStatistics)) {
            throw new Error('Codeforces API response missing problems or statistics array');
        }
        // 2. Map statistics (solvedCount) for fast lookup by contestId_index
        const statsMap = new Map();
        for (const stat of problemStatistics) {
            if (stat.contestId !== undefined && stat.index !== undefined) {
                statsMap.set(`${stat.contestId}_${stat.index}`, stat.solvedCount || 0);
            }
        }
        // 3. Batch write to Firestore
        let totalSynced = 0;
        let batch = db.batch();
        let operationCount = 0;
        for (const problem of problems) {
            if (problem.contestId === undefined || problem.index === undefined)
                continue;
            if (problem.type !== 'PROGRAMMING')
                continue;
            const problemId = `codeforces_${problem.contestId}_${problem.index}`;
            const solvedCount = statsMap.get(`${problem.contestId}_${problem.index}`) || 0;
            const docRef = db.collection('problems').doc(problemId);
            batch.set(docRef, {
                source: 'codeforces',
                contestId: problem.contestId,
                problemIndex: problem.index,
                title: problem.name,
                rating: problem.rating || null,
                difficulty: (0, exports.mapRatingToDifficulty)(problem.rating),
                tags: Array.isArray(problem.tags) ? problem.tags : [],
                solvedCount: solvedCount,
                sourceUrl: `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`,
                isActive: true,
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
                createdAt: firestore_1.FieldValue.serverTimestamp(),
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
        // 4. Update sync metadata
        await syncMetaRef.set({
            lastSyncAt: firestore_1.FieldValue.serverTimestamp(),
            status: 'success',
            totalProblems: totalSynced,
            lastError: null
        }, { merge: true });
        return { success: true, totalSynced, error: null };
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('Error syncing Codeforces problems:', errorMsg);
        // Log failure in metadata
        await syncMetaRef.set({
            lastSyncAt: firestore_1.FieldValue.serverTimestamp(),
            status: 'failed',
            lastError: errorMsg
        }, { merge: true });
        return { success: false, totalSynced: 0, error: errorMsg };
    }
};
exports.syncProblemsLogic = syncProblemsLogic;
//# sourceMappingURL=syncProblems.js.map