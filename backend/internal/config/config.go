package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port           string
	Env            string
	DatabaseURL    string
	Judge0APIURL   string
	Judge0APIKey   string
	JWTSecret      string
	AllowedOrigins string
}

// Load reads .env and maps values into a Config struct.
// Falls back to environment variables if .env is absent (production).
func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found — reading from environment")
	}

	return &Config{
		Port:           getEnv("PORT", "8080"),
		Env:            getEnv("ENV", "development"),
		DatabaseURL:    mustEnv("DATABASE_URL"),
		Judge0APIURL:   getEnv("JUDGE0_API_URL", "https://judge0-ce.p.rapidapi.com"),
		Judge0APIKey:   getEnv("JUDGE0_API_KEY", ""),
		JWTSecret:      getEnv("JWT_SECRET", "change_me"),
		AllowedOrigins: getEnv("ALLOWED_ORIGINS", "http://localhost:3000"),
	}
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

func mustEnv(key string) string {
	val := os.Getenv(key)
	if val == "" {
		log.Fatalf("Required environment variable %q is not set", key)
	}
	return val
}
