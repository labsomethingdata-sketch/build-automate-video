import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("une las clases truthy y omite las falsy", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("devuelve string vacío sin argumentos", () => {
    expect(cn()).toBe("");
  });
});
