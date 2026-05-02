import type { IncomingHttpHeaders } from "node:http";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth.js";

export type RequestWithHeaders = {
  headers: IncomingHttpHeaders;
};

export type StatusResponse = {
  status: (code: number) => StatusResponse;
};

export async function getSessionFromRequest(req: RequestWithHeaders) {
  return auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
}
