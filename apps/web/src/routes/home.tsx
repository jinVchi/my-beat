import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSession, signOut } from "@/lib/auth-client";
import { REGIONS } from "@my-beat/shared-types/game-config";
import { setSelectedRegion } from "@/game/state/region-store";
import { PhaserGame } from "@/PhaserGame";
import { useDocumentTitle } from "@/lib/use-document-title";

export default function HomePage() {
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [regionReady, setRegionReady] = useState(false);

  useDocumentTitle("Beat'em Up");

  const regionId = searchParams.get("region");

  useEffect(() => {
    if (!isPending && !session) {
      navigate("/login", { replace: true });
      return;
    }

    if (!regionId) {
      if (!isPending && session) {
        navigate("/select-region", { replace: true });
      }
      return;
    }

    const region = REGIONS.find((r) => r.id === regionId);
    if (!region) {
      navigate("/select-region", { replace: true });
      return;
    }

    setSelectedRegion(region);
    setRegionReady(true);
  }, [isPending, session, navigate, regionId]);

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
      <div className="fixed top-2 right-3 z-1000 flex items-center gap-3">
        <span className="text-muted text-sm">{session.user.name}</span>
        <button
          onClick={() =>
            signOut().then(() => navigate("/login", { replace: true }))
          }
          className="bg-transparent border border-border text-accent px-3 py-1 rounded-md cursor-pointer text-xs hover:bg-accent hover:text-white transition-colors"
        >
          Sign Out
        </button>
      </div>
      <main className="home-main">
        <div id="app">
          <PhaserGame />
        </div>
      </main>
    </>
  );
}

