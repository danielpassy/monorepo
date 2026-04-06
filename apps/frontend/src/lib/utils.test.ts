import { expect, test } from "vite-plus/test";
import { cn } from "./utils";

test("cn merges class names", () => {
  expect(cn("a", "b")).toBe("a b");
});
