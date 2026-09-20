package kinds

// Menu — контейнер одного приложения: какие записи вида `adapter` оно берёт. `adapters` — имена,
// то есть связь на другие записи службы, ровно как `Outfit.forms`: резолвится полем через
// dataloader, здесь остаётся списком строк.
type Menu struct {
	Name     string   `json:"name"`
	Adapters []string `json:"adapters"`
}

func init() {
	Register(Kind{Label: "menu", New: func() any { return &Menu{} }})
}
