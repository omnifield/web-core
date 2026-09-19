import { describe, expect, it } from "vitest";

import { endpointOf, type EndpointDescriptor } from "../../../src/entities/openapi";

function descriptor(patch: Partial<EndpointDescriptor> = {}): EndpointDescriptor {
  return {
    method: "GET",
    url: "https://back/users",
    params: [],
    ...patch,
  };
}

describe("endpointOf", () => {
  it("обязательный параметр остаётся обязательным в форме", () => {
    const endpoint = endpointOf(
      descriptor({
        params: [{ name: "limit", in: "query", required: true, schema: { type: "string" } }],
      }),
    );

    expect(endpoint.schema.safeParse({}).success).toBe(false);
    expect(endpoint.schema.safeParse({ limit: "10" }).success).toBe(true);
  });

  it("необязательный параметр можно не заполнять", () => {
    const endpoint = endpointOf(
      descriptor({
        params: [{ name: "limit", in: "query", required: false, schema: { type: "number" } }],
      }),
    );

    expect(endpoint.schema.safeParse({}).success).toBe(true);
    expect(endpoint.schema.safeParse({ limit: "не число" }).success).toBe(false);
  });

  it("параметр `in: body` ложится в форму под именем body, а не под своим", () => {
    const endpoint = endpointOf(
      descriptor({
        method: "POST",
        params: [
          {
            name: "payload",
            in: "body",
            required: true,
            schema: { type: "object", properties: { id: { type: "number" } }, required: ["id"] },
          },
        ],
      }),
    );

    expect(endpoint.schema.safeParse({ body: { id: 1 } }).success).toBe(true);
    expect(endpoint.schema.safeParse({ payload: { id: 1 } }).success).toBe(false);
  });

  it("ссылка на общий тип разворачивается по `defs`", () => {
    const endpoint = endpointOf(
      descriptor({
        params: [
          { name: "pet", in: "body", required: true, schema: { $ref: "#/definitions/Pet" } },
        ],
      }),
      { Pet: { type: "object", properties: { name: { type: "string" } }, required: ["name"] } },
    );

    expect(endpoint.schema.safeParse({ body: { name: "Шарик" } }).success).toBe(true);
    expect(endpoint.schema.safeParse({ body: {} }).success).toBe(false);
  });

  it("метод, адрес и тег переносятся как есть", () => {
    const endpoint = endpointOf(descriptor({ method: "DELETE", tag: "pet" }));

    expect(endpoint.method).toBe("DELETE");
    expect(endpoint.url).toBe("https://back/users");
    expect(endpoint.tag).toBe("pet");
  });
});
