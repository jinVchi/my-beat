import { useState } from "react";
import { signIn, signUp } from "@/lib/auth-client";
import { useDocumentTitle } from "@/lib/use-document-title";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useDocumentTitle(`${isSignUp ? "Sign Up" : "Sign In"} — Beat'em Up`);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        const result = await signUp.email({ name, email, password });
        if (result.error) {
          setError(result.error.message ?? "Sign up failed");
          setLoading(false);
          return;
        }
      } else {
        const result = await signIn.email({ email, password });
        if (result.error) {
          setError(result.error.message ?? "Sign in failed");
          setLoading(false);
          return;
        }
      }
      // Full page navigation so useSession() on the destination starts
      // with a fresh server fetch instead of stale client-side cache.
      window.location.href = "/select-region";
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="bg-card rounded-xl p-10 w-full max-w-[400px] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <h1 className="text-accent text-3xl text-center mb-2 font-bold">
          Beat&apos;em Up
        </h1>
        <p className="text-muted text-center mb-6">
          {isSignUp ? "Create your account" : "Sign in to play"}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {isSignUp && (
            <input
              type="text"
              placeholder="Display Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="px-4 py-3 rounded-lg border border-border bg-input text-white text-base outline-none focus:border-accent transition-colors"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="px-4 py-3 rounded-lg border border-border bg-input text-white text-base outline-none focus:border-accent transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="px-4 py-3 rounded-lg border border-border bg-input text-white text-base outline-none focus:border-accent transition-colors"
          />

          {error && (
            <p className="text-red-400 text-sm text-center m-0">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="py-3 rounded-lg border-none bg-accent text-white text-base font-bold cursor-pointer mt-2 hover:brightness-110 active:brightness-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
          </button>
        </form>

        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError("");
          }}
          className="bg-transparent border-none text-accent cursor-pointer mt-4 text-sm w-full text-center hover:underline"
        >
          {isSignUp
            ? "Already have an account? Sign In"
            : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  );
}
