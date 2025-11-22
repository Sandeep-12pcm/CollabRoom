import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Code2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ComingSoon = () => {
  const [email, setEmail] = useState("");
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Target launch date (change this)
  const launchDate = new Date("2026-01-01T00:00:00");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const diff = launchDate.getTime() - now;

      if (diff <= 0) {
        clearInterval(timer);
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setCountdown({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / (1000 * 60)) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleNotify = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("notifylater").insert({ email });
    if (!error) alert("You’ll be notified soon!");
    setEmail("");
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-background text-foreground overflow-hidden">
      {/* Background Grid */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(96,165,250,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,0.08) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      {/* Animated Glow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute w-[28rem] h-[28rem] rounded-full bg-primary blur-3xl opacity-20"
        style={{ top: "25%", left: "35%" }}
      />

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 text-center px-4"
      >
        <div className="flex justify-center items-center mb-6">
          <Code2 className="h-8 w-8 text-primary animate-pulse mr-2" />
          <h1 className="text-4xl sm:text-5xl font-bold text-primary tracking-wide">
            DevRooms
          </h1>
        </div>

        <h2 className="text-2xl font-semibold mb-3">
          🚀 We’re Launching Soon!
        </h2>
        <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
          Our team of developers is crafting something amazing. Stay tuned —
          we’ll be live very soon.
        </p>

        {/* Countdown */}
        <div className="flex justify-center gap-4 mb-8">
          {Object.entries(countdown).map(([label, value]) => (
            <motion.div
              key={label}
              whileHover={{ scale: 1.05 }}
              className="text-center bg-muted/10 backdrop-blur-sm px-4 py-3 rounded-lg border border-muted-foreground/10 min-w-[70px]"
            >
              <p className="text-2xl font-bold text-primary">{value}</p>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Notify Form */}
        <form
          onSubmit={handleNotify}
          className="flex flex-col sm:flex-row justify-center gap-3 max-w-md mx-auto"
        >
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-muted/30"
          />
          <Button type="submit" className="px-6 bg-primary hover:bg-primary/80">
            Notify Me
          </Button>
        </form>

        <p className="text-xs text-muted-foreground mt-4">
          <Clock className="inline w-3 h-3 mr-1" />
          We’ll notify you when we launch.
        </p>
      </motion.div>

      {/* Footer Cursor */}
      <motion.span
        className="absolute bottom-10 text-xs text-muted-foreground font-mono"
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        &gt;_ compiling the next big thing...
      </motion.span>
    </div>
  );
};

export default ComingSoon;
