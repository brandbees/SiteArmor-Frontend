"use client";

import { useEffect, useRef, type HTMLAttributes, type ReactNode } from "react";
import {
  useReducedMotion,
  motion,
  useScroll,
  useTransform,
  useInView,
  useMotionValue,
  animate,
  type HTMLMotionProps,
} from "framer-motion";
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

type RevealScaleProps = HTMLMotionProps<"div"> & {
  children?: ReactNode;
  delay?: number;
  once?: boolean;
};

export function RevealScale({
  children,
  className,
  delay = 0,
  once = true,
  ...props
}: RevealScaleProps) {
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
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once, margin: "-40px" }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

type RevealSlideProps = HTMLMotionProps<"div"> & {
  children?: ReactNode;
  delay?: number;
  from?: "left" | "right";
  once?: boolean;
};

export function RevealSlide({
  children,
  className,
  delay = 0,
  from = "left",
  once = true,
  ...props
}: RevealSlideProps) {
  const reduce = useReducedMotion();
  const x = from === "left" ? -40 : 40;

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
      initial={{ opacity: 0, x }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once, margin: "-40px" }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

type StaggerChildrenProps = HTMLMotionProps<"div"> & {
  children?: ReactNode;
  stagger?: number;
  once?: boolean;
};

export function StaggerChildren({
  children,
  className,
  stagger = 0.08,
  once = true,
  ...props
}: StaggerChildrenProps) {
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
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-40px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger } },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

type ParallaxFloatProps = HTMLMotionProps<"div"> & {
  children?: ReactNode;
  factor?: number;
};

export function ParallaxFloat({
  children,
  className,
  factor = 0.1,
  ...props
}: ParallaxFloatProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [-30 * factor, 30 * factor]);

  if (reduce) {
    return (
      <div className={className} ref={ref} {...(props as HTMLAttributes<HTMLDivElement>)}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ y }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

type CountUpProps = {
  value: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  duration?: number;
};

export function CountUp({
  value,
  suffix = "",
  prefix = "",
  className,
  duration = 1.6,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(0);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !isInView) return;
    const controls = animate(motionVal, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(v) {
        if (ref.current) {
          ref.current.textContent = `${prefix}${Math.round(v)}${suffix}`;
        }
      },
    });
    return controls.stop;
  }, [isInView, motionVal, value, suffix, prefix, duration, reduce]);

  return (
    <span ref={ref} className={className}>
      {prefix}{value}{suffix}
    </span>
  );
}
