"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
export function LiveUpdates({ revision }: { revision: string }) {
  const router = useRouter();
  const current = useRef(revision);
  useEffect(() => {
    current.current = revision;
  }, [revision]);
  useEffect(() => {
    let busy = false,
      stopped = false;
    const controller = new AbortController();
    async function check() {
      if (busy || document.visibilityState !== "visible") return;
      busy = true;
      try {
        const response = await fetch("/api/shop/version", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) return;
        const next = await response.json();
        if (
          !stopped &&
          typeof next.revision === "string" &&
          next.revision !== current.current
        ) {
          current.current = next.revision;
          router.refresh();
        }
      } catch {
      } finally {
        busy = false;
      }
    }
    const storage = (event: StorageEvent) => {
      if (event.key === "bmr-catalog-saved") void check();
    };
    const timer = setInterval(check, 5000);
    window.addEventListener("storage", storage);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    void check();
    return () => {
      stopped = true;
      controller.abort();
      clearInterval(timer);
      window.removeEventListener("storage", storage);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [router]);
  return null;
}
