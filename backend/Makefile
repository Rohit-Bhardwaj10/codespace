.PHONY: run build lint tidy

run:
	go run ./cmd/server

build:
	go build -o bin/server ./cmd/server

lint:
	golangci-lint run ./...

tidy:
	go mod tidy
