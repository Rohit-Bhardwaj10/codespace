package handlers

import (
	"bytes"
	"context"
	"fmt"
	"net/http"
	"os/exec"
	"time"

	"github.com/gin-gonic/gin"
)

type ExecuteRequest struct {
	LanguageID int    `json:"language_id"`
	SourceCode string `json:"source_code"`
}

type ExecuteResponse struct {
	Stdout        string `json:"stdout"`
	Stderr        string `json:"stderr"`
	CompileOutput string `json:"compile_output"`
	Time          string `json:"time"`
}

type ExecuteHandler struct{}

func NewExecuteHandler() *ExecuteHandler {
	return &ExecuteHandler{}
}

// POST /execute — Bootstraps an ephemeral Docker container to safely RCE the code
func (h *ExecuteHandler) Execute(c *gin.Context) {
	var req ExecuteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	start := time.Now()
	var cmd *exec.Cmd

	// Maximum 10 seconds execution time to prevent infinite loops
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	switch req.LanguageID {
	case 71: // Python
		cmd = exec.CommandContext(ctx, "docker", "run", "--rm", "-i", "--memory", "128m", "python:3.10-alpine", "python")
	case 63: // Javascript
		cmd = exec.CommandContext(ctx, "docker", "run", "--rm", "-i", "--memory", "128m", "node:18-alpine", "node")
	case 74: // Typescript
		script := `cat > main.ts && npx -y ts-node main.ts`
		cmd = exec.CommandContext(ctx, "docker", "run", "--rm", "-i", "--memory", "256m", "node:18-alpine", "sh", "-c", script)
	case 95: // Go
		script := `cat > main.go && go run main.go`
		cmd = exec.CommandContext(ctx, "docker", "run", "--rm", "-i", "--memory", "256m", "golang:1.21-alpine", "sh", "-c", script)
	case 54: // C++
		script := `cat > main.cpp && g++ main.cpp && ./a.out`
		cmd = exec.CommandContext(ctx, "docker", "run", "--rm", "-i", "--memory", "256m", "gcc:11", "sh", "-c", script)
	default: // Default to JS
		cmd = exec.CommandContext(ctx, "docker", "run", "--rm", "-i", "--memory", "128m", "node:18-alpine", "node")
	}

	// Feed code strictly through stdin to bypass file mounting security/path bugs on Windows
	cmd.Stdin = bytes.NewBufferString(req.SourceCode)
	
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()

	execTime := fmt.Sprintf("%.2f", time.Since(start).Seconds())

	errStr := stderr.String()
	if ctx.Err() == context.DeadlineExceeded {
		errStr = "Execution Error: Time Limit Exceeded (10s timeout)"
	} else if err != nil && errStr == "" {
		errStr = err.Error()
	}

	c.JSON(http.StatusOK, ExecuteResponse{
		Stdout: stdout.String(),
		Stderr: errStr,
		Time:   execTime,
	})
}

