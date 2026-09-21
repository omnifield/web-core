import { RenderTree } from "@web-core/assembly/render";
import { scaleBand, scaleLinear } from "d3-scale";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { kitComponentRenderer } from "../../component-registry.jsx";
import {
  DiagramArea,
  DiagramAxis,
  DiagramBar,
  DiagramGrid,
  DiagramLine,
  DiagramPoint,
  DiagramRoot,
  isBandScale,
} from "../components/index.js";
import type { Data } from "../entity/io.js";

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

/** Настоящий путь потребителя: витрина зовёт `instanceOf(component, rootProps, assembly, data)`. */
function mount(data: Data, assembly = "line"): HTMLElement {
  const { registry, instanceOf } = kitComponentRenderer();
  const host = document.createElement("div");
  document.body.append(host);

  dispose = render(
    () => <RenderTree registry={registry} tree={instanceOf("diagram", {}, assembly, data)} data={data} />,
    host,
  );

  return host;
}

/** Между двумя показами в одном сценарии — снять предыдущий, иначе в DOM окажутся оба. */
function remount(data: Data, assembly: string): HTMLElement {
  dispose?.();
  document.body.innerHTML = "";
  return mount(data, assembly);
}

describe("форму задаёт сборка, данные — только что показывать", () => {
  const rows = [
    { day: 0, temperature: 12 },
    { day: 1, temperature: 15 },
    { day: 2, temperature: 14 },
    { day: 3, temperature: 18 },
  ];
  const data: Data = { data: rows, series: [{ x: "day", y: "temperature" }] };

  it("одни и те же данные рисуются линией, областью, точками и столбцами", () => {
    const asLine = mount(data, "line");
    expect(asLine.querySelector('[data-part="line"]')?.getAttribute("d")).toMatch(/^M/);
    expect(asLine.querySelector('[data-part="area"]')).toBeNull();

    const asArea = remount(data, "area");
    expect(asArea.querySelector('[data-part="area"]')?.getAttribute("d")).toMatch(/Z$/);
    expect(asArea.querySelector('[data-part="line"]')).toBeNull();

    const asPoint = remount(data, "point");
    expect(asPoint.querySelectorAll('[data-part="point"] circle')).toHaveLength(4);

    const asBar = remount(data, "bar");
    expect(asBar.querySelectorAll('[data-part="bar"] rect')).toHaveLength(4);
  });

  it("несколько серий одних данных рисуются одной формой, каждая своим узлом", () => {
    const host = mount(
      {
        data: [
          { day: 0, temperature: 12, humidity: 40 },
          { day: 1, temperature: 15, humidity: 55 },
        ],
        series: [
          { x: "day", y: "temperature", label: "Температура" },
          { x: "day", y: "humidity", label: "Влажность" },
        ],
      },
      "line",
    );

    expect(host.querySelectorAll('[data-part="line"]')).toHaveLength(2);
  });

  it("сборка столбцов сама берёт категориальную шкалу и подписывает деления", () => {
    const host = mount(
      {
        data: [
          { quarter: "Q1", revenue: 120 },
          { quarter: "Q2", revenue: 190 },
          { quarter: "Q3", revenue: 90 },
        ],
        series: [{ x: "quarter", y: "revenue" }],
      },
      "bar",
    );

    expect(host.querySelectorAll('[data-part="bar"] rect')).toHaveLength(3);

    const xAxis = host.querySelector('[data-part="axis"][data-orientation="x"]')!;
    expect([...xAxis.querySelectorAll("text")].map((node) => node.textContent)).toEqual(["Q1", "Q2", "Q3"]);
  });

  it("категориальные данные рисуются любой формой — точка встаёт в центр своей полосы", () => {
    const categorical: Data = {
      data: [
        { quarter: "Q1", revenue: 120 },
        { quarter: "Q2", revenue: 190 },
      ],
      series: [{ x: "quarter", y: "revenue" }],
    };

    const asBar = mount(categorical, "bar");
    expect(asBar.querySelectorAll('[data-part="bar"] rect')).toHaveLength(2);

    const asPoint = remount(categorical, "point");
    const circles = [...asPoint.querySelectorAll('[data-part="point"] circle')];
    expect(circles).toHaveLength(2);

    const bandLabels = [...asPoint.querySelectorAll('[data-part="axis"][data-orientation="x"] text')];
    const labelAt = (index: number) =>
      Number(bandLabels[index]?.parentElement?.getAttribute("transform")?.match(/translate\(([\d.]+)/)?.[1]);
    expect(Number(circles[0]?.getAttribute("cx"))).toBeCloseTo(labelAt(0), 5);
    expect(Number(circles[1]?.getAttribute("cx"))).toBeCloseTo(labelAt(1), 5);

    const asLine = remount(categorical, "line");
    expect(asLine.querySelector('[data-part="line"]')?.getAttribute("d")).toMatch(/^M[\d.]+,[\d.]+L/);
  });

  it("сборка bar-horizontal кладёт категории на вертикаль, значения на горизонталь", () => {
    const categorical: Data = {
      data: [
        { quarter: "Q1", revenue: 120 },
        { quarter: "Q2", revenue: 190 },
      ],
      series: [{ x: "quarter", y: "revenue" }],
    };

    const host = mount(categorical, "bar-horizontal");
    const rects = [...host.querySelectorAll('[data-part="bar"] rect')];
    expect(rects).toHaveLength(2);

    // столбцы стоят друг под другом, а не рядом, и начинаются от левого края области построения
    expect(Number(rects[0]?.getAttribute("y"))).toBeLessThan(Number(rects[1]?.getAttribute("y")));
    expect(Number(rects[0]?.getAttribute("x"))).toBe(Number(rects[1]?.getAttribute("x")));
    expect(Number(rects[1]?.getAttribute("width"))).toBeGreaterThan(Number(rects[0]?.getAttribute("width")));

    const yAxis = host.querySelector('[data-part="axis"][data-orientation="y"]')!;
    expect([...yAxis.querySelectorAll("text")].map((node) => node.textContent)).toEqual(["Q1", "Q2"]);
  });

  it("сборка pie рисует по сектору на запись и не заводит ни осей, ни сетки", () => {
    const host = mount(
      {
        data: [
          { quarter: "Q1", revenue: 120 },
          { quarter: "Q2", revenue: 190 },
          { quarter: "Q3", revenue: 90 },
        ],
        series: [{ x: "quarter", y: "revenue" }],
      },
      "pie",
    );

    const arc = host.querySelector('[data-scope="diagram"][data-part="arc"]')!;
    expect(arc.querySelectorAll("path")).toHaveLength(3);
    expect(arc.getAttribute("transform")).toMatch(/^translate\(/);

    expect(host.querySelectorAll('[data-part="axis"]')).toHaveLength(0);
    expect(host.querySelectorAll('[data-part="grid"]')).toHaveLength(0);
  });

  it("сборка donut — тот же круг с дыркой: сектор рисуется кольцом, а не от центра", () => {
    const data: Data = {
      data: [
        { quarter: "Q1", revenue: 120 },
        { quarter: "Q2", revenue: 190 },
      ],
      series: [{ x: "quarter", y: "revenue" }],
    };

    const solid = mount(data, "pie");
    const solidPath = solid.querySelector('[data-part="arc"] path')?.getAttribute("d") ?? "";

    const ring = remount(data, "donut");
    const ringPath = ring.querySelector('[data-part="arc"] path')?.getAttribute("d") ?? "";

    // у сплошного сектора путь идёт в центр (L0,0), у кольца — по внутренней дуге
    expect(solidPath).toContain("L0,0");
    expect(ringPath).not.toContain("L0,0");
    expect(ringPath.length).toBeGreaterThan(0);
  });

  it("оси выводит из серий, а явное описание оси их уточняет", () => {
    const both = mount(data, "line");
    expect(both.querySelectorAll('[data-part="axis"]')).toHaveLength(2);

    const onlyX = remount({ ...data, axes: [{ orientation: "y", hidden: true }] }, "line");
    const axes = [...onlyX.querySelectorAll('[data-part="axis"]')];
    expect(axes).toHaveLength(1);
    expect(axes[0]?.getAttribute("data-orientation")).toBe("x");
  });

  it("поле под подписи — дефолт, пока данные не скажут иначе", () => {
    const byDefault = mount(data, "line");
    expect(byDefault.querySelector('[data-part="axis"][data-orientation="y"] line')?.getAttribute("x1")).toBe("44");

    const widened = remount({ ...data, insets: { left: 80 } }, "line");
    expect(widened.querySelector('[data-part="axis"][data-orientation="y"] line')?.getAttribute("x1")).toBe("80");
  });

  it("без пропов размера не прибивает width/height — размер остаётся за рецептом", () => {
    const host = mount(data, "line");
    const svg = host.querySelector('[data-scope="diagram"][data-part="root"]')!;

    expect(svg.hasAttribute("width")).toBe(false);
    expect(svg.hasAttribute("height")).toBe(false);
    expect(svg.getAttribute("viewBox")).toBe("0 0 360 240");
  });

  it("без единой серии остаётся голым корнем — ни осей, ни сетки", () => {
    const host = mount({ data: [], series: [] }, "line");

    expect(host.querySelector('[data-scope="diagram"][data-part="root"]')).not.toBeNull();
    expect(host.querySelectorAll('[data-part="axis"]')).toHaveLength(0);
    expect(host.querySelectorAll('[data-part="grid"]')).toHaveLength(0);
  });
});

describe("цвет приходит в данных — компонент своего не назначает", () => {
  const rows = [
    { day: 0, temperature: 12, tone: "var(--danger-9)" },
    { day: 1, temperature: 15, tone: "var(--success-9)" },
  ];

  it("цвет серии ложится на её часть, какой бы формой её ни нарисовали", () => {
    const asLine = mount({ data: rows, series: [{ x: "day", y: "temperature", color: "var(--accent-11)" }] }, "line");
    expect(asLine.querySelector('[data-part="line"]')?.getAttribute("style")).toContain("var(--accent-11)");

    const asArea = remount(
      { data: rows, series: [{ x: "day", y: "temperature", color: "var(--accent-9)" }] },
      "area",
    );
    expect(asArea.querySelector('[data-part="area"]')?.getAttribute("style")).toContain("var(--accent-9)");
  });

  it("цвет отдельной точки берётся из названного поля строки", () => {
    const host = mount({ data: rows, series: [{ x: "day", y: "temperature", colorField: "tone" }] }, "point");

    const circles = [...host.querySelectorAll('[data-part="point"] circle')];
    expect(circles[0]?.getAttribute("style")).toContain("var(--danger-9)");
    expect(circles[1]?.getAttribute("style")).toContain("var(--success-9)");
  });

  it("цвета в данных нет — часть не несёт своего цвета вовсе, красит рецепт", () => {
    const host = mount({ data: rows, series: [{ x: "day", y: "temperature" }] }, "line");

    expect(host.querySelector('[data-part="line"]')?.getAttribute("style")).toBeNull();
  });
});

describe("DiagramRoot — рукописный путь через рендер-проп", () => {
  it("отдаёт посчитанные шкалы, и серия по ним встаёт туда же, куда встала бы сама", () => {
    const rows = [
      { at: 0, value: 0 },
      { at: 1, value: 10 },
    ];

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <DiagramRoot
          width={100}
          height={100}
          data={rows}
          series={[{ x: "at", y: "value" }]}
          insets={{ top: 0, right: 0, bottom: 0, left: 0 }}
        >
          {(frame) =>
            isBandScale(frame.xScale) || isBandScale(frame.yScale) ? undefined : (
              <DiagramLine
                data={rows}
                xScale={frame.xScale}
                yScale={frame.yScale}
                x={(row) => row.at}
                y={(row) => row.value}
              />
            )
          }
        </DiagramRoot>
      ),
      host,
    );

    const line = host.querySelector('[data-scope="diagram"][data-part="line"]')!;
    expect(line.getAttribute("d")).toBe("M0,100L100,0");
  });
});

describe("DiagramLine — direct mount", () => {
  it("draws one M plus one L per remaining point, positioned through xScale/yScale", () => {
    const data = [
      { at: 0, value: 0 },
      { at: 1, value: 10 },
      { at: 2, value: 5 },
    ];
    const xScale = scaleLinear().domain([0, 2]).range([0, 100]);
    const yScale = scaleLinear().domain([0, 10]).range([100, 0]);

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <DiagramRoot width={200} height={100}>
          <DiagramLine data={data} xScale={xScale} yScale={yScale} x={(d) => d.at} y={(d) => d.value} />
        </DiagramRoot>
      ),
      host,
    );

    const path = host.querySelector('[data-scope="diagram"][data-part="line"]')!;
    expect(path.getAttribute("d")).toBe("M0,100L50,0L100,50");
  });

  it("without data draws a real, addressable path with no d attribute", () => {
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <DiagramRoot width={200} height={100}>
          <DiagramLine<{ at: number; value: number }> x={(d) => d.at} y={(d) => d.value} />
        </DiagramRoot>
      ),
      host,
    );

    const path = host.querySelector('[data-scope="diagram"][data-part="line"]')!;
    expect(path).not.toBeNull();
    expect(path.hasAttribute("d")).toBe(false);
  });
});

describe("DiagramArea — direct mount", () => {
  it("fills from the value down to the yScale's baseline (range()[0])", () => {
    const data = [
      { at: 0, value: 0 },
      { at: 1, value: 10 },
      { at: 2, value: 5 },
    ];
    const xScale = scaleLinear().domain([0, 2]).range([0, 100]);
    const yScale = scaleLinear().domain([0, 10]).range([100, 0]);

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <DiagramRoot width={200} height={100}>
          <DiagramArea data={data} xScale={xScale} yScale={yScale} x={(d) => d.at} y={(d) => d.value} />
        </DiagramRoot>
      ),
      host,
    );

    const path = host.querySelector('[data-scope="diagram"][data-part="area"]')!;
    expect(path.getAttribute("d")).toBe("M0,100L50,0L100,50L100,100L50,100L0,100Z");
  });

  it("without data draws a real, addressable path with no d attribute", () => {
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <DiagramRoot width={200} height={100}>
          <DiagramArea<{ at: number; value: number }> x={(d) => d.at} y={(d) => d.value} />
        </DiagramRoot>
      ),
      host,
    );

    const path = host.querySelector('[data-scope="diagram"][data-part="area"]')!;
    expect(path).not.toBeNull();
    expect(path.hasAttribute("d")).toBe(false);
  });
});

describe("DiagramBar — direct mount", () => {
  it("positions and sizes each rect from the band scale's own bandwidth/step", () => {
    const data = [
      { category: "A", value: 5 },
      { category: "B", value: 10 },
    ];
    const categoryScale = scaleBand<string>().domain(["A", "B"]).range([0, 100]).padding(0);
    const valueScale = scaleLinear().domain([0, 10]).range([100, 0]);

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <DiagramRoot width={200} height={100}>
          <DiagramBar
            data={data}
            categoryScale={categoryScale}
            valueScale={valueScale}
            category={(d) => d.category}
            value={(d) => d.value}
          />
        </DiagramRoot>
      ),
      host,
    );

    const rects = [...host.querySelectorAll('[data-scope="diagram"][data-part="bar"] rect')];
    expect(rects).toHaveLength(2);
    expect(rects[0]?.getAttribute("x")).toBe("0");
    expect(rects[0]?.getAttribute("y")).toBe("50");
    expect(rects[0]?.getAttribute("width")).toBe("50");
    expect(rects[0]?.getAttribute("height")).toBe("50");
    expect(rects[1]?.getAttribute("x")).toBe("50");
    expect(rects[1]?.getAttribute("y")).toBe("0");
    expect(rects[1]?.getAttribute("height")).toBe("100");
  });

  it("горизонтальные столбцы растут вбок: полоса задаёт высоту, значение — ширину", () => {
    const data = [
      { category: "A", value: 5 },
      { category: "B", value: 10 },
    ];
    const categoryScale = scaleBand<string>().domain(["A", "B"]).range([0, 100]).padding(0);
    const valueScale = scaleLinear().domain([0, 10]).range([0, 100]);

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <DiagramRoot width={200} height={100}>
          <DiagramBar
            data={data}
            categoryScale={categoryScale}
            valueScale={valueScale}
            category={(d) => d.category}
            value={(d) => d.value}
            orientation="horizontal"
          />
        </DiagramRoot>
      ),
      host,
    );

    const rects = [...host.querySelectorAll('[data-scope="diagram"][data-part="bar"] rect')];
    expect(rects).toHaveLength(2);
    expect(rects[0]?.getAttribute("x")).toBe("0");
    expect(rects[0]?.getAttribute("y")).toBe("0");
    expect(rects[0]?.getAttribute("width")).toBe("50");
    expect(rects[0]?.getAttribute("height")).toBe("50");
    expect(rects[1]?.getAttribute("y")).toBe("50");
    expect(rects[1]?.getAttribute("width")).toBe("100");
  });

  it("without data draws a real, addressable, but empty node", () => {
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <DiagramRoot width={200} height={100}>
          <DiagramBar<{ category: string; value: number }>
            category={(d) => d.category}
            value={(d) => d.value}
          />
        </DiagramRoot>
      ),
      host,
    );

    const bar = host.querySelector('[data-scope="diagram"][data-part="bar"]')!;
    expect(bar).not.toBeNull();
    expect(bar.querySelectorAll("rect")).toHaveLength(0);
  });
});

describe("DiagramPoint — direct mount", () => {
  it("positions each circle through xScale/yScale, default radius 3", () => {
    const data = [
      { at: 0, value: 0 },
      { at: 1, value: 10 },
      { at: 2, value: 5 },
    ];
    const xScale = scaleLinear().domain([0, 2]).range([0, 100]);
    const yScale = scaleLinear().domain([0, 10]).range([100, 0]);

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <DiagramRoot width={200} height={100}>
          <DiagramPoint data={data} xScale={xScale} yScale={yScale} x={(d) => d.at} y={(d) => d.value} />
        </DiagramRoot>
      ),
      host,
    );

    const circles = [...host.querySelectorAll('[data-scope="diagram"][data-part="point"] circle')];
    expect(circles).toHaveLength(3);
    expect(circles[0]?.getAttribute("cx")).toBe("0");
    expect(circles[0]?.getAttribute("cy")).toBe("100");
    expect(circles[1]?.getAttribute("cx")).toBe("50");
    expect(circles[1]?.getAttribute("cy")).toBe("0");
    expect(circles.every((circle) => circle.getAttribute("r") === "3")).toBe(true);
  });

  it("without data draws a real, addressable, but empty node", () => {
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <DiagramRoot width={200} height={100}>
          <DiagramPoint<{ at: number; value: number }> x={(d) => d.at} y={(d) => d.value} />
        </DiagramRoot>
      ),
      host,
    );

    const point = host.querySelector('[data-scope="diagram"][data-part="point"]')!;
    expect(point).not.toBeNull();
    expect(point.querySelectorAll("circle")).toHaveLength(0);
  });
});

describe("DiagramGrid — direct mount", () => {
  it("draws one line per tick, spanning the cross axis's from/to", () => {
    const scale = scaleLinear().domain([0, 10]).range([0, 100]);
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <DiagramRoot width={200} height={100}>
          <DiagramGrid scale={scale} orientation="x" ticks={5} from={0} to={80} />
        </DiagramRoot>
      ),
      host,
    );

    const grid = host.querySelector('[data-scope="diagram"][data-part="grid"]')!;
    const lines = [...grid.querySelectorAll("line")];
    expect(lines).toHaveLength(scale.ticks(5).length);
    expect(lines[0]?.getAttribute("y1")).toBe("0");
    expect(lines[0]?.getAttribute("y2")).toBe("80");
  });

  it("without a scale draws a real, addressable, but empty node", () => {
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <DiagramRoot width={200} height={100}><DiagramGrid orientation="y" /></DiagramRoot>, host);

    const grid = host.querySelector('[data-scope="diagram"][data-part="grid"]')!;
    expect(grid).not.toBeNull();
    expect(grid.querySelectorAll("line")).toHaveLength(0);
  });
});

describe("DiagramAxis — direct mount", () => {
  it("draws a domain line plus one tick per requested value", () => {
    const scale = scaleLinear().domain([0, 10]).range([0, 100]);
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <DiagramRoot width={200} height={100}>
          <DiagramAxis scale={scale} orientation="x" ticks={5} offset={80} />
        </DiagramRoot>
      ),
      host,
    );

    const axis = host.querySelector('[data-scope="diagram"][data-part="axis"]')!;
    expect(axis.querySelectorAll("line").length).toBe(1 + scale.ticks(5).length);
    expect(axis.querySelectorAll("text").length).toBe(scale.ticks(5).length);
  });

  it("without a scale draws a real, addressable, but empty node", () => {
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <DiagramRoot width={200} height={100}><DiagramAxis orientation="y" /></DiagramRoot>, host);

    const axis = host.querySelector('[data-scope="diagram"][data-part="axis"]')!;
    expect(axis).not.toBeNull();
    expect(axis.querySelectorAll("line, text")).toHaveLength(0);
  });
});

describe("DiagramRoot", () => {
  it("sizes the svg and its viewBox from width/height", () => {
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <DiagramRoot width={320} height={180} />, host);

    const svg = host.querySelector('[data-scope="diagram"][data-part="root"]')!;
    expect(svg.getAttribute("width")).toBe("320");
    expect(svg.getAttribute("height")).toBe("180");
    expect(svg.getAttribute("viewBox")).toBe("0 0 320 180");
  });
});
