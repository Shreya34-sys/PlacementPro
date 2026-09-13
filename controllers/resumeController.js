

const Groq = require('groq-sdk');
const { v4: uuidv4 } = require('uuid');
const PDFParser = require('pdf2json');
const mammoth = require('mammoth');
const ResumeModel = require('../models/resumemodel');

// Initialize Official Groq Client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

function extractPdfText(buffer) {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, true);
        pdfParser.on('pdfParser_dataError', errData => reject(errData.parserError));
        pdfParser.on('pdfParser_dataReady', () => {
            resolve(pdfParser.getRawTextContent());
        });
        pdfParser.parseBuffer(buffer);
    });
}

exports.analyzeResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No resume file uploaded' });
        }

        const studentId = req.user ? (req.user.id || req.user.std_id) : req.body.std_id;
        if (!studentId) {
            return res.status(401).json({ success: false, message: 'Unauthorized student access' });
        }

        let extractedText = '';
        if (
    req.file.mimetype === 'application/pdf' ||
    req.file.originalname.toLowerCase().endsWith('.pdf')
) {
    extractedText = await extractPdfText(req.file.buffer);
} else if (
    req.file.mimetype ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    req.file.originalname.toLowerCase().endsWith('.docx')
) {
    const result = await mammoth.extractRawText({
        buffer: req.file.buffer
    });

    extractedText = result.value;
} else {
    return res.status(400).json({
        success: false,
        message: 'Only PDF and DOCX files are supported.'
    });
}

        const jobDescription = (req.body.jobDescription || 'General Software Engineering Role').replace(/[\r\n]+/g, ' ').trim();

        const systemPrompt = `You are a strict ATS Analyzer. You MUST reply ONLY with a single valid raw JSON object. Do not include markdown formatting like \`\`\`json or any introductory text.`;

        const userPrompt = `Target Job Description:
${jobDescription}

Resume Text:
${extractedText}

Respond strictly using this JSON structure:
{
  "ats_score": 85,
  "skills_match": 80,
  "keyword_match": 75,
  "formatting_status": "Good",
  "missing_skills": ["Skill1", "Skill2"],
  "suggestions": ["Suggestion 1"],
  "general_feedback": ["Feedback 1"],
  "rewritten_resume": "Improved content"
}`;

        let response = null;
        // Current active production models on Groq
        const modelsToTry = [
    'openai/gpt-oss-20b',
    'openai/gpt-oss-120b'
];

        for (const modelId of modelsToTry) {
            try {
                const result = await groq.chat.completions.create({
                    model: modelId,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.2
                });

                if (result && result.choices && result.choices[0] && result.choices[0].message) {
                    response = result;
                    console.log(`Successfully generated analysis using model: ${modelId}`);
                    break;
                }
            } catch (err) {
                // Print detailed error data to identify key/permission issues
                console.error(`Model ${modelId} failed:`, err.status, err.message || err);
            }
        }

        if (!response) {
            return res.status(500).json({
                success: false,
                message: 'All Groq AI model requests failed. Please check your API key permissions.'
            });
        }

        let rawContent = response.choices[0].message.content.trim();
        // Clean out any accidental markdown code fencing from the AI response
        rawContent = rawContent.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');

        const aiResult = JSON.parse(rawContent);

        const recordData = {
            resumeid: uuidv4(),
            std_id: studentId,
            file_name: req.file.originalname,
            ats_score: Number(aiResult.ats_score) || 0,
            skills_match: Number(aiResult.skills_match) || 0,
            keyword_match: Number(aiResult.keyword_match) || 0,
            formatting_status: aiResult.formatting_status || 'Good',
            analysis_json: {
                missing_skills: aiResult.missing_skills || [],
                suggestions: aiResult.suggestions || [],
                general_feedback: aiResult.general_feedback || []
            },
            rewritten_resume: aiResult.rewritten_resume || ''
        };

        await ResumeModel.createAnalysis(recordData);

        return res.status(200).json({
            success: true,
            data: recordData
        });

    } catch (error) {
        console.error('Groq Analysis Error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to process resume analysis',
            error: error.message 
        });
    }
};