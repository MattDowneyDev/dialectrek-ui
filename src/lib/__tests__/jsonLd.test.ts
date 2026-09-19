import { describe, expect, test } from "vitest";
import { jsonLdScript } from "../jsonLd";

describe("jsonLdScript", () => {
  test("serializes plain data as JSON", () => {
    expect(jsonLdScript({ a: 1, b: "two" })).toBe('{"a":1,"b":"two"}');
  });

  test("escapes '<' so an embedded '</script>' can't close the tag early", () => {
    const result = jsonLdScript({ text: "</script><script>alert(1)</script>" });
    expect(result).not.toContain("<");
    expect(result).toBe('{"text":"\\u003c/script>\\u003cscript>alert(1)\\u003c/script>"}');
  });
});
