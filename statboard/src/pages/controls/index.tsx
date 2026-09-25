import { createSignal } from "@web-core/solid";
import {
  Checkbox,
  CheckboxControl,
  CheckboxIndicator,
  CheckboxLabel,
  Flow,
  SegmentGroup,
  SegmentGroupIndicator,
  SegmentGroupItem,
  SegmentGroupItemControl,
  SegmentGroupItemText,
  SegmentGroupLabel,
  Slider,
  SliderControl,
  SliderHiddenInput,
  SliderLabel,
  SliderRange,
  SliderThumb,
  SliderTrack,
  Surface,
  Switch,
  SwitchControl,
  SwitchLabel,
  SwitchThumb,
  Typography,
} from "@web-core/ui";

export function Controls() {
  const [threshold, setThreshold] = createSignal(40);
  const [live, setLive] = createSignal(true);
  const [compact, setCompact] = createSignal(false);
  const [range, setRange] = createSignal("week");

  const summary = () =>
    [
      `порог ${threshold()}%`,
      live() ? "обновление живое" : "обновление вручную",
      compact() ? "плотная раскладка" : "обычная раскладка",
      `период: ${range()}`,
    ].join(" · ");

  return (
    <Surface data-variant="filled">
      <Flow data-variant="column">
        <Typography as="h1" data-variant="display">
          Настройки доски
        </Typography>
        <Typography data-variant="body">
          Четыре интерактивных компонента кита, связанных одним состоянием: что
          крутите — сразу видно в строке внизу.
        </Typography>

        <Slider
          data-variant="solid"
          value={[threshold()]}
          onValueChange={(details) => setThreshold(details.value[0] ?? 0)}
        >
          <SliderLabel>Порог тревоги</SliderLabel>
          <SliderControl>
            <SliderTrack>
              <SliderRange />
            </SliderTrack>
            <SliderThumb index={0}>
              <SliderHiddenInput />
            </SliderThumb>
          </SliderControl>
        </Slider>

        <Switch
          checked={live()}
          onCheckedChange={(details) => setLive(details.checked)}
        >
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
          <SwitchLabel>Обновлять живьём</SwitchLabel>
        </Switch>

        <Checkbox
          data-variant="solid"
          checked={compact()}
          onCheckedChange={(details) => setCompact(details.checked === true)}
        >
          <CheckboxControl>
            <CheckboxIndicator>✓</CheckboxIndicator>
          </CheckboxControl>
          <CheckboxLabel>Плотная раскладка</CheckboxLabel>
        </Checkbox>

        <SegmentGroup
          data-variant="pill"
          value={range()}
          onValueChange={(details) => setRange(details.value ?? "week")}
        >
          <SegmentGroupLabel>Период</SegmentGroupLabel>
          <SegmentGroupIndicator />

          <SegmentGroupItem value="day">
            <SegmentGroupItemControl />
            <SegmentGroupItemText>День</SegmentGroupItemText>
          </SegmentGroupItem>

          <SegmentGroupItem value="week">
            <SegmentGroupItemControl />
            <SegmentGroupItemText>Неделя</SegmentGroupItemText>
          </SegmentGroupItem>

          <SegmentGroupItem value="month">
            <SegmentGroupItemControl />
            <SegmentGroupItemText>Месяц</SegmentGroupItemText>
          </SegmentGroupItem>
        </SegmentGroup>

        <Typography data-variant="caption">{summary()}</Typography>
      </Flow>
    </Surface>
  );
}
