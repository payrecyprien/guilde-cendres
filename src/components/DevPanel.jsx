import { useState, useEffect, useRef } from "react";
import aiLogger from "../utils/aiLogger";

export default function DevPanel({ onClose }) {
  const [logs, setLogs] = useState(aiLogger.getLogs());
  const [expandedId, setExpandedId] = useState(null);
  const [tab, setTab] = useState("prompt"); // prompt | response | validation
  const scrollRef = useRef(null);

  useEffect(() => {
    return aiLogger.subscribe(setLogs);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs.length]);

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

  const selected = logs.find((l) => l.id === expandedId);

  return (
    <div className="devpanel-overlay" onClick={onClose}>
      <div className="devpanel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="devpanel-header">
          <div className="devpanel-title">
            <span className="devpanel-icon">🔬</span>
            AI Prompt Observatory
          </div>
          <div className="devpanel-close" onClick={onClose}>[F2] close</div>
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
                onClick={() => setExpandedId(log.id === expandedId ? null : log.id)}
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
                </div>

                <div className="dp-detail-content">
                  {tab === "prompt" && (
                    <>
                      <div className="dp-section-label">System Prompt</div>
                      <pre className="dp-code">{selected.systemPrompt || "(none)"}</pre>
                      <div className="dp-section-label">User Message</div>
                      <pre className="dp-code">{selected.userMessage || "(none)"}</pre>
                    </>
                  )}
                  {tab === "response" && (
                    <>
                      <div className="dp-section-label">Raw Response</div>
                      <pre className="dp-code">{selected.rawResponse || "(no response)"}</pre>
                    </>
                  )}
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
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
