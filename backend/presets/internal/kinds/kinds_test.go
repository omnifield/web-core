package kinds

import (
	"encoding/json"
	"testing"
)

// TestAllRegistered — ровно те виды, что заведены, ни одного лишнего/пропущенного: шесть видов
// skin (canon-drift-author-tags-assembly в ROADMAP.yaml: assembly — реальный шестой) плюс три
// вида движка кормления (feeder-kinds).
func TestAllRegistered(t *testing.T) {
	want := []string{"outfit", "palette", "form", "content", "tag", "assembly", "api", "adapter", "menu"}
	for _, label := range want {
		if !Known(label) {
			t.Errorf("вид %q не зарегистрирован", label)
		}
	}
	if got := len(Labels()); got != len(want) {
		t.Errorf("зарегистрировано %d видов, ожидалось %d: %v", got, len(want), Labels())
	}
}

func TestUnknownKindNotFound(t *testing.T) {
	if _, ok := New("filter"); ok {
		t.Error("вид \"filter\" ещё не заведён (это будущий вид tables) — New должен вернуть ok=false")
	}
}

// decode — общий хелпер: New(label) даёт свежий указатель, json.Unmarshal кладёт в него данные.
func decode[T any](t *testing.T, label, raw string) *T {
	t.Helper()
	value, ok := New(label)
	if !ok {
		t.Fatalf("вид %q не зарегистрирован", label)
	}
	if err := json.Unmarshal([]byte(raw), value); err != nil {
		t.Fatalf("decode %q: %v", label, err)
	}
	typed, ok := value.(*T)
	if !ok {
		t.Fatalf("New(%q) вернул %T, ожидался %T", label, value, typed)
	}
	return typed
}

func TestPaletteDecode(t *testing.T) {
	p := decode[Palette](t, "palette", `{
		"name": "brand",
		"author": "Egor Raybul",
		"scales": {"space": "linear", "size": {"seed": "fluid", "alpha": true}},
		"light": {"bg": "#fff"},
		"dark": {"bg": "#000"}
	}`)
	if p.Name != "brand" || p.Author == nil || *p.Author != "Egor Raybul" {
		t.Fatalf("name/author не разобрались: %+v", p)
	}
	if string(p.Scales) == "" || string(p.Light) == "" || string(p.Dark) == "" {
		t.Fatalf("открытые словари не сохранились как JSON-поля: %+v", p)
	}
	// dimensions не задан вовсе — законно (omitempty), не должен падать decode.
	if p.Dimensions != nil {
		t.Fatalf("dimensions не задавался, ждали nil: %s", p.Dimensions)
	}
}

func TestFormDecode(t *testing.T) {
	f := decode[Form](t, "form", `{
		"name": "primary",
		"component": "button",
		"recipe": {"base": {"padding": "8px"}, "variants": {"size": {"sm": {"padding": "4px"}}}},
		"variantTags": {"sm": ["default"]},
		"author": "Egor Raybul"
	}`)
	if f.Name != "primary" || f.Component != "button" {
		t.Fatalf("name/component не разобрались: %+v", f)
	}
	if string(f.Recipe) == "" || string(f.VariantTags) == "" {
		t.Fatalf("recipe/variantTags не сохранились как JSON-поля: %+v", f)
	}
	if f.Keyframes != nil {
		t.Fatalf("keyframes не задавался, ждали nil: %s", f.Keyframes)
	}
}

func TestOutfitDecode(t *testing.T) {
	o := decode[Outfit](t, "outfit", `{
		"name": "twitter-dark",
		"palette": "brand",
		"forms": ["button/primary", "input/default"],
		"tags": ["default", "compact"],
		"overrides": {"button": {"color": "red"}},
		"author": "Egor Raybul"
	}`)
	if o.Palette != "brand" {
		t.Fatalf("palette-связь не разобралась: %+v", o)
	}
	if len(o.Forms) != 2 || len(o.Tags) != 2 {
		t.Fatalf("forms/tags-связи не разобрались: %+v", o)
	}
	if string(o.Overrides) == "" {
		t.Fatalf("overrides не сохранился как JSON-поле: %+v", o)
	}
}

func TestContentDecode(t *testing.T) {
	c := decode[Content](t, "content", `{
		"component": "table",
		"data": {"rows": [1, 2, 3]},
		"author": "Egor Raybul"
	}`)
	if c.Component != "table" {
		t.Fatalf("component не разобрался: %+v", c)
	}
	if string(c.Data) == "" {
		t.Fatalf("data не сохранилась как JSON-поле: %+v", c)
	}
}

// TestTagDecodeMatchesLiveRecord — форма Tag взята с живой записи прода (tag/status), не выдумана:
// см. canon-drift-author-tags-assembly в ROADMAP.yaml.
func TestTagDecodeMatchesLiveRecord(t *testing.T) {
	tag := decode[Tag](t, "tag", `{"name":"status","label":"Статусы","author":"Egor Raybul"}`)
	if tag.Name != "status" || tag.Label != "Статусы" {
		t.Fatalf("не совпало с живой записью прода: %+v", tag)
	}
	if tag.Author == nil || *tag.Author != "Egor Raybul" {
		t.Fatalf("author не разобрался: %+v", tag)
	}
}

func TestComponentAssemblyDecode(t *testing.T) {
	a := decode[ComponentAssembly](t, "assembly", `{
		"component": "button",
		"assembly": {"name": "root", "admits": ["icon", "label"]},
		"author": "Egor Raybul"
	}`)
	if a.Component != "button" {
		t.Fatalf("component не разобрался: %+v", a)
	}
	if string(a.Assembly) == "" {
		t.Fatalf("assembly-граф не сохранился как JSON-поле: %+v", a)
	}
}

// TestApiDecode — форма взята с живого кода зоны (interfaces/feeder, entities/openapi): документ
// уже разобран, внутри ручек и определений — произвольная JSON Schema.
func TestApiDecode(t *testing.T) {
	api := decode[Api](t, "api", `{
		"endpoints": [{"id":"e1","method":"GET","url":"/users","groupId":"g1","params":[{"name":"page","in":"query","required":false,"schema":{"type":"integer"}}]}],
		"groups": [{"id":"g1","name":"Users"}],
		"defs": {"User": {"type": "object"}}
	}`)
	if string(api.Endpoints) == "" || string(api.Groups) == "" || string(api.Defs) == "" {
		t.Fatalf("документ не сохранился как JSON-поля: %+v", api)
	}
}

func TestAdapterDecode(t *testing.T) {
	adapter := decode[Adapter](t, "adapter", `{
		"root": "/data/items",
		"rules": [{"id":"r1","target":"/title","from":"/name","steps":[{"kind":"trim"}]}],
		"extra": "drop",
		"providers": {"api": {"e1": {}}},
		"consumers": {"component": {"table": {}}}
	}`)
	if adapter.Root != "/data/items" || adapter.Extra != "drop" {
		t.Fatalf("скаляры верхнего уровня не разобрались: %+v", adapter)
	}
	if string(adapter.Rules) == "" || string(adapter.Providers) == "" || string(adapter.Consumers) == "" {
		t.Fatalf("правила и деревья участников не сохранились как JSON-поля: %+v", adapter)
	}
}

// TestMenuDecode — у вида нет своего имени внутри содержимого (menu-name-is-dead в ROADMAP.yaml):
// имя записи приезжает конвертом, а присланное в содержимом молча пропускается, как любое чужое.
func TestMenuDecode(t *testing.T) {
	menu := decode[Menu](t, "menu", `{"adapters":["users-list","user-card"]}`)
	if len(menu.Adapters) != 2 {
		t.Fatalf("имена адаптеров не разобрались как связь: %+v", menu)
	}

	withName := decode[Menu](t, "menu", `{"name":"studio","adapters":["users-list"]}`)
	if len(withName.Adapters) != 1 {
		t.Fatalf("лишнее поле в содержимом не должно мешать разбору: %+v", withName)
	}
}

// TestDoubleRegisterPanics — два владельца на один kind не могут тихо разъехаться по init-порядку.
func TestDoubleRegisterPanics(t *testing.T) {
	defer func() {
		if recover() == nil {
			t.Fatal("повторная регистрация того же kind должна паниковать")
		}
	}()
	Register(Kind{Label: "tag", New: func() any { return &Tag{} }})
}
