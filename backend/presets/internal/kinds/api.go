package kinds

import "encoding/json"

// Api — зеркало `SchemaDocument` (interfaces/feeder, entities/openapi): уже разобранный зоной
// формат чужого API, не сырьё свагера. `endpoints`/`groups`/`defs` — именованные JSON-поля: внутри
// них лежит произвольная JSON Schema, разбирать которую службе нечем и незачем
// (recipe-assembly-json-scalar-boundary в ROADMAP.yaml). Связей на другие записи у вида нет.
type Api struct {
	Endpoints json.RawMessage `json:"endpoints"`
	Groups    json.RawMessage `json:"groups,omitempty"`
	Defs      json.RawMessage `json:"defs,omitempty"`
}

func init() {
	Register(Kind{Label: "api", New: func() any { return &Api{} }})
}
