/**
 * AI Call Logger — records every AI interaction for the Dev Panel.
 * Singleton pattern: import and use anywhere.
 */

let logs = [];
let listeners = [];

const aiLogger = {
  /**
   * Log an AI call (before response)
   * Returns a log entry ID to update later with the response.
   */
  start({ endpoint, model, systemPrompt, userMessage }) {
    const entry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      endpoint,
      model,
      systemPrompt,
      userMessage,
      response: null,
      rawResponse: null,
      duration: null,
      tokensEstimate: null,
      status: "pending",
      validationResult: null,
      startTime: performance.now(),
    };
    logs.push(entry);
    notify();
    return entry.id;
  },

  /**
   * Complete a logged call with response data
   */
  complete(id, { response, rawResponse, validationResult }) {
    const entry = logs.find((l) => l.id === id);
    if (!entry) return;
    entry.duration = Math.round(performance.now() - entry.startTime);
    entry.response = response;
    entry.rawResponse = rawResponse || JSON.stringify(response, null, 2);
    entry.status = "success";
    entry.validationResult = validationResult || null;
    // Rough token estimate: ~4 chars per token
    entry.tokensEstimate = {
      input: Math.ceil(((entry.systemPrompt?.length || 0) + (entry.userMessage?.length || 0)) / 4),
      output: Math.ceil((entry.rawResponse?.length || 0) / 4),
    };
    notify();
  },

  /**
   * Mark a call as failed
   */
  fail(id, error) {
    const entry = logs.find((l) => l.id === id);
    if (!entry) return;
    entry.duration = Math.round(performance.now() - entry.startTime);
    entry.status = "error";
    entry.rawResponse = error?.message || String(error);
    notify();
  },

  getLogs() {
    return logs;
  },

  clear() {
    logs = [];
    notify();
  },

  subscribe(fn) {
    listeners.push(fn);
    return () => { listeners = listeners.filter((l) => l !== fn); };
  },
};

function notify() {
  listeners.forEach((fn) => fn([...logs]));
}

export default aiLogger;
