// utils/session.js
export function getSessionId() {
  let sessionId = sessionStorage.getItem("ayur_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID(); // unique ID
    sessionStorage.setItem("ayur_session_id", sessionId);
  }
  return sessionId;
}
