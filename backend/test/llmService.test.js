process.env.GROQ_API_KEY = "dummy-test-key";

import { parseJsonResponse } from "../services/llmservice.js";

describe("parseJsonResponse", () => {
  test("parses clean JSON correctly", () => {
    const result = parseJsonResponse('{"score": 72, "name": "test"}');
    expect(result.score).toBe(72);
    expect(result.name).toBe("test");
  });

  test("strips ```json code fences", () => {
    const result = parseJsonResponse('```json\n{"score": 72}\n```');
    expect(result.score).toBe(72);
  });

  test("strips ``` code fences", () => {
    const result = parseJsonResponse('```\n{"score": 72}\n```');
    expect(result.score).toBe(72);
  });

  test("handles nested JSON objects", () => {
    const result = parseJsonResponse('{"data": {"nested": true}, "count": 5}');
    expect(result.data.nested).toBe(true);
    expect(result.count).toBe(5);
  });

  test("handles JSON arrays", () => {
    const result = parseJsonResponse('{"items": ["a", "b", "c"]}');
    expect(result.items).toHaveLength(3);
  });

  test("throws on invalid JSON", () => {
    expect(() => parseJsonResponse("not json at all")).toThrow();
  });

  test("throws on empty string", () => {
    expect(() => parseJsonResponse("")).toThrow();
  });

  test("handles JSON with extra whitespace", () => {
    const result = parseJsonResponse('  \n  {"score": 99}  \n  ');
    expect(result.score).toBe(99);
  });
});