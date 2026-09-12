// controllers/studentController.js
const Student = require('../models/studentModel');

// Fetch profile data for logged-in user
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id; // Extracted from JWT middleware
        const student = await Student.getByUserId(userId);

        if (!student) {
            return res.status(404).json({ message: 'User profile not found.' });
        }

        res.json({ success: true, data: student });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Failed to fetch student profile.' });
    }
};

// Update profile parameters
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { fullName, department, division, batchYear, cgpa, phoneNumber } = req.body;

        if (!fullName || !department || !division || !batchYear || !cgpa || !phoneNumber) {
            return res.status(400).json({ message: 'All profile fields are required.' });
        }

        await Student.upsertProfile(userId, {
            fullName,
            department,
            division,
            batchYear: parseInt(batchYear),
            cgpa: parseFloat(cgpa),
            phoneNumber
        });

        res.json({ success: true, message: 'Profile updated successfully.' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Failed to update profile.' });
    }
};

// Handle PDF Resume Upload
exports.uploadResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a PDF file.' });
        }

        // Access uploaded file path: req.file.path
        res.json({
            success: true,
            message: 'Resume uploaded successfully.',
            filePath: `/uploads/resumes/${req.file.filename}`
        });
    } catch (error) {
        console.error('Error uploading resume:', error);
        res.status(500).json({ message: 'Failed to upload resume.' });
    }
};