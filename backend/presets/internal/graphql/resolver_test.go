package graphql

import (
	"context"
	"encoding/json"
	"path/filepath"
	"strings"
	"testing"

	"presets/internal/graphql/loaders"
	"presets/internal/graphql/model"
	"presets/internal/limits"
	presetsmodel "presets/internal/model"
	"presets/internal/store"
)

func openTestStore(t *testing.T) *store.Store {
	t.Helper()
	s, err := store.Open(filepath.Join(t.TempDir(), "presets.db"), limits.Default)
	if err != nil {
		t.Fatalf("Open: %v", err)
	}
	t.Cleanup(func() { _ = s.Close() })
	return s
}

func create(t *testing.T, s *store.Store, kind, name, state string) *presetsmodel.Record {
	t.Helper()
	record, err := s.Create(presetsmodel.Input{
		Label: name,
		Name:  name,
		Kind:  kind,
		State: json.RawMessage(state),
	})
	if err != nil {
		t.Fatalf("Create %s/%s: %v", kind, name, err)
	}
	return record
}

// ctxWithLoaders — контекст резолвера в тесте: то же, что делает loaders.Middleware на реальном
// HTTP-запросе, но без сети — резолверы зовутся напрямую.
func ctxWithLoaders(s *store.Store) context.Context {
	return loaders.Attach(context.Background(), s)
}

func TestPresetsListReturnsTypedRecordsAcrossKinds(t *testing.T) {
	s := openTestStore(t)
	create(t, s, "palette", "brand", `{"name":"brand","light":{"bg":"#fff"}}`)
	create(t, s, "form", "button/primary", `{"name":"button/primary","component":"button","recipe":{"base":{}}}`)

	resolver := New(s, limits.Default)
	ctx := ctxWithLoaders(s)

	presets, err := resolver.Query().Presets(ctx, nil, nil, nil)
	if err != nil {
		t.Fatalf("Presets: %v", err)
	}
	if len(presets) != 2 {
		t.Fatalf("ожидалось 2 записи (палитра+форма), получено %d", len(presets))
	}

	var sawPalette, sawForm bool
	for _, p := range presets {
		switch v := p.(type) {
		case *model.Palette:
			sawPalette = true
			if v.Name != "brand" {
				t.Errorf("palette.name разошёлся: %+v", v)
			}
			if string(v.Light) == "" {
				t.Errorf("palette.light не разобрался как JSON-поле: %+v", v)
			}
		case *model.Form:
			sawForm = true
			if v.Component != "button" {
				t.Errorf("form.component разошёлся: %+v", v)
			}
		}
	}
	if !sawPalette || !sawForm {
		t.Fatalf("ожидались оба типа среди Preset, получено: %+v", presets)
	}
}

func TestPresetsListFilteredByUnknownKindErrors(t *testing.T) {
	s := openTestStore(t)
	resolver := New(s, limits.Default)
	ctx := ctxWithLoaders(s)

	unknown := "filter" // будущий вид tables — сегодня ещё не зарегистрирован
	if _, err := resolver.Query().Presets(ctx, &unknown, nil, nil); err == nil {
		t.Fatal("ожидалась ошибка на незарегистрированный вид")
	}
}

func TestOutfitRelationsResolveAndSkipDanglingReference(t *testing.T) {
	s := openTestStore(t)
	create(t, s, "palette", "brand", `{"name":"brand"}`)
	create(t, s, "form", "button/primary", `{"name":"button/primary","component":"button","recipe":{}}`)
	create(t, s, "tag", "default", `{"name":"default","label":"По умолчанию"}`)
	outfitRecord := create(t, s, "outfit", "twitter-dark", `{
		"name": "twitter-dark",
		"palette": "brand",
		"forms": ["button/primary", "нет-такой-формы"],
		"tags": ["default"]
	}`)

	resolver := New(s, limits.Default)
	ctx := ctxWithLoaders(s)

	preset, err := toPreset(outfitRecord)
	if err != nil {
		t.Fatalf("toPreset: %v", err)
	}
	outfit, ok := preset.(*model.Outfit)
	if !ok {
		t.Fatalf("ожидался *model.Outfit, получено %T", preset)
	}

	palette, err := resolver.Outfit().Palette(ctx, outfit)
	if err != nil {
		t.Fatalf("Palette: %v", err)
	}
	if palette == nil || palette.Name != "brand" {
		t.Fatalf("palette-связь не резолвнулась: %+v", palette)
	}

	forms, err := resolver.Outfit().Forms(ctx, outfit)
	if err != nil {
		t.Fatalf("Forms: %v", err)
	}
	if len(forms) != 1 || forms[0].Component != "button" {
		t.Fatalf("ожидалась ровно одна реальная форма (dangling-ссылка пропускается тихо), получено: %+v", forms)
	}

	tags, err := resolver.Outfit().Tags(ctx, outfit)
	if err != nil {
		t.Fatalf("Tags: %v", err)
	}
	if len(tags) != 1 || tags[0].TagLabel == nil || *tags[0].TagLabel != "По умолчанию" {
		t.Fatalf("tag-связь не резолвнулась: %+v", tags)
	}
}

// TestMenuResolvesAdaptersByNameAndSkipsDangling — меню адресует адаптеры именами, ровно как
// наряд свои формы (feeder-kinds, ROADMAP.yaml): один запрос отдаёт меню вместе с адаптерами,
// ссылка в никуда пропускается тихо, а не роняет весь запрос.
func TestMenuResolvesAdaptersByNameAndSkipsDangling(t *testing.T) {
	s := openTestStore(t)
	create(t, s, "adapter", "users-list", `{
		"root": "/data/items",
		"rules": [{"id":"r1","target":"/title","from":"/name"}],
		"providers": {},
		"consumers": {}
	}`)
	menuRecord := create(t, s, "menu", "studio", `{"adapters":["users-list","нет-такого"]}`)

	resolver := New(s, limits.Default)
	ctx := ctxWithLoaders(s)

	preset, err := toPreset(menuRecord)
	if err != nil {
		t.Fatalf("toPreset: %v", err)
	}
	menu, ok := preset.(*model.Menu)
	if !ok {
		t.Fatalf("ожидался *model.Menu, получено %T", preset)
	}

	adapters, err := resolver.Menu().Adapters(ctx, menu)
	if err != nil {
		t.Fatalf("Adapters: %v", err)
	}
	if len(adapters) != 1 || adapters[0].Name != "users-list" || adapters[0].Root != "/data/items" {
		t.Fatalf("ожидался ровно один реальный адаптер: %+v", adapters)
	}
	if string(adapters[0].Rules) == "" {
		t.Fatalf("правила перекладки не доехали JSON-полем: %+v", adapters[0])
	}
}

// TestApiRecordKeepsUnknownDocumentFields — документ чужого API проходит службу без разбора:
// поля, о которых она ничего не знает, доезжают до читателя, а не срезаются по дороге.
func TestApiRecordKeepsUnknownDocumentFields(t *testing.T) {
	s := openTestStore(t)
	resolver := New(s, limits.Default)
	ctx := ctxWithLoaders(s)

	const document = `{"endpoints":[{"id":"e1","method":"GET","url":"/users","params":[],"неизвестноеПоле":1}],"defs":{"User":{"type":"object"}}}`
	preset, err := resolver.Mutation().CreatePreset(ctx, model.PresetInput{
		Kind:  "api",
		Label: "Бэк users",
		State: model.JSON(document),
	})
	if err != nil {
		t.Fatalf("CreatePreset: %v", err)
	}
	api, ok := preset.(*model.Api)
	if !ok {
		t.Fatalf("ожидался *model.Api, получено %T", preset)
	}
	if !strings.Contains(string(api.Endpoints), "неизвестноеПоле") {
		t.Fatalf("байты документа пересобрались по дороге: %s", api.Endpoints)
	}
	if api.Groups != nil {
		t.Fatalf("groups не задавались, ждали null: %s", api.Groups)
	}
}

func TestCreatePresetValidatesAgainstKindShape(t *testing.T) {
	s := openTestStore(t)
	resolver := New(s, limits.Default)
	ctx := ctxWithLoaders(s)

	// Вид не зарегистрирован — отказ до записи в store, а не тихий проход.
	_, err := resolver.Mutation().CreatePreset(ctx, model.PresetInput{
		Kind:  "filter",
		Label: "будущий вид tables",
		State: model.JSON(`{"name":"x"}`),
	})
	if err == nil {
		t.Fatal("ожидался отказ на незарегистрированный вид")
	}

	// State — не объект, а массив: не разбирается по форме Outfit (structural, не про смысл).
	_, err = resolver.Mutation().CreatePreset(ctx, model.PresetInput{
		Kind:  "outfit",
		Label: "кривой конверт",
		State: model.JSON(`[1,2,3]`),
	})
	if err == nil {
		t.Fatal("ожидался отказ на state не той формы")
	}
}

func TestCreatePresetRoundtrip(t *testing.T) {
	s := openTestStore(t)
	resolver := New(s, limits.Default)
	ctx := ctxWithLoaders(s)

	name := "brand"
	preset, err := resolver.Mutation().CreatePreset(ctx, model.PresetInput{
		Kind:  "palette",
		Label: "Бренд",
		Name:  &name,
		State: model.JSON(`{"name":"brand","author":"Egor Raybul"}`),
	})
	if err != nil {
		t.Fatalf("CreatePreset: %v", err)
	}
	palette, ok := preset.(*model.Palette)
	if !ok {
		t.Fatalf("ожидался *model.Palette, получено %T", preset)
	}
	if palette.ID == "" || palette.Author == nil || *palette.Author != "Egor Raybul" {
		t.Fatalf("запись не сохранилась как ожидалось: %+v", palette)
	}

	deleted, err := resolver.Mutation().DeletePreset(ctx, palette.ID)
	if err != nil || !deleted {
		t.Fatalf("DeletePreset: deleted=%v err=%v", deleted, err)
	}

	// Повторное удаление — не отказ, идемпотентно (то же, что TestDeleteThenNotFound у бывшего
	// REST-контракта, internal/api до переезда на GraphQL).
	deletedAgain, err := resolver.Mutation().DeletePreset(ctx, palette.ID)
	if err != nil || deletedAgain {
		t.Fatalf("повторный DeletePreset: deleted=%v err=%v, ожидалось false/nil", deletedAgain, err)
	}
}

// TestPresetEnvelopeValidation — та же проверка конверта, что раньше делал REST
// (TestCreateValidationErrors в internal/api до переезда на GraphQL): пустой label, длинный
// label, name не той формы — все три отсекаются normalizeInput ДО записи в store.
func TestPresetEnvelopeValidation(t *testing.T) {
	s := openTestStore(t)
	resolver := New(s, limits.Default)
	ctx := ctxWithLoaders(s)

	cases := []struct {
		name  string
		input model.PresetInput
	}{
		{
			name:  "пустой label",
			input: model.PresetInput{Kind: "palette", Label: "   ", State: model.JSON(`{"name":"x"}`)},
		},
		{
			name: "label длиннее предела",
			input: model.PresetInput{
				Kind:  "palette",
				Label: strings.Repeat("а", limits.Default.LabelChars+1),
				State: model.JSON(`{"name":"x"}`),
			},
		},
		{
			name: "name не той формы (пробел недопустим)",
			input: model.PresetInput{
				Kind:  "palette",
				Label: "Бренд",
				Name:  ptr("Bad Name"),
				State: model.JSON(`{"name":"x"}`),
			},
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if _, err := resolver.Mutation().CreatePreset(ctx, tc.input); err == nil {
				t.Fatalf("ожидался отказ на %s", tc.name)
			}
		})
	}
}

func ptr(s string) *string { return &s }

// TestCreatePresetKeepsClientSuppliedID — айди рождается у клиента ДО всякой сети
// (client-supplied-id, ROADMAP.yaml): служба обязана положить запись под ним, а не под своим,
// иначе ссылки внутри других записей начинают врать молча.
func TestCreatePresetKeepsClientSuppliedID(t *testing.T) {
	s := openTestStore(t)
	resolver := New(s, limits.Default)
	ctx := ctxWithLoaders(s)

	const given = "3f2504e0-4f89-41d3-9a0c-0305e82c3301"
	preset, err := resolver.Mutation().CreatePreset(ctx, model.PresetInput{
		ID:    ptr(given),
		Kind:  "palette",
		Label: "Бренд",
		State: model.JSON(`{"name":"brand"}`),
	})
	if err != nil {
		t.Fatalf("CreatePreset: %v", err)
	}
	palette, ok := preset.(*model.Palette)
	if !ok || palette.ID != given {
		t.Fatalf("айди клиента не сохранён: %+v", preset)
	}

	found, err := resolver.Query().Preset(ctx, given)
	if err != nil || found == nil {
		t.Fatalf("запись не читается по айди клиента: found=%v err=%v", found, err)
	}

	// Тот же айди второй раз — отказ store, а не молчаливая перезапись чужой записи.
	if _, err := resolver.Mutation().CreatePreset(ctx, model.PresetInput{
		ID:    ptr(given),
		Kind:  "outfit",
		Label: "Чужой",
		State: model.JSON(`{"name":"other","palette":"brand","forms":[]}`),
	}); err == nil {
		t.Fatal("ожидался отказ на занятый айди")
	}
}

func TestPresetIDEnvelopeValidation(t *testing.T) {
	s := openTestStore(t)
	resolver := New(s, limits.Default)
	ctx := ctxWithLoaders(s)

	// Форма айди проверяется в конверте, до похода в store.
	if _, err := resolver.Mutation().CreatePreset(ctx, model.PresetInput{
		ID:    ptr("не-uuid"),
		Kind:  "palette",
		Label: "Бренд",
		State: model.JSON(`{"name":"brand"}`),
	}); err == nil {
		t.Fatal("ожидался отказ на айди не той формы")
	}

	record := create(t, s, "palette", "brand", `{"name":"brand"}`)

	// Замена с чужим айди в конверте — отказ: два айди на одну запись молча не разъезжаются.
	if _, err := resolver.Mutation().ReplacePreset(ctx, record.ID, model.PresetInput{
		ID:    ptr("3f2504e0-4f89-41d3-9a0c-0305e82c3301"),
		Kind:  "palette",
		Label: "Бренд",
		State: model.JSON(`{"name":"brand"}`),
	}); err == nil {
		t.Fatal("ожидался отказ на чужой айди в конверте замены")
	}

	// Свой же айди в конверте замены — законно: клиент всегда шлёт запись целиком.
	if _, err := resolver.Mutation().ReplacePreset(ctx, record.ID, model.PresetInput{
		ID:    ptr(record.ID),
		Kind:  "palette",
		Label: "Бренд v2",
		State: model.JSON(`{"name":"brand"}`),
	}); err != nil {
		t.Fatalf("замена со своим же айди в конверте: %v", err)
	}
}

func TestQueryPresetByIDFoundAndNotFound(t *testing.T) {
	s := openTestStore(t)
	record := create(t, s, "palette", "brand", `{"name":"brand"}`)

	resolver := New(s, limits.Default)
	ctx := ctxWithLoaders(s)

	found, err := resolver.Query().Preset(ctx, record.ID)
	if err != nil {
		t.Fatalf("Preset: %v", err)
	}
	if palette, ok := found.(*model.Palette); !ok || palette.Name != "brand" {
		t.Fatalf("ожидалась запись brand, получено %+v", found)
	}

	// Нет такой записи — null, не отказ (nullable Preset в схеме); то же самое, что REST отдавал
	// 404 (TestGetNotFound у бывшего REST-контракта).
	missing, err := resolver.Query().Preset(ctx, "нет-такого-id")
	if err != nil {
		t.Fatalf("Preset(missing): неожиданная ошибка %v", err)
	}
	if missing != nil {
		t.Fatalf("ожидался nil на отсутствующий id, получено %+v", missing)
	}

	// id со слэшем — законное строковое значение GraphQL-переменной, не путь URL (REST боялся
	// path traversal здесь — TestIDWithSlashIsNotFoundNotPathTraversal; в GraphQL id не часть
	// пути вовсе, беспокоиться не о чем, но пусть остаётся тихим null, не паникой).
	weird, err := resolver.Query().Preset(ctx, "../etc/passwd")
	if err != nil {
		t.Fatalf("Preset(id со слэшем): неожиданная ошибка %v", err)
	}
	if weird != nil {
		t.Fatalf("ожидался nil на странный id, получено %+v", weird)
	}
}

func TestPresetsListFilteredByKindReturnsOnlyThatKind(t *testing.T) {
	s := openTestStore(t)
	create(t, s, "palette", "brand", `{"name":"brand"}`)
	create(t, s, "form", "primary", `{"name":"primary","component":"button","recipe":{}}`)

	resolver := New(s, limits.Default)
	ctx := ctxWithLoaders(s)

	form := "form"
	presets, err := resolver.Query().Presets(ctx, &form, nil, nil)
	if err != nil {
		t.Fatalf("Presets: %v", err)
	}
	if len(presets) != 1 {
		t.Fatalf("ожидалась ровно одна запись вида form, получено %d: %+v", len(presets), presets)
	}
	if _, ok := presets[0].(*model.Form); !ok {
		t.Fatalf("ожидался *model.Form, получено %T", presets[0])
	}
}

// TestPresetsFilteredByComponentMatchesAnyOfList — presets-component-filter (ROADMAP.yaml):
// OR по списку компонентов, только у видов, несущих поле component (Form/Assembly/Content).
func TestPresetsFilteredByComponentMatchesAnyOfList(t *testing.T) {
	s := openTestStore(t)
	create(t, s, "form", "button/primary", `{"name":"button/primary","component":"button","recipe":{}}`)
	create(t, s, "form", "input/primary", `{"name":"input/primary","component":"input","recipe":{}}`)
	create(t, s, "form", "table/primary", `{"name":"table/primary","component":"table","recipe":{}}`)

	resolver := New(s, limits.Default)
	ctx := ctxWithLoaders(s)

	presets, err := resolver.Query().Presets(ctx, nil, []string{"button", "input"}, nil)
	if err != nil {
		t.Fatalf("Presets: %v", err)
	}
	if len(presets) != 2 {
		t.Fatalf("ожидались формы button+input, получено %d: %+v", len(presets), presets)
	}
	seen := map[string]bool{}
	for _, p := range presets {
		form, ok := p.(*model.Form)
		if !ok {
			t.Fatalf("ожидался *model.Form, получено %T", p)
		}
		seen[form.Component] = true
	}
	if !seen["button"] || !seen["input"] {
		t.Fatalf("не оба ожидаемых компонента присутствуют: %+v", seen)
	}
}

// TestPresetsFilteredByComponentSkipsKindsWithoutComponentField — Palette/Outfit/Tag не несут
// component: при заданном фильтре они молча исключаются, это не ошибка (см. описание пункта).
func TestPresetsFilteredByComponentSkipsKindsWithoutComponentField(t *testing.T) {
	s := openTestStore(t)
	create(t, s, "palette", "brand", `{"name":"brand"}`)
	create(t, s, "form", "button/primary", `{"name":"button/primary","component":"button","recipe":{}}`)

	resolver := New(s, limits.Default)
	ctx := ctxWithLoaders(s)

	presets, err := resolver.Query().Presets(ctx, nil, []string{"button"}, nil)
	if err != nil {
		t.Fatalf("Presets: %v", err)
	}
	if len(presets) != 1 {
		t.Fatalf("ожидалась ровно одна форма (палитра без component исключена), получено %d: %+v", len(presets), presets)
	}
	if _, ok := presets[0].(*model.Form); !ok {
		t.Fatalf("ожидался *model.Form, получено %T", presets[0])
	}
}

// TestPresetsFilteredByComponentEmptyListYieldsEmptyResult — пустой []component (не nil) — это
// осознанный "ничего не подошло", не то же самое, что "фильтр не задан".
func TestPresetsFilteredByComponentEmptyListYieldsEmptyResult(t *testing.T) {
	s := openTestStore(t)
	create(t, s, "form", "button/primary", `{"name":"button/primary","component":"button","recipe":{}}`)

	resolver := New(s, limits.Default)
	ctx := ctxWithLoaders(s)

	presets, err := resolver.Query().Presets(ctx, nil, []string{}, nil)
	if err != nil {
		t.Fatalf("Presets: %v", err)
	}
	if len(presets) != 0 {
		t.Fatalf("ожидалась пустая выдача на пустой список компонентов, получено %+v", presets)
	}
}

// TestPresetsFilteredByNameMatchesAnyOfList — корневой отбор по имени (presets-by-name,
// ROADMAP.yaml): приложение знает имена своих записей, а айди у него нет вовсе.
func TestPresetsFilteredByNameMatchesAnyOfList(t *testing.T) {
	s := openTestStore(t)
	create(t, s, "palette", "brand", `{"name":"brand"}`)
	create(t, s, "outfit", "omnifield", `{"name":"omnifield","palette":"brand","forms":[]}`)
	create(t, s, "outfit", "twitter-dark", `{"name":"twitter-dark","palette":"brand","forms":[]}`)

	resolver := New(s, limits.Default)
	ctx := ctxWithLoaders(s)

	presets, err := resolver.Query().Presets(ctx, nil, nil, []string{"omnifield", "brand"})
	if err != nil {
		t.Fatalf("Presets: %v", err)
	}
	if len(presets) != 2 {
		t.Fatalf("ожидались две названные записи, получено %d: %+v", len(presets), presets)
	}
	for _, preset := range presets {
		switch p := preset.(type) {
		case *model.Outfit:
			if p.Name != "omnifield" {
				t.Errorf("в выдачу попал чужой наряд: %+v", p)
			}
		case *model.Palette:
			if p.Name != "brand" {
				t.Errorf("в выдачу попала чужая палитра: %+v", p)
			}
		default:
			t.Errorf("неожиданный тип в выдаче: %T", preset)
		}
	}
}

// TestPresetsFilteredByNameNarrowsWithKind — имя уникально В ПРЕДЕЛАХ вида, значит одно и то же
// имя законно живёт в двух видах; kind сужает выдачу до своего.
func TestPresetsFilteredByNameNarrowsWithKind(t *testing.T) {
	s := openTestStore(t)
	create(t, s, "palette", "brand", `{"name":"brand"}`)
	create(t, s, "tag", "brand", `{"name":"brand","label":"Бренд"}`)

	resolver := New(s, limits.Default)
	ctx := ctxWithLoaders(s)

	kind := "tag"
	presets, err := resolver.Query().Presets(ctx, &kind, nil, []string{"brand"})
	if err != nil {
		t.Fatalf("Presets: %v", err)
	}
	if len(presets) != 1 {
		t.Fatalf("ожидалась одна запись вида tag, получено %d: %+v", len(presets), presets)
	}
	if _, ok := presets[0].(*model.Tag); !ok {
		t.Fatalf("ожидался *model.Tag, получено %T", presets[0])
	}
}

// TestPresetsFilteredByNameSkipsUnnamedAndHonorsEmptyList — безымянную запись нечем адресовать по
// имени, поэтому в такую выдачу она не попадает; пустой список — осознанное "ничего не подошло".
func TestPresetsFilteredByNameSkipsUnnamedAndHonorsEmptyList(t *testing.T) {
	s := openTestStore(t)
	if _, err := s.Create(presetsmodel.Input{
		Label: "Безымянная",
		Kind:  "palette",
		State: json.RawMessage(`{"name":"brand"}`),
	}); err != nil {
		t.Fatalf("Create: %v", err)
	}

	resolver := New(s, limits.Default)
	ctx := ctxWithLoaders(s)

	presets, err := resolver.Query().Presets(ctx, nil, nil, []string{""})
	if err != nil {
		t.Fatalf("Presets: %v", err)
	}
	if len(presets) != 0 {
		t.Fatalf("безымянная запись не должна попадать в отбор по имени, получено %+v", presets)
	}

	presets, err = resolver.Query().Presets(ctx, nil, nil, []string{})
	if err != nil {
		t.Fatalf("Presets: %v", err)
	}
	if len(presets) != 0 {
		t.Fatalf("ожидалась пустая выдача на пустой список имён, получено %+v", presets)
	}

	// Аргумент не задан вовсе — отбора нет, безымянная запись на месте.
	presets, err = resolver.Query().Presets(ctx, nil, nil, nil)
	if err != nil || len(presets) != 1 {
		t.Fatalf("без отбора ожидалась одна запись: %d, err=%v", len(presets), err)
	}
}

func TestReplacePresetRoundtripAndNotFound(t *testing.T) {
	s := openTestStore(t)
	record := create(t, s, "palette", "brand", `{"name":"brand"}`)

	resolver := New(s, limits.Default)
	ctx := ctxWithLoaders(s)

	name := "brand"
	updated, err := resolver.Mutation().ReplacePreset(ctx, record.ID, model.PresetInput{
		Kind:  "palette",
		Label: "Бренд v2",
		Name:  &name,
		State: model.JSON(`{"name":"brand","author":"Egor Raybul"}`),
	})
	if err != nil {
		t.Fatalf("ReplacePreset: %v", err)
	}
	palette, ok := updated.(*model.Palette)
	if !ok || palette.ID != record.ID || palette.Author == nil || *palette.Author != "Egor Raybul" {
		t.Fatalf("замена не сохранила id/не применила новое state: %+v", updated)
	}

	_, err = resolver.Mutation().ReplacePreset(ctx, "нет-такого-id", model.PresetInput{
		Kind:  "palette",
		Label: "Бренд",
		State: model.JSON(`{"name":"x"}`),
	})
	if err == nil {
		t.Fatal("ожидался отказ на замену несуществующей записи")
	}
}

// TestStoreErrorSurfacesThroughResolver — конкретный проход store-ошибки (NameTakenError) через
// резолвер до вызывающего: сами лимиты уже полно проверены на уровне store (internal/store/
// store_test.go), здесь важно, что резолвер их не глотает и не подменяет.
func TestStoreErrorSurfacesThroughResolver(t *testing.T) {
	s := openTestStore(t)
	create(t, s, "palette", "brand", `{"name":"brand"}`)

	resolver := New(s, limits.Default)
	ctx := ctxWithLoaders(s)

	name := "brand"
	_, err := resolver.Mutation().CreatePreset(ctx, model.PresetInput{
		Kind:  "palette",
		Label: "Другой бренд",
		Name:  &name,
		State: model.JSON(`{"name":"brand"}`),
	})
	if err == nil {
		t.Fatal("ожидался отказ на занятое имя (NameTakenError из store)")
	}
}
