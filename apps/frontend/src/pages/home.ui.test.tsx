// @vitest-environment jsdom
import HomePage from "@/pages/home";
import { expect, test } from "vite-plus/test";
import { renderPage } from "@/test/render-page";
import { withPatientStore } from "@/test/page-wrappers";

test("home page renders the patient list", async () => {
  const container = await renderPage(<HomePage />, { wrappers: [withPatientStore] });

  expect(container.textContent).toContain("Pacientes");
  expect(container.textContent).toContain("Elena Vance");
  expect(container.textContent).toContain("Marcus Thorne");
});
