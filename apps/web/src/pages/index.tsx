import Head from "next/head";
import { Inter } from "next/font/google";
import styles from "@/styles/Home.module.css";
import dynamic from "next/dynamic";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/router";
import { useEffect } from "react";

const inter = Inter({ subsets: ["latin"] });

const AppWithoutSSR = dynamic(() => import("@/App"), { ssr: false });

export default function Home() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login");
    }
  }, [isPending, session, router]);

  if (isPending) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a", color: "#fff" }}>
        Loading...
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Beat&apos;em Up</title>
        <meta name="description" content="Multiplayer beat'em up web game" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.png" />
      </Head>
      <div style={{ position: "fixed", top: 8, right: 12, zIndex: 1000, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ color: "#a0a0b0", fontSize: "0.875rem" }}>
          {session.user.name}
        </span>
        <button
          onClick={() => signOut().then(() => router.replace("/login"))}
          style={{ background: "none", border: "1px solid #333", color: "#e94560", padding: "4px 12px", borderRadius: 6, cursor: "pointer", fontSize: "0.75rem" }}
        >
          Sign Out
        </button>
      </div>
      <main className={`${styles.main} ${inter.className}`}>
        <AppWithoutSSR />
      </main>
    </>
  );
}
