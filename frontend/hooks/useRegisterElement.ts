// hooks/useRegisterElement.ts
"use client";
import { useEffect, useRef } from "react";
import { elementRegistry } from "@/lib/element-registry";

export function useRegisterElement(id: string) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      elementRegistry.register(id, ref.current);
    }
    return () => {
      elementRegistry.register(id, null); // Cleanup
    };
  }, [id]);

  return ref;
}