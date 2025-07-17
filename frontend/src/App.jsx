import { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setFeedback(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF file.');
      return;
    }
    setLoading(true);
    setError('');
    setFeedback(null);
    const formData = new FormData();
    formData.append('resume', file);
    try {
      const res = await axios.post('http://localhost:5000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFeedback(res.data.feedback);
    } catch (err) {
      setError('Failed to get feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Resume AI Feedback Tool</h1>
      <form onSubmit={handleSubmit} className="upload-form">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Analyzing...' : 'Upload & Get Feedback'}
        </button>
      </form>
      {loading && (
        <div style={{ color: '#888', marginTop: '0.5rem' }}>
          Response may be delayed due to overloaded AI model. Please wait...
        </div>
      )}
      {error && <div className="error">{error}</div>}
      {feedback && (
        <div className="feedback">
          <h2>AI Feedback</h2>
          <div>
            <strong>Clarity:</strong>{' '}
            {typeof feedback.clarity === 'string'
              ? feedback.clarity
              : JSON.stringify(feedback.clarity)}
          </div>
          <div>
            <strong>Strengths:</strong>{' '}
            {typeof feedback.strengths === 'string'
              ? feedback.strengths
              : JSON.stringify(feedback.strengths)}
          </div>
          <div>
            <strong>Gaps:</strong>{' '}
            {typeof feedback.gaps === 'string'
              ? feedback.gaps
              : JSON.stringify(feedback.gaps)}
          </div>
          <div>
            <strong>Suggestions:</strong>{' '}
            {typeof feedback.suggestions === 'string'
              ? feedback.suggestions
              : JSON.stringify(feedback.suggestions)}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
