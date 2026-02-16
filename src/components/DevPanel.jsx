import { useState, useEffect, useRef } from "react";
import aiLogger from "../utils/aiLogger";

const MODEL_MAP = {
  "claude-sonnet-4-5": "claude-sonnet-4-5-20250929",
  "claude-haiku-4-5": "claude-haiku-4-5-20251001",
};

export default function DevPanel({ onClose }) {
  const [logs, setLogs] = useState(aiLogger.getLogs());
  const [expandedId, setExpandedId] = useState(null);
  const [tab, setTab] = useState("prompt");
  const scrollRef = useRef(null);

  // Playground state
  const [pgSystem, setPgSystem] = useState("");
  const [pgUser, setPgUser] = useState("");
  const [pgTemp, setPgTemp] = useState(0.9);
  const [pgModel, setPgModel] = useState("claude-haiku-4-5");
  const [pgRunning, setPgRunning] = useState(false);
  const [pgResult, setPgResult] = useState(null);
  const [pgDuration, setPgDuration] = useState(null);

  useEffect(() => {
    return aiLogger.subscribe(setLogs);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs.length]);

  const selected = logs.find((l) => l.id === expandedId);

  // Load selected log into playground
  const loadIntoPlayground = () => {
    if (!selected) return;
    setPgSystem(selected.systemPrompt || "");
    setPgUser(selected.userMessage || "");
    setPgModel(selected.model || "claude-haiku-4-5");
    setPgResult(null);
    setPgDuration(null);
    setTab("playground");
  };

  // Run playground call
  const runPlayground = async () => {
    setPgRunning(true);
    setPgResult(null);
    const t0 = performance.now();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL_MAP[pgModel] || MODEL_MAP["claude-haiku-4-5"],
          max_tokens: 600,
          temperature: pgTemp,
          system: pgSystem,
          messages: [{ role: "user", content: pgUser }],
        }),
      });

      const data = await response.json();
      const text = data.content?.map((b) => b.text || "").join("") || "(empty)";
      setPgDuration(Math.round(performance.now() - t0));
      setPgResult(text);
    } catch (err) {
      setPgDuration(Math.round(performance.now() - t0));
      setPgResult(`Error: ${err.message}`);
    }
    setPgRunning(false);
  };

  // Stats
  const totalCalls = logs.length;
  const successCount = logs.filter((l) => l.status === "success").length;
  const errorCount = logs.filter((l) => l.status === "error").length;
  const pendingCount = logs.filter((l) => l.status === "pending").length;
  const validCount = logs.filter((l) => l.validationResult?.valid).length;
  const fixedCount = logs.filter((l) => l.validationResult && !l.validationResult.valid).length;
  const avgDuration = successCount > 0
    ? Math.round(logs.filter((l) => l.duration).reduce((a, l) => a + l.duration, 0) / successCount)
    : 0;
  const totalTokensIn = logs.reduce((a, l) => a + (l.tokensEstimate?.input || 0), 0);
  const totalTokensOut = logs.reduce((a, l) => a + (l.tokensEstimate?.output || 0), 0);

  return (
    <div className="devpanel-overlay" onClick={onClose}>
      <div className="devpanel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="devpanel-header">
          <div className="devpanel-title">
            <span className="devpanel-icon">🔬</span>
            AI Prompt Observatory
          </div>
          <div className="devpanel-close" onClick={onClose}>[T] close</div>
        </div>

        {/* Stats bar */}
        <div className="devpanel-stats">
          <span className="dp-stat">
            <span className="dp-stat-n">{totalCalls}</span> calls
          </span>
          <span className="dp-stat dp-stat-ok">
            <span className="dp-stat-n">{successCount}</span> ok
          </span>
          {errorCount > 0 && (
            <span className="dp-stat dp-stat-err">
              <span className="dp-stat-n">{errorCount}</span> err
            </span>
          )}
          {pendingCount > 0 && (
            <span className="dp-stat dp-stat-pending">
              <span className="dp-stat-n">{pendingCount}</span> pending
            </span>
          )}
          <span className="dp-stat-sep">|</span>
          <span className="dp-stat">
            <span className="dp-stat-n">{validCount}</span> ✅
          </span>
          {fixedCount > 0 && (
            <span className="dp-stat dp-stat-warn">
              <span className="dp-stat-n">{fixedCount}</span> ⚠️ fixed
            </span>
          )}
          <span className="dp-stat-sep">|</span>
          <span className="dp-stat">
            avg <span className="dp-stat-n">{avgDuration}ms</span>
          </span>
          <span className="dp-stat">
            ~<span className="dp-stat-n">{totalTokensIn + totalTokensOut}</span> tokens
          </span>
          <button className="dp-clear" onClick={() => aiLogger.clear()}>Clear</button>
        </div>

        <div className="devpanel-body">
          {/* Left: log list */}
          <div className="devpanel-list" ref={scrollRef}>
            {logs.length === 0 && (
              <div className="dp-empty">No AI calls yet. Interact with NPCs or start a quest.</div>
            )}
            {logs.map((log) => (
              <div
                key={log.id}
                className={`dp-entry ${log.id === expandedId ? "dp-entry-active" : ""} dp-entry-${log.status}`}
                onClick={() => { setExpandedId(log.id === expandedId ? null : log.id); setTab("prompt"); }}
              >
                <div className="dp-entry-top">
                  <span className={`dp-badge dp-badge-${log.status}`}>
                    {log.status === "pending" ? "⏳" : log.status === "success" ? "✓" : "✗"}
                  </span>
                  <span className="dp-entry-endpoint">{log.endpoint}</span>
                  <span className="dp-entry-model">{log.model}</span>
                </div>
                <div className="dp-entry-bottom">
                  <span className="dp-entry-time">
                    {log.duration ? `${log.duration}ms` : "..."}
                  </span>
                  {log.tokensEstimate && (
                    <span className="dp-entry-tokens">
                      {log.tokensEstimate.input}→{log.tokensEstimate.output} tok
                    </span>
                  )}
                  {log.validationResult && (
                    <span className={`dp-entry-valid ${log.validationResult.valid ? "dp-valid-ok" : "dp-valid-warn"}`}>
                      {log.validationResult.valid ? "✅" : "⚠️"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Right: detail view */}
          <div className="devpanel-detail">
            {!selected ? (
              <div className="dp-detail-empty">Select a call to inspect</div>
            ) : (
              <>
                <div className="dp-detail-header">
                  <span className="dp-detail-title">{selected.endpoint}</span>
                  <span className="dp-detail-model">{selected.model}</span>
                  <span className="dp-detail-duration">{selected.duration}ms</span>
                </div>

                <div className="dp-tabs">
                  <button className={`dp-tab ${tab === "prompt" ? "dp-tab-active" : ""}`} onClick={() => setTab("prompt")}>
                    Prompt
                  </button>
                  <button className={`dp-tab ${tab === "response" ? "dp-tab-active" : ""}`} onClick={() => setTab("response")}>
                    Response
                  </button>
                  <button className={`dp-tab ${tab === "validation" ? "dp-tab-active" : ""}`} onClick={() => setTab("validation")}>
                    Validation
                  </button>
                  <button className={`dp-tab dp-tab-play ${tab === "playground" ? "dp-tab-active" : ""}`} onClick={loadIntoPlayground}>
                    🎛️ Playground
                  </button>
                </div>

                <div className="dp-detail-content">
                  {/* === PROMPT TAB === */}
                  {tab === "prompt" && (
                    <>
                      <div className="dp-section-label">System Prompt</div>
                      <pre className="dp-code">{selected.systemPrompt || "(none)"}</pre>
                      <div className="dp-section-label">User Message</div>
                      <pre className="dp-code">{selected.userMessage || "(none)"}</pre>
                    </>
                  )}

                  {/* === RESPONSE TAB === */}
                  {tab === "response" && (
                    <>
                      <div className="dp-section-label">Raw Response</div>
                      <pre className="dp-code">{selected.rawResponse || "(no response)"}</pre>
                    </>
                  )}

                  {/* === VALIDATION TAB === */}
                  {tab === "validation" && selected.validationResult && (
                    <>
                      <div className={`dp-validation-summary ${selected.validationResult.valid ? "dp-vs-ok" : "dp-vs-warn"}`}>
                        {selected.validationResult.summary}
                      </div>
                      {selected.validationResult.issues.length > 0 && (
                        <>
                          <div className="dp-section-label">Issues</div>
                          {selected.validationResult.issues.map((issue, i) => (
                            <div key={i} className="dp-issue">❌ {issue}</div>
                          ))}
                        </>
                      )}
                      {selected.validationResult.fixes.length > 0 && (
                        <>
                          <div className="dp-section-label">Auto-fixes Applied</div>
                          {selected.validationResult.fixes.map((fix, i) => (
                            <div key={i} className="dp-fix">🔧 {fix}</div>
                          ))}
                        </>
                      )}
                      {selected.validationResult.valid && (
                        <div className="dp-all-clear">All validation checks passed. No fixes needed.</div>
                      )}
                    </>
                  )}
                  {tab === "validation" && !selected.validationResult && (
                    <div className="dp-detail-empty">No validation data (call pending or failed)</div>
                  )}

                  {/* === PLAYGROUND TAB === */}
                  {tab === "playground" && (
                    <div className="dp-playground">
                      <div className="dp-pg-controls">
                        <div className="dp-pg-control-row">
                          <label className="dp-pg-label">Model</label>
                          <select
                            className="dp-pg-select"
                            value={pgModel}
                            onChange={(e) => setPgModel(e.target.value)}
                          >
                            <option value="claude-sonnet-4-5">Sonnet 4.5 (quality)</option>
                            <option value="claude-haiku-4-5">Haiku 4.5 (speed)</option>
                          </select>
                        </div>
                        <div className="dp-pg-control-row">
                          <label className="dp-pg-label">Temperature</label>
                          <input
                            className="dp-pg-slider"
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={pgTemp}
                            onChange={(e) => setPgTemp(parseFloat(e.target.value))}
                          />
                          <span className="dp-pg-temp-val">{pgTemp.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="dp-section-label">System Prompt (editable)</div>
                      <textarea
                        className="dp-pg-textarea"
                        value={pgSystem}
                        onChange={(e) => setPgSystem(e.target.value)}
                        rows={6}
                      />

                      <div className="dp-section-label">User Message (editable)</div>
                      <textarea
                        className="dp-pg-textarea"
                        value={pgUser}
                        onChange={(e) => setPgUser(e.target.value)}
                        rows={3}
                      />

                      <button
                        className={`dp-pg-run ${pgRunning ? "dp-pg-running" : ""}`}
                        onClick={runPlayground}
                        disabled={pgRunning}
                      >
                        {pgRunning ? "⏳ Running..." : "▶ Run Prompt"}
                      </button>

                      {/* A/B Comparison */}
                      {(pgResult || selected.rawResponse) && (
                        <div className="dp-pg-compare">
                          <div className="dp-pg-compare-col">
                            <div className="dp-pg-compare-label">Original ({selected.duration}ms)</div>
                            <pre className="dp-code dp-pg-compare-code">{selected.rawResponse || "(none)"}</pre>
                          </div>
                          <div className="dp-pg-compare-col">
                            <div className="dp-pg-compare-label dp-pg-compare-new">
                              Playground {pgDuration ? `(${pgDuration}ms)` : ""}
                            </div>
                            <pre className="dp-code dp-pg-compare-code">
                              {pgResult || "(click Run to generate)"}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
