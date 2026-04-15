import { expect, test } from "vite-plus/test";
import { getClientInitials } from "./home.logic";

test("home logic extracts initials from full name", () => {
  expect(getClientInitials("Elena Vance")).toBe("EV");
});

test("home logic handles a single-word client name", () => {
  expect(getClientInitials("Madonna")).toBe("M");
});

test("home logic extracts initials from three-word name", () => {
  expect(getClientInitials("Ana Paula Silva")).toBe("APS");
});
