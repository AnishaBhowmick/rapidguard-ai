import { useState } from 'react';

const BACKEND_URL = "https://rapidguard-ai.onrender.com/analyze";
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

    const risk =
      lines.find((line) => /risk/i.test(line)) ||
      lines[0] ||
      'Risk information unavailable.';

    const next =
      lines.find((line) => /next/i.test(line)) ||
      lines[1] ||
      'Next steps unavailable.';

    const actions = [];
    const actionStart = lines.findIndex((line) =>
      /top 3 actions/i.test(line)
    );

    if (actionStart >= 0) {
      for (let i = actionStart + 1; i < lines.length && actions.length < 3; i++) {
        const clean = lines[i].replace(/^[-\d\.\s]+/, '').trim();
        if (clean) actions.push(clean);
      }
    }

    if (actions.length === 0) {
      lines.forEach((line) => {
        if (line.startsWith('-') || /^\d+\./.test(line)) {
          const clean = line.replace(/^[-\d\.\s]+/, '').trim();
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

    setAiResponse({
      risk: 'Analyzing risk...',
      next: 'Waiting for AI analysis...',
      actions: [],
    });

    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emergencyType }),
      });

      const data = await response.json().catch(() => null);

      // ✅ FIXED ERROR HANDLING
      if (!response.ok) {
        console.error('Backend error:', response.status, data);

        const errorMessage =
          typeof data?.error === 'string'
            ? data.error
            : JSON.stringify(data?.error || data);

        throw new Error(errorMessage || `Server returned ${response.status}`);
      }

      if (!data?.text) {
        console.error('Invalid backend response:', data);
        throw new Error('Invalid AI response.');
      }

      const parsed = parseResponse(data.text);
      setAiResponse(parsed);

      setAlerts((prev) => [
        {
          id: Date.now(),
          type: emergencyType,
          room: ROOM,
          status: emergencyType === 'Medical' ? 'Active' : 'Critical',
          time: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
        ...prev,
      ]);
    } catch (err) {
      console.error('Frontend error:', err);

      setError(
        typeof err.message === 'string'
          ? err.message
          : JSON.stringify(err)
      );

      setAiResponse({
        risk: 'Analysis failed',
        next: 'Please try again or check the backend.',
        actions: [],
      });
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
        {/* LEFT PANEL */}
        <section className="control-panel card-panel">
          <div className="panel-header">
            <h2>Smart Emergency Panel</h2>
            <p>Select the emergency type and trigger the AI response.</p>
          </div>

          <label className="field-label">Emergency type</label>

          <select
            value={emergencyType}
            onChange={(e) => setEmergencyType(e.target.value)}
            disabled={loading}
          >
            <option value="Fire">Fire</option>
            <option value="Medical">Medical</option>
            <option value="Threat">Threat</option>
          </select>

          <button onClick={handleEmergency} disabled={loading}>
            {loading ? 'Analyzing...' : 'Trigger Emergency'}
          </button>

          <div className="info-card">
            <p>
              <strong>Fallback ready:</strong> SMS fallback ready if network fails.
            </p>
          </div>
        </section>

        {/* RIGHT PANEL */}
        <section className="response-panel card-panel">
          <div className="panel-header">
            <h2>AI Response Panel</h2>
            <p>Real-time emergency insights from Gemini.</p>
          </div>

          <div className="response-box">
            <p><strong>Risk level:</strong> {aiResponse.risk}</p>
            <p><strong>What happens next:</strong> {aiResponse.next}</p>

            <p><strong>Top actions:</strong></p>
            {aiResponse.actions.length > 0 ? (
              <ul>
                {aiResponse.actions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            ) : (
              <p>No actions available yet.</p>
            )}

            {/* ✅ FIXED ERROR DISPLAY */}
            {error && (
              <p style={{ color: 'red' }}>
                Error: {typeof error === 'string' ? error : JSON.stringify(error)}
              </p>
            )}
          </div>
        </section>
      </div>

      {/* DASHBOARD */}
      <section className="dashboard-panel card-panel">
        <h2>Staff Dashboard</h2>

        {alerts.length === 0 ? (
          <p>No alerts yet.</p>
        ) : (
          <ul>
            {alerts.map((a) => (
              <li key={a.id}>
                {a.type} | {a.room} | {a.status} | {a.time}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default App;