package middleware

import (
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// CORS sets permissive CORS headers for development and restricts to
// allowedOrigins in production. Pass "*" to allow all (dev only).
func CORS(allowedOrigins string) gin.HandlerFunc {
	origins := strings.Split(allowedOrigins, ",")
	originSet := make(map[string]bool, len(origins))
	for _, o := range origins {
		originSet[strings.TrimSpace(o)] = true
	}

	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		allowed := originSet[origin] || originSet["*"]
		if allowed {
			c.Header("Access-Control-Allow-Origin", origin)
		}

		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Max-Age", "86400")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// Logger is a minimal structured request logger.
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		gin.DefaultWriter.Write([]byte(
			time.Now().Format(time.RFC3339) + " " +
				c.Request.Method + " " +
				c.Request.URL.Path + " " +
				strings.Repeat(" ", max(0, 40-len(c.Request.URL.Path))) +
				"status=" + string(rune('0'+c.Writer.Status()/100)) + "xx " +
				"latency=" + time.Since(start).String() + "\n",
		))
	}
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
