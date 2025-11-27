import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Terminal } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10); // seconds to redirect

  useEffect(() => {
    // console.error("404 Error: User attempted to access non-existent route:", location.pathname);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(interval);
          navigate("/");
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [location.pathname, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground relative overflow-hidden">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(96,165,250,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,0.1) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      {/* Animated gradient glow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute w-96 h-96 rounded-full bg-primary blur-3xl opacity-20"
        style={{ top: "30%", left: "30%" }}
      />

      {/* Main 404 content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 text-center px-4"
      >
        <div className="flex items-center justify-center mb-6">
          <Terminal className="h-8 w-8 text-primary animate-pulse mr-2" />
          <h1 className="text-5xl font-bold text-primary tracking-widest">
            404
          </h1>
        </div>

        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Page Not Found
        </h2>

        <p className="text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
          Looks like you took a wrong turn in the codebase.<br />
          <span className="text-primary">/{location.pathname}</span> doesn’t exist in this repository.
        </p>

        {/* Countdown message */}
        <motion.p
          key={countdown}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.3 }}
          className="text-sm text-muted-foreground mb-8"
        >
          Redirecting to <span className="text-primary font-mono">/home</span> in{" "}
          <span className="font-bold text-accent">{countdown}</span>...
        </motion.p>

        <Button
          onClick={() => navigate("/")}
          className="px-6 py-3 rounded-lg text-white bg-primary hover:bg-primary/80 transition-all duration-300 shadow-lg"
        >
          ← Back to Home Now
        </Button>
      </motion.div>

      {/* Bottom flickering cursor effect */}
      <motion.span
        className="absolute bottom-10 text-xs text-muted-foreground font-mono"
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        &gt;_ awaiting next route...
      </motion.span>
    </div>
  );
};

export default NotFound;
