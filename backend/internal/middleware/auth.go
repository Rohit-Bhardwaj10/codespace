// Package middleware — auth guard placeholder for Phase 3.
// For MVP, all routes are unauthenticated. Wire this in when GitHub OAuth is added.

package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// AuthRequired is a no-op for MVP — replace with JWT validation in Phase 3.
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		// TODO (Phase 3):
		//   1. Extract Bearer token from Authorization header
		//   2. Validate JWT signature using cfg.JWTSecret
		//   3. Set userID in context: c.Set("user_id", claims.UserID)
		//   4. Abort with 401 if invalid
		c.Next()
	}
}

// OptionalAuth attempts to parse a JWT but does not block unauthenticated requests.
func OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// TODO (Phase 3): parse token if present, set user context
		_ = c.GetHeader("Authorization") // silence unused warning
		c.Set("user_id", nil)
		c.Next()
	}
}

func abort401(c *gin.Context) {
	c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
}
