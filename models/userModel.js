const db = require('../config/db');
const crypto = require('crypto'); //Imports Node.js's built-in cryptography module.Used to generate unique Universally Unique Identifiers (UUIDs) for new user accounts without needing an external package.

class User {   //Organizes all database queries related to the users table into one neat, reusable template.
    static async findByEmail(email) {    //static: Allows you to call this method directly without creating an instance (e.g., User.findByEmail(...)).async: Enables waiting for MySQL to respond before moving forward.
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0] || null;  //rows[0] accesses the first (and only) matching object inside that array,if not found then return null
    }

    static async findById(id) {
        const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
        return rows[0] || null;
    }

    static async createStudent({ fullName, email, password }) {
        const userId = crypto.randomUUID();   //Generates a unique 36-character string ID (e.g., 123e4567-e89b-12d3-a456-426614174000).
        await db.execute(
            'INSERT INTO users (id, fullName, email, password, role) VALUES (?, ?, ?, ?, ?)',
            [userId, fullName, email, password, 'student']
        );
        await db.execute(
            'INSERT INTO students (std_id, full_name) VALUES (?, ?)',
            [userId, fullName]
        );
        return { id: userId, fullName, email, role: 'student' };
    }

    static async createGoogleUser({ fullName, email, googleId }) {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const userId = crypto.randomUUID();

        // 1. Create user in users table
        await connection.execute(
            `INSERT INTO users
            (id, fullName, email, googleId, role)
            VALUES (?, ?, ?, ?, ?)`,
            [userId, fullName, email, googleId, 'student']
        );

        // 2. Create corresponding student record
        await connection.execute(
            `INSERT INTO students
            (std_id, full_name)
            VALUES (?, ?)`,
            [userId, fullName]
        );

        await connection.commit();

        return {
            id: userId,
            fullName,
            email,
            role: 'student'
        };

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
}

    static async createAdmin({ fullName, email, password, designation, department }) {
        const userId = crypto.randomUUID();
        // Insert into base users table
        await db.execute(
            'INSERT INTO users (id, fullName, email, password, role) VALUES (?, ?, ?, ?, ?)',
            [userId, fullName, email, password, 'admin']
        );
        // Insert into admins detail table
        await db.execute(
            'INSERT INTO admins (adm_id, designation, department) VALUES (?, ?, ?)',
            [userId, designation || 'Placement Officer', department || 'Training & Placement']
        );
        return { id: userId, fullName, email, role: 'admin' };
    }


    static async ensureStudentRecord(user) {
    const [rows] = await db.execute(
        'SELECT std_id FROM students WHERE std_id = ?',
        [user.id]
    );

    if (rows.length === 0) {
        await db.execute(
            'INSERT INTO students (std_id, full_name) VALUES (?, ?)',
            [user.id, user.fullName]
        );
    }

    return user;
}


static async linkGoogleAccount(userId, googleId) {
    await db.execute(
        'UPDATE users SET googleId = ? WHERE id = ?',
        [googleId, userId]
    );
}

}

module.exports = User;




//SQL Injection is a major security vulnerability where an attacker types raw SQL commands into an input box to manipulate or steal your database.



// 3. Why is it written as id: userId inside return?
// This is standard JavaScript Object Property Assignment:

// JavaScript
// return { id: userId, fullName, email, role: 'student' };
// Earlier in that function, you created a random UUID and stored it in a variable named userId:

// JavaScript
// const userId = crypto.randomUUID(); // e.g. "a1b2c3d4..."
// When returning the newly created user object back to the controller:

// id: Is the Key (property name) that matches your MySQL database column name (id).

// userId Is the Value stored inside your local variable.

// Writing id: userId maps your local variable value (userId) to the property key (id) on the returned user object.

// (Note: fullName and email don't need colons like fullName: fullName because JavaScript ES6 allows shorthand syntax when the key name and variable name match identically).