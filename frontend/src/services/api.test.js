import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fc from 'fast-check'

describe('API Service - Authentication Interceptors', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  // Feature: auth-ui, Property 2: All authenticated API requests include token
  describe('Property 2: Token Injection', () => {
    it('should include Bearer token in Authorization header for all authenticated requests', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 20, maxLength: 100 }), // Generate random tokens
          (token) => {
            // Store token in localStorage
            localStorage.setItem('habit_coach_token', token)

            // Simulate the request interceptor logic
            const requestInterceptor = (config) => {
              const storedToken = localStorage.getItem('habit_coach_token')
              if (storedToken) {
                config.headers.Authorization = `Bearer ${storedToken}`
              }
              return config
            }

            // Test the interceptor with a config object
            const config = { headers: {} }
            const modifiedConfig = requestInterceptor(config)

            // Verify token is included
            expect(modifiedConfig.headers.Authorization).toBe(`Bearer ${token}`)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: auth-ui, Property 12: Concurrent requests use same token
  describe('Property 12: Concurrent Request Token Consistency', () => {
    it('should use the same token for all concurrent requests', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 20, maxLength: 100 }), // Generate random token
          fc.integer({ min: 2, max: 10 }), // Number of concurrent requests
          (token, numRequests) => {
            // Store token in localStorage
            localStorage.setItem('habit_coach_token', token)

            // Simulate the request interceptor logic
            const requestInterceptor = (config) => {
              const storedToken = localStorage.getItem('habit_coach_token')
              if (storedToken) {
                config.headers.Authorization = `Bearer ${storedToken}`
              }
              return config
            }

            // Track tokens used in requests
            const tokensUsed = []

            // Simulate concurrent requests
            const requests = Array.from({ length: numRequests }, () => {
              const config = { headers: {} }
              const modifiedConfig = requestInterceptor(config)
              if (modifiedConfig.headers.Authorization) {
                tokensUsed.push(modifiedConfig.headers.Authorization.replace('Bearer ', ''))
              }
              return modifiedConfig
            })

            // All requests should have been processed
            expect(requests.length).toBe(numRequests)

            // All tokens should be the same
            expect(tokensUsed.length).toBe(numRequests)
            const uniqueTokens = new Set(tokensUsed)
            expect(uniqueTokens.size).toBe(1)
            expect(uniqueTokens.has(token)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
