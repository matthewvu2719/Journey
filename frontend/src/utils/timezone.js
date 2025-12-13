/**
 * Timezone utility functions
 */

/**
 * Get the user's timezone offset in minutes
 * @returns {number} Timezone offset in minutes (negative for behind UTC, positive for ahead)
 */
export const getTimezoneOffset = () => {
  // getTimezoneOffset() returns positive for behind UTC, negative for ahead
  // We return the negative to get the actual offset from UTC
  return -new Date().getTimezoneOffset()
}

/**
 * Get today's day name in user's local timezone
 * @returns {string} Day name in short format (Mon, Tue, Wed, etc.)
 */
export const getTodayDayName = () => {
  const now = new Date()
  console.log('[TIMEZONE DEBUG] getTodayDayName - current time:', now.toString())
  const dayName = now.toLocaleDateString('en-US', { weekday: 'short' })
  console.log('[TIMEZONE DEBUG] getTodayDayName - result:', dayName)
  return dayName
}

/**
 * Get today's date in user's local timezone
 * @returns {string} Date in YYYY-MM-DD format
 */
export const getTodayDate = () => {
  const now = new Date()
  console.log('[TIMEZONE DEBUG] getTodayDate - current time:', now.toString())
  const dateStr = now.toLocaleDateString('en-CA') // en-CA gives YYYY-MM-DD format
  console.log('[TIMEZONE DEBUG] getTodayDate - result:', dateStr)
  return dateStr
}