package slug

import (
	"crypto/rand"
	"fmt"
	"math/big"
)

// word lists for generating human-readable slugs (adjective-noun-number).
var adjectives = []string{
	"brave", "calm", "eager", "fast", "gentle",
	"happy", "kind", "lively", "nice", "proud",
	"silly", "swift", "witty", "zany", "bold",
}

var nouns = []string{
	"panda", "tiger", "falcon", "shark", "wolf",
	"eagle", "otter", "raven", "fox", "lynx",
	"bison", "crane", "gecko", "koala", "moose",
}

// Generate returns a slug like "brave-panda-42".
func Generate() (string, error) {
	adj, err := randChoice(adjectives)
	if err != nil {
		return "", err
	}
	noun, err := randChoice(nouns)
	if err != nil {
		return "", err
	}
	num, err := rand.Int(rand.Reader, big.NewInt(100))
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%s-%s-%02d", adj, noun, num.Int64()), nil
}

func randChoice(list []string) (string, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(int64(len(list))))
	if err != nil {
		return "", err
	}
	return list[n.Int64()], nil
}
