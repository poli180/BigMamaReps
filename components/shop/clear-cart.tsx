"use client";
import { useEffect } from "react";
import { useStore } from "./store-provider";
export function ClearCart() {
  const store = useStore();
  useEffect(() => {
    if (store.ready) store.clear();
  }, [store.ready]);
  return null;
}
