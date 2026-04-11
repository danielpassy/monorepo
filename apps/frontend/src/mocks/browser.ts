import { setupWorker } from "msw/browser";
import { authHandlers } from "./auth";
import { clientHandlers } from "./clients";
import { sessionHandlers } from "./sessions";

export const worker = setupWorker(...authHandlers, ...clientHandlers, ...sessionHandlers);
