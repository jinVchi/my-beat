import { auth } from "@/lib/auth";
import type { NextApiRequest, NextApiResponse } from "next";
import { toNodeHandler } from "better-auth/node";

const handler = toNodeHandler(auth);

export default async function authHandler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  return handler(req, res);
}
