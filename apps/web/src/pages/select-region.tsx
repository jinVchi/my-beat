import Head from "next/head";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { REGIONS, type RegionInfo } from "@my-beat/shared-types/game-config";

export default function SelectRegionPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login");
    }
  }, [isPending, session, router]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <span className="text-white">Loading...</span>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleSelect = (region: RegionInfo) => {
    router.push(`/?region=${region.id}`);
  };

  return (
    <>
      <Head>
        <title>Select Region — Beat&apos;em Up</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="bg-card rounded-xl p-10 w-full max-w-[500px] shadow-[0_8px_32px_rgba(0,0,0,0.4)] text-center">
          <h1 className="text-accent text-3xl mb-2 font-bold">
            Beat&apos;em Up
          </h1>
          <p className="text-muted text-lg mb-8">Select your region</p>

          <div className="flex gap-4 justify-center">
            {REGIONS.map((region) => (
              <button
                key={region.id}
                onClick={() => handleSelect(region)}
                className="flex flex-col items-center gap-1 w-[120px] py-5 rounded-[10px] border-2 border-accent bg-transparent text-white cursor-pointer transition-colors hover:bg-accent"
              >
                <span className="text-2xl font-bold">{region.id}</span>
                <span className="text-sm text-muted">{region.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
