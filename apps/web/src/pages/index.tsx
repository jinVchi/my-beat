import Head from "next/head";
import { Inter } from "next/font/google";
import styles from "@/styles/Home.module.css";
import dynamic from "next/dynamic";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { REGIONS } from "@my-beat/shared-types/game-config";
import { setSelectedRegion } from "@/game/state/region-store";

const inter = Inter({ subsets: ["latin"] });

const AppWithoutSSR = dynamic(() => import("@/App"), { ssr: false });

export default function Home() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [regionReady, setRegionReady] = useState(false);

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login");
      return;
    }

    const regionId = router.query.region as string | undefined;
    if (!regionId) {
      if (!isPending && session) {
        router.replace("/select-region");
      }
      return;
    }

    const region = REGIONS.find((r) => r.id === regionId);
    if (!region) {
      router.replace("/select-region");
      return;
    }

    setSelectedRegion(region);
    setRegionReady(true);
  }, [isPending, session, router, router.query.region]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg text-white">
        Loading...
      </div>
    );
  }

  if (!session || !regionReady) {
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
      <div className="fixed top-2 right-3 z-1000 flex items-center gap-3">
        <span className="text-muted text-sm">
          {session.user.name}
        </span>
        <button
          onClick={() => signOut().then(() => router.replace("/login"))}
          className="bg-transparent border border-border text-accent px-3 py-1 rounded-md cursor-pointer text-xs hover:bg-accent hover:text-white transition-colors"
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
