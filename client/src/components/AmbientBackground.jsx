import { motion } from "framer-motion";

const AmbientBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute w-[500px] h-[500px] bg-primary/30 rounded-full blur-3xl top-10 left-20"
        animate={{ opacity: [0.15, 0.3, 0.15], scale: [1, 1.05, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] bg-accent/25 rounded-full blur-3xl bottom-10 right-20"
        animate={{ opacity: [0.1, 0.25, 0.1], scale: [1, 1.08, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
};
export default AmbientBackground;
