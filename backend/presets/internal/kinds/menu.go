package kinds

// Menu — контейнер одного приложения: какие записи вида `adapter` оно берёт. `adapters` — имена,
// то есть связь на другие записи службы, ровно как `Outfit.forms`: резолвится полем через
// dataloader, здесь остаётся списком строк. Своего имени внутри содержимого у вида нет — имя
// записи приезжает конвертом (FAQ.md, «Виды движка кормления»).
type Menu struct {
	Adapters []string `json:"adapters"`
}

func init() {
	Register(Kind{Label: "menu", New: func() any { return &Menu{} }})
}
