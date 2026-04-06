import {
  createRootRoute,
  createRoute,
  createRouter,
  createHashHistory,
  Outlet,
} from "@tanstack/react-router";
import { PatientStoreProvider } from "@/lib/patient-store";
import { ThemeProvider } from "@/components/theme-provider";
import { lazy, Suspense } from "react";

const HomePage = lazy(() => import("@/pages/home"));
const SessionPage = lazy(() => import("@/pages/session"));

const rootRoute = createRootRoute({
  component: () => (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <PatientStoreProvider>
        <Suspense>
          <Outlet />
        </Suspense>
      </PatientStoreProvider>
    </ThemeProvider>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const sessionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/clients/$clientId/sessions/$sessionId",
  component: SessionPage,
});

const routeTree = rootRoute.addChildren([indexRoute, sessionRoute]);

const hashHistory = createHashHistory();
export const router = createRouter({ routeTree, history: hashHistory });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
