import { setupWorker } from "msw/browser";
import { authHandlers } from "./auth";
import { customerHandlers } from "./customers";
import { sessionHandlers } from "./sessions";

export const worker = setupWorker(...authHandlers, ...customerHandlers, ...sessionHandlers);
