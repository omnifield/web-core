package graphql

// wantedSet — общая форма необязательного отбора списком (component, name): nil, если аргумент не
// задан вовсе, — это НЕ то же самое, что пустой присланный список (осознанное «ничего не
// подошло»). См. FAQ.md, «Почему `component`-фильтр — в резолвере, а не в `store.List`».
func wantedSet(values []string) map[string]bool {
	if values == nil {
		return nil
	}
	set := make(map[string]bool, len(values))
	for _, value := range values {
		set[value] = true
	}
	return set
}
