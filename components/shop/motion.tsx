"use client";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={`reveal ${className}`}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-25px" }}
      transition={{
        duration: reduce ? 0 : 0.35,
        delay: reduce ? 0 : delay,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  );
}
