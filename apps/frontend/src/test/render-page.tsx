import type { ReactNode } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach } from "vite-plus/test";

type PageWrapper = (children: ReactNode) => ReactNode;

let root: Root | null = null;

afterEach(() => {
  root?.unmount();
  root = null;
  document.body.innerHTML = "";
});

interface RenderPageOptions {
  wrappers?: PageWrapper[];
}

export async function renderPage(element: ReactNode, options: RenderPageOptions = {}) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  // Apply wrappers from right to left so [withA, withB] becomes withA(withB(element)).
  const content = (options.wrappers ?? []).reduceRight(
    (children, wrapper) => wrapper(children),
    element,
  );

  await act(async () => {
    root = createRoot(container);
    root.render(content);
  });

  return container;
}
