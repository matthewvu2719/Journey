/**
 * Voice Call API Service
 * Centralized API calls for voice call functionality
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const voiceApi = {
  // ========== Preferences ==========
  
  async getPreferences(userId) {
    const response = await fetch(`${API_BASE_URL}/voice/preferences/${userId}`);
    if (!response.ok) throw new Error('Failed to load preferences');
    return response.json();
  },

  async savePreferences(userId, preferences) {
    const response = await fetch(`${API_BASE_URL}/voice/preferences/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to save preferences');
    }
    return response.json();
  },

  // ========== Scheduling ==========
  
  async scheduleCall(userId, callData) {
    const response = await fetch(`${API_BASE_URL}/voice/schedule/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(callData)
    });
    if (!response.ok) throw new Error('Failed to schedule call');
    return response.json();
  },

  async scheduleRecurringCall(userId, recurringData) {
    const response = await fetch(`${API_BASE_URL}/voice/schedule/recurring/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recurringData)
    });
    if (!response.ok) throw new Error('Failed to schedule recurring call');
    return response.json();
  },

  async getScheduledCalls(userId) {
    const response = await fetch(`${API_BASE_URL}/voice/scheduled/${userId}`);
    if (!response.ok) throw new Error('Failed to load scheduled calls');
    return response.json();
  },

  async cancelScheduledCall(callId) {
    const response = await fetch(`${API_BASE_URL}/voice/scheduled/${callId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to cancel call');
    return response.json();
  },

  // ========== WebRTC ==========
  
  async startWebRTCCall(userId) {
    const response = await fetch(`${API_BASE_URL}/voice/webrtc/start/${userId}`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to start call');
    return response.json();
  },

  async endWebRTCCall(sessionId) {
    const response = await fetch(`${API_BASE_URL}/voice/webrtc/end/${sessionId}`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to end call');
    return response.json();
  },

  getWebRTCWebSocketUrl(sessionId) {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = API_BASE_URL.replace('http://', '').replace('https://', '');
    return `${wsProtocol}//${wsHost}/voice/webrtc/ws/${sessionId}`;
  },

  // ========== Call History ==========
  
  async getCallHistory(userId, limit = 50) {
    const response = await fetch(`${API_BASE_URL}/voice/history/${userId}?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to load call history');
    return response.json();
  }
};

export default voiceApi;
