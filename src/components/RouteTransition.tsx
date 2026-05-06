"use client";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

// Cross-fade between routes inside the (app) shell. Subtle: 8px upward fade,
// 200ms in / 150ms out. AnimatePresence needs the pathname as the keyed boundary
// so it tears down the old tree once the new one is mounted.
export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
