const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const filePath = path.join(__dirname, req.file.path);
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    const resumeText = pdfData.text;

    console.log('Received file:', req.file.originalname);
    console.log('Extracted resume text length:', resumeText.length);
    console.log('Calling Gemini REST API...');

    // Call Gemini REST API for feedback
    const feedback = await getGeminiFeedback(resumeText);

    console.log('Gemini API feedback:', feedback);

    fs.unlinkSync(filePath);
    res.json({ feedback });
  } catch (err) {
    console.error('Error in /upload:', err);
    res.status(500).json({ error: 'Failed to process resume', details: err.message });
  }
});

async function getGeminiFeedback(resumeText) {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
  const prompt = `You are a resume expert. Analyze the following resume and provide feedback in JSON with these fields:\n- clarity (as a single string summary, not an object or array)\n- strengths (as a single string)\n- gaps (as a single string)\n- suggestions (as a single string)\nDo not use arrays or objects for any field. Do not include markdown or code blocks. Only return a valid JSON object.\n\nResume:\n${resumeText}`;
  try {
    const response = await axios.post(url, {
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });
    let text = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

    // Just parse the JSON directly
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      // fallback: return everything as suggestions
      return {
        clarity: '',
        strengths: '',
        gaps: '',
        suggestions: text || 'See above.',
      };
    }

    // Return the fields directly
    return {
      clarity: parsed.clarity || '',
      strengths: parsed.strengths || '',
      gaps: parsed.gaps || '',
      suggestions: parsed.suggestions || ''
    };
  } catch (err) {
    console.error('Error calling Gemini REST API:', err.response?.data || err.message);
    throw err;
  }
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 