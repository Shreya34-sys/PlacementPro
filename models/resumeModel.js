
const db = require('../config/db');

class ResumeModel {
    static async createAnalysis(data) {
        const query = `
            INSERT INTO resume_analyses 
            (resumeid, std_id, file_name, ats_score, skills_match, keyword_match, formatting_status, analysis_json, rewritten_resume)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        // Ensure analysis_json is properly converted to a JSON string once for MySQL
        const jsonValue = typeof data.analysis_json === 'string' 
            ? data.analysis_json 
            : JSON.stringify(data.analysis_json);

        const values = [
            data.resumeid,
            data.std_id,
            data.file_name,
            data.ats_score,
            data.skills_match,
            data.keyword_match,
            data.formatting_status,
            jsonValue,
            data.rewritten_resume || null
        ];
        
        await db.execute(query, values);
        return data.resumeid;
    }

    static async getAnalysisById(resumeid, std_id) {
        const query = `SELECT * FROM resume_analyses WHERE resumeid = ? AND std_id = ?`;
        const [rows] = await db.execute(query, [resumeid, std_id]);
        return rows[0];
    }
}

module.exports = ResumeModel;