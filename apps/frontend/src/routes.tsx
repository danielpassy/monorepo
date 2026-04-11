import {
  createRootRoute,
  createRoute,
  createRouter,
  createHashHistory,
  Outlet,
} from "@tanstack/react-router";
import { ThemeProvider } from "@/components/theme-provider";
import { RouteGuard } from "@/components/route-guard";
import { lazy, Suspense } from "react";

const HomePage = lazy(() => import("@/pages/home"));
const SessionPage = lazy(() => import("@/pages/session"));
const LoginPage = lazy(() => import("@/pages/login"));

const rootRoute = createRootRoute({
  component: () => (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Suspense>
        <Outlet />
      </Suspense>
    </ThemeProvider>
  ),
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <RouteGuard>
      <HomePage />
    </RouteGuard>
  ),
});

const sessionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/clients/$clientId/sessions/$sessionId",
  component: () => (
    <RouteGuard>
      <SessionPage />
    </RouteGuard>
  ),
});

const routeTree = rootRoute.addChildren([loginRoute, indexRoute, sessionRoute]);

const hashHistory = createHashHistory();
export const router = createRouter({ routeTree, history: hashHistory });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
