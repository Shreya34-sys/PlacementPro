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
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitSolution = exports.scheduledCodeforcesSync = exports.manualCodeforcesSync = void 0;
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const admin = __importStar(require("firebase-admin"));
const syncProblems_1 = require("./codeforces/syncProblems");
const execute_1 = require("./submissions/execute");
admin.initializeApp();
exports.manualCodeforcesSync = (0, https_1.onRequest)({ cors: true, timeoutSeconds: 300, memory: '512MiB' }, async (req, res) => {
    try {
        const result = await (0, syncProblems_1.syncProblemsLogic)();
        if (result.success) {
            res.status(200).json({
                message: 'Codeforces problems synchronized successfully!',
                totalSynced: result.totalSynced
            });
        }
        else {
            res.status(500).json({
                message: 'Failed to sync Codeforces problems',
                error: result.error
            });
        }
    }
    catch (e) {
        const err = e instanceof Error ? e.message : String(e);
        res.status(500).json({ error: err });
    }
});
exports.scheduledCodeforcesSync = (0, scheduler_1.onSchedule)({
    schedule: 'every 24 hours',
    timeZone: 'UTC',
    timeoutSeconds: 300,
    memory: '512MiB'
}, async (event) => {
    console.log('Running daily scheduled Codeforces problems sync...');
    const result = await (0, syncProblems_1.syncProblemsLogic)();
    console.log(`Sync status: ${result.success ? 'Success' : 'Failed'}. Total Synced: ${result.totalSynced}`);
});
exports.submitSolution = (0, https_1.onRequest)({ cors: true, timeoutSeconds: 60, memory: '256MiB' }, async (req, res) => {
    await (0, execute_1.submitSolutionLogic)(req, res);
});
//# sourceMappingURL=index.js.map