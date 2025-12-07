/**
 * Local storage utilities for authentication token management
 */

const STORAGE_KEYS = {
  TOKEN: 'habit_coach_token',
  USER: 'habit_coach_user',
  DEVICE_ID: 'habit_coach_device_id'
}

/**
 * Store authentication token in local storage
 * @param {string} token - Bearer token
 */
export const setToken = (token) => {
  if (token) {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token)
  }
}

/**
 * Retrieve authentication token from local storage
 * @returns {string|null} Bearer token or null
 */
export const getToken = () => {
  return localStorage.getItem(STORAGE_KEYS.TOKEN)
}

/**
 * Remove authentication token from local storage
 */
export const removeToken = () => {
  localStorage.removeItem(STORAGE_KEYS.TOKEN)
}

/**
 * Store user object in local storage
 * @param {Object} user - User object
 */
export const setUser = (user) => {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
  }
}

/**
 * Retrieve user object from local storage
 * @returns {Object|null} User object or null
 */
export const getUser = () => {
  const user = localStorage.getItem(STORAGE_KEYS.USER)
  return user ? JSON.parse(user) : null
}

/**
 * Remove user object from local storage
 */
export const removeUser = () => {
  localStorage.removeItem(STORAGE_KEYS.USER)
}

/**
 * Generate or retrieve device ID for guest mode
 * @returns {string} Device identifier
 */
export const getDeviceId = () => {
  const stored = localStorage.getItem(STORAGE_KEYS.DEVICE_ID)
  if (stored) return stored
  
  const deviceId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId)
  return deviceId
}

/**
 * Clear all authentication data from local storage
 */
export const clearAuthData = () => {
  removeToken()
  removeUser()
  // Note: We keep device ID for guest mode persistence
}
