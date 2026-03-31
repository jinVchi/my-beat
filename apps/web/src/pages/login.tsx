import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { signIn, signUp } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        const result = await signUp.email({
          name,
          email,
          password,
        });
        if (result.error) {
          setError(result.error.message ?? "Sign up failed");
          setLoading(false);
          return;
        }
      } else {
        const result = await signIn.email({
          email,
          password,
        });
        if (result.error) {
          setError(result.error.message ?? "Sign in failed");
          setLoading(false);
          return;
        }
      }
      // Small delay to let the session cookie propagate before navigating,
      // otherwise useSession() on the index page may not see it yet and
      // redirect back to /login.
      await new Promise((r) => setTimeout(r, 200));
      window.location.href = "/";
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{isSignUp ? "Sign Up" : "Sign In"} — Beat&apos;em Up</title>
      </Head>
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Beat&apos;em Up</h1>
          <p style={styles.subtitle}>
            {isSignUp ? "Create your account" : "Sign in to play"}
          </p>

          <form onSubmit={handleSubmit} style={styles.form}>
            {isSignUp && (
              <input
                type="text"
                placeholder="Display Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={styles.input}
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              style={styles.input}
            />

            {error && <p style={styles.error}>{error}</p>}

            <button type="submit" disabled={loading} style={styles.button}>
              {loading
                ? "Loading..."
                : isSignUp
                  ? "Sign Up"
                  : "Sign In"}
            </button>
          </form>

          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
            style={styles.toggle}
          >
            {isSignUp
              ? "Already have an account? Sign In"
              : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0a0a0a",
  },
  card: {
    background: "#1a1a2e",
    borderRadius: "12px",
    padding: "40px",
    width: "100%",
    maxWidth: "400px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
  },
  title: {
    color: "#e94560",
    fontSize: "2rem",
    textAlign: "center",
    margin: "0 0 8px 0",
    fontWeight: "bold",
  },
  subtitle: {
    color: "#a0a0b0",
    textAlign: "center",
    margin: "0 0 24px 0",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  input: {
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid #333",
    background: "#16213e",
    color: "#fff",
    fontSize: "1rem",
    outline: "none",
  },
  button: {
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    background: "#e94560",
    color: "#fff",
    fontSize: "1rem",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "8px",
  },
  error: {
    color: "#ff6b6b",
    fontSize: "0.875rem",
    margin: 0,
    textAlign: "center",
  },
  toggle: {
    background: "none",
    border: "none",
    color: "#e94560",
    cursor: "pointer",
    marginTop: "16px",
    fontSize: "0.875rem",
    width: "100%",
    textAlign: "center",
  },
};
