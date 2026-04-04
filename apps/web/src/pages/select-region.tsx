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
      <div style={styles.container}>
        <span style={{ color: "#fff" }}>Loading...</span>
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
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Beat&apos;em Up</h1>
          <p style={styles.subtitle}>Select your region</p>

          <div style={styles.buttons}>
            {REGIONS.map((region) => (
              <button
                key={region.id}
                onClick={() => handleSelect(region)}
                style={styles.regionBtn}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#e94560";
                  e.currentTarget.style.borderColor = "#e94560";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "#e94560";
                }}
              >
                <span style={styles.regionId}>{region.id}</span>
                <span style={styles.regionLabel}>{region.label}</span>
              </button>
            ))}
          </div>
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
    borderRadius: "0.75rem",
    padding: "2.5rem",
    width: "100%",
    maxWidth: "31.25rem",
    boxShadow: "0 0.5rem 2rem rgba(0, 0, 0, 0.4)",
    textAlign: "center" as const,
  },
  title: {
    color: "#e94560",
    fontSize: "2rem",
    margin: "0 0 0.5rem 0",
    fontWeight: "bold",
  },
  subtitle: {
    color: "#a0a0b0",
    margin: "0 0 2rem 0",
    fontSize: "1.1rem",
  },
  buttons: {
    display: "flex",
    gap: "1rem",
    justifyContent: "center",
  },
  regionBtn: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "0.25rem",
    width: "7.5rem",
    padding: "1.25rem 0",
    borderRadius: "0.625rem",
    border: "0.125rem solid #e94560",
    background: "transparent",
    color: "#fff",
    cursor: "pointer",
    transition: "background 0.15s, border-color 0.15s",
  },
  regionId: {
    fontSize: "1.5rem",
    fontWeight: "bold",
  },
  regionLabel: {
    fontSize: "0.875rem",
    color: "#a0a0b0",
  },
};
