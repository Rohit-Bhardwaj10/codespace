package handlers

import (
	"net/http"

	"github.com/codespace-app/backend/internal/judge"
	"github.com/gin-gonic/gin"
)

type ExecuteHandler struct {
	judgeClient *judge.Client
}

func NewExecuteHandler(jc *judge.Client) *ExecuteHandler {
	return &ExecuteHandler{judgeClient: jc}
}

// POST /execute — proxies to Judge0 and returns stdout/stderr.
func (h *ExecuteHandler) Execute(c *gin.Context) {
	var req judge.SubmitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.judgeClient.Run(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

