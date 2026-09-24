package kinds

import "encoding/json"

// Adapter — зеркало `Adapter` (interfaces/feeder, entities/adapter): шов «поставщик → потребитель».
// `root` — где в ответе лежит набор записей, `extra` — что делать с чужими полями. `rules`
// (правила перекладки), `providers`/`consumers` (деревья участников с произвольными ключами) —
// именованные JSON-поля: служба в них не смотрит, разбор формата у владельца вида.
type Adapter struct {
	Root      string          `json:"root"`
	Rules     json.RawMessage `json:"rules"`
	Extra     string          `json:"extra,omitempty"`
	Providers json.RawMessage `json:"providers,omitempty"`
	Consumers json.RawMessage `json:"consumers,omitempty"`
}

func init() {
	Register(Kind{Label: "adapter", New: func() any { return &Adapter{} }})
}
