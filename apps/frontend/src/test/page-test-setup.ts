import { createElement, type ReactNode } from "react";
import { vi } from "vite-plus/test";

vi.mock("@tanstack/react-router", async () => {
  const actual =
    await vi.importActual<typeof import("@tanstack/react-router")>("@tanstack/react-router");

  return {
    ...actual,
    Link: ({ children }: { children: ReactNode }) => createElement("span", null, children),
    useNavigate: () => vi.fn(),
  };
});
