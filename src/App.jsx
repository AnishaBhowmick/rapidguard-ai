import { useState } from 'react';

const BACKEND_URL = 'http://localhost:5000/analyze';
const ROOM = 'Room 412';
const FLOOR = 'Floor 4';

function App() {
  const [emergencyType, setEmergencyType] = useState('Fire');
  const [aiResponse, setAiResponse] = useState({
    risk: 'No analysis yet.',
    next: 'Trigger an emergency to see the AI response.',
    actions: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [alerts, setAlerts] = useState([]);

  const systemStatus = error ? 'Error' : loading ? 'Analyzing...' : 'System Active';

  const parseResponse = (rawText) => {
    const lines = rawText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const risk = lines.find((line) => /risk/i.test(line)) || lines[0] || 'Risk information unavailable.';
    const next = lines.find((line) => /next/i.test(line)) || lines[1] || 'Next steps unavailable.';

    const actions = [];
    const actionStart = lines.findIndex((line) => /top 3 actions/i.test(line));

    if (actionStart >= 0) {
      for (let i = actionStart + 1; i < lines.length && actions.length < 3; i += 1) {
        const clean = lines[i].replace(/^[-\d\.\s]+/, '').trim();
        if (clean) actions.push(clean);
      }
    }

    if (actions.length === 0) {
      lines.forEach((line) => {
        const clean = line.replace(/^[-\d\.\s]+/, '').trim();
        if (line.startsWith('-') || /^\d+\./.test(line)) {
          actions.push(clean);
        }
      });
    }

    return {
      risk,
      next,
      actions: actions.slice(0, 3),
    };
  };

  const handleEmergency = async () => {
    setLoading(true);
    setError(null);
    setAiResponse({ risk: 'Analyzing risk...', next: 'Waiting for AI analysis...', actions: [] });

    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emergencyType }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        console.error('Backend error response:', response.status, errorBody);
        throw new Error(errorBody?.error || `Server returned ${response.status}`);
      }

      const data = await response.json();
      const rawText = data?.text;

      if (!rawText) {
        console.error('Invalid backend payload:', data);
        throw new Error('Invalid AI response.');
      }

      const parsed = parseResponse(rawText);
      setAiResponse(parsed);
      setAlerts((prev) => [
        {
          id: Date.now(),
          type: emergencyType,
          room: ROOM,
          status: emergencyType === 'Medical' ? 'Active' : 'Critical',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev,
      ]);
    } catch (fetchError) {
      console.error('Frontend fetch failed:', fetchError);
      setError(fetchError.message || 'Unable to get AI response');
      setAiResponse({ risk: 'Analysis failed', next: 'Please try again or check the backend.', actions: [] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="hero-panel">
        <div>
          <p className="eyebrow">RapidGuard</p>
          <h1>AI Emergency Response Dashboard</h1>
          <p className="hero-copy">
            Trigger a simulated emergency and let Gemini analyze the risk, next events, and top actions.
          </p>
        </div>
        <div className={`status-pill ${systemStatus.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
          <span className="status-dot" />
          {systemStatus}
        </div>
      </header>

      <div className="main-grid">
        <section className="control-panel card-panel">
          <div className="panel-header">
            <h2>Smart Emergency Panel</h2>
            <p>Select the emergency type and trigger the AI response.</p>
          </div>

          <label className="field-label" htmlFor="emergency-type">
            Emergency type
          </label>
          <select
            id="emergency-type"
            value={emergencyType}
            onChange={(event) => setEmergencyType(event.target.value)}
            disabled={loading}
          >
            <option value="Fire">Fire</option>
            <option value="Medical">Medical</option>
            <option value="Threat">Threat</option>
          </select>

          <button className="action-button" onClick={handleEmergency} disabled={loading}>
            {loading ? 'Analyzing...' : 'Trigger Emergency'}
          </button>

          <div className="info-card">
            <p>
              <strong>Fallback ready:</strong> SMS fallback ready if network fails.
            </p>
          </div>
        </section>

        <section className="response-panel card-panel">
          <div className="panel-header">
            <h2>AI Response Panel</h2>
            <p>Real-time emergency insights from Gemini.</p>
          </div>

          <div className="response-box">
            <div className="response-row">
              <span className="response-label">Risk level</span>
              <p className="response-risk">{aiResponse.risk}</p>
            </div>

            <div className="response-row">
              <span className="response-label">What happens next</span>
              <p>{aiResponse.next}</p>
            </div>

            <div className="response-row">
              <span className="response-label">Top actions</span>
              {aiResponse.actions.length > 0 ? (
                <ul>
                  {aiResponse.actions.map((action, index) => (
                    <li key={index}>{action}</li>
                  ))}
                </ul>
              ) : (
                <p className="muted-text">No actions available yet.</p>
              )}
            </div>

            {error && <p className="error-text">Error: {error}</p>}
          </div>
        </section>
      </div>

      <section className="dashboard-panel card-panel">
        <div className="panel-header">
          <h2>Staff Dashboard</h2>
          <p>Active alerts and incident status for the operations team.</p>
        </div>

        {alerts.length === 0 ? (
          <div className="empty-state">
            <p>No alerts yet. Trigger an emergency to populate the dashboard.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Room</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.id}>
                  <td>{alert.type}</td>
                  <td>{alert.room}</td>
                  <td>
                    <span className={`status-chip ${alert.status.toLowerCase()}`}>{alert.status}</span>
                  </td>
                  <td>{alert.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default App;
