package judge

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// Common Judge0 language IDs — add more as needed.
// Full list: https://ce.judge0.com/languages
const (
	LangGo         = 95
	LangPython3    = 71
	LangJavaScript = 63
	LangCPP        = 54
	LangJava       = 62
	LangRust       = 73
)

// Client wraps the Judge0 REST API.
type Client struct {
	baseURL string
	apiKey  string
	http    *http.Client
}

// SubmitRequest is the payload sent to Judge0.
type SubmitRequest struct {
	SourceCode string `json:"source_code"`
	LanguageID int    `json:"language_id"`
	Stdin      string `json:"stdin,omitempty"`
}

// Result is the response from Judge0 after execution completes.
type Result struct {
	Stdout         string  `json:"stdout"`
	Stderr         string  `json:"stderr"`
	CompileOutput  string  `json:"compile_output"`
	Message        string  `json:"message"`
	Time           string  `json:"time"`
	Memory         float64 `json:"memory"`
	Status         Status  `json:"status"`
}

// Status mirrors the Judge0 status object.
type Status struct {
	ID          int    `json:"id"`
	Description string `json:"description"`
}

func NewClient(baseURL, apiKey string) *Client {
	return &Client{
		baseURL: baseURL,
		apiKey:  apiKey,
		http:    &http.Client{Timeout: 15 * time.Second},
	}
}

// Run submits code and blocks until execution completes or times out.
func (c *Client) Run(req SubmitRequest) (*Result, error) {
	token, err := c.submit(req)
	if err != nil {
		return nil, fmt.Errorf("submit: %w", err)
	}
	return c.poll(token)
}

func (c *Client) submit(req SubmitRequest) (string, error) {
	body, err := json.Marshal(req)
	if err != nil {
		return "", err
	}

	httpReq, err := http.NewRequest("POST",
		c.baseURL+"/submissions?base64_encoded=false&wait=false",
		bytes.NewBuffer(body),
	)
	if err != nil {
		return "", err
	}
	c.setHeaders(httpReq)

	resp, err := c.http.Do(httpReq)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var out struct {
		Token string `json:"token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return "", err
	}
	if out.Token == "" {
		return "", fmt.Errorf("no token returned by Judge0")
	}
	return out.Token, nil
}

func (c *Client) poll(token string) (*Result, error) {
	url := fmt.Sprintf("%s/submissions/%s?base64_encoded=false", c.baseURL, token)

	for attempt := 0; attempt < 12; attempt++ {
		time.Sleep(time.Duration(attempt+1) * 500 * time.Millisecond) // exponential-ish backoff

		req, _ := http.NewRequest("GET", url, nil)
		c.setHeaders(req)

		resp, err := c.http.Do(req)
		if err != nil {
			return nil, err
		}

		var result Result
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			resp.Body.Close()
			return nil, err
		}
		resp.Body.Close()

		// Status ID > 2 means processing is done (accepted, error, TLE, etc.)
		if result.Status.ID > 2 {
			return &result, nil
		}
	}

	return nil, fmt.Errorf("judge0: execution timed out after polling")
}

func (c *Client) setHeaders(req *http.Request) {
	req.Header.Set("Content-Type", "application/json")
	if c.apiKey != "" {
		req.Header.Set("X-RapidAPI-Key", c.apiKey)
		req.Header.Set("X-RapidAPI-Host", "judge0-ce.p.rapidapi.com")
	}
}
