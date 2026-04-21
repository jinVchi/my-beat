import { createAuthClient } from "better-auth/react";

const baseURL =
  import.meta.env.VITE_BETTER_AUTH_URL ??
  (typeof window !== "undefined"
    ? `${window.location.origin}/api/auth`
    : "http://localhost:3001/api/auth");

export const authClient: ReturnType<typeof createAuthClient> = createAuthClient({
  baseURL,
});

export const { signIn, signUp, signOut, useSession } = authClient;
