"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type RevealProps = HTMLMotionProps<"div"> & {
  children?: ReactNode;
  delay?: number;
  y?: number;
  once?: boolean;
};

export function Reveal({
  children,
  className,
  delay = 0,
  y = 18,
  once = true,
  ...props
}: RevealProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div className={className} {...(props as HTMLAttributes<HTMLDivElement>)}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-40px" }}
      transition={{
        duration: 0.55,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function cnReveal(inView: boolean, className?: string) {
  return cn(
    "transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
    inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
    className
  );
}
