// models/studentModel.js
const db = require('../config/db');

class Student {
    // Get student details by user_id
    static async getByUserId(userId) {
        const [rows] = await db.execute(
            `SELECT 
                u.id, 
                u.email, 
                u.role,
                COALESCE(s.full_name, u.fullName) AS full_name, 
                s.department, 
                s.division || null, 
                s.batch_year, 
                s.cgpa, 
                s.phone_number 
             FROM users u 
             LEFT JOIN students s ON u.id = s.std_id 
             WHERE u.id = ?`,
            [userId]
        );
        return rows[0] || null;
    }

    // Save or Update student profile specs
    static async upsertProfile(userId, { fullName, department, division, batchYear, cgpa, phoneNumber }) {
        // 1. Update camelCase 'fullName' column in users table
        await db.execute(
            'UPDATE users SET fullName = ? WHERE id = ?', 
            [fullName, userId]
        );

        // 2. Insert/Update snake_case 'full_name' column in students table
        const query = `
            INSERT INTO students (std_id, full_name, department, division, batch_year, cgpa, phone_number)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                full_name = VALUES(full_name),
                department = VALUES(department),
                division = VALUES(division),
                batch_year = VALUES(batch_year),
                cgpa = VALUES(cgpa),
                phone_number = VALUES(phone_number);
        `;

        await db.execute(query, [userId, fullName, department, division, batchYear, cgpa, phoneNumber]);
        return { success: true };
    }
}

module.exports = Student;