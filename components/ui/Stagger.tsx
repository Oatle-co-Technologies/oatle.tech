"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

type StaggerProps = {
  children: ReactNode;
};

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

export default function Stagger({ children }: StaggerProps) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </motion.div>
  );
}