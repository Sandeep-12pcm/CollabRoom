import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import ComingSoon from "@/components/loading/ComingSoon";
export const SubscriptionDialog = () => {
  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [commingsoon, setCommingSoon] = useState(false);
  const [email, setEmail] = useState("");

  const navigate = useNavigate();

  // check auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsLoggedIn(!!session);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSubscribe = () => {
    if (!isLoggedIn) {
      navigate("/auth");
      return;
    }
    navigate("/profile");
  };

  const plans = [
    {
      name: "Pro",
      icon: "👑",
      price: 499,
      original: 1999,
      features: [
        "🚀 Faster Room Performance",
        "⏳ 72-hour Room Retention",
        "👥 Join up to 10 Active Rooms",
        "🤖 Smart AI Help (Basic)",
        "🎨 Custom Profile Themes",
      ],
      gradient: "from-yellow-400 to-amber-500",
    },
    {
      name: "Premium",
      icon: "🌟",
      price: 899,
      original: 3999,
      features: [
        "🔥 Ultra Room Performance",
        "🗂️ 1-Month Room Retention",
        "♾ Unlimited Rooms",
        "🤖 Full Power AI Assistance",
        "💾 Export & Backup Rooms",
        "✨ Premium Motion UI",
      ],
      gradient: "from-purple-400 to-fuchsia-500",
    },
  ];

  return (
    <>
      {/* CENTER GOLDEN GLOW BUTTON */}
      <div className="flex justify-center mt-12 mb-20">
        <motion.button
          onClick={() => {
            setCommingSoon(true);
            setOpen(true);
          }}
          className="relative px-10 py-4 text-lg font-semibold rounded-xl text-black dark:text-white bg-gradient-to-r from-yellow-400 to-yellow-00 shadow-xl"
        >
          {/* Glowing + blinking border */}
          <motion.div
            className="absolute inset-0 rounded-xl border-[3px] border-yellow-400 pointer-events-none"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
          <span className="relative z-10">✨ Subscription</span>
        </motion.button>
      </div>

      {/* POPUP DIALOG */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Dialog Box */}
            <motion.div
              className="relative bg-background/90 border border-border shadow-2xl rounded-2xl max-w-4xl w-full p-8"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              {commingsoon ? (
                // 👉 Show Coming Soon inside modal
                <div className="w-full h-full relative">
                  <ComingSoon />

                  {/* Close Button */}
                  <button
                    onClick={() => {
                      setCommingSoon(false);
                      setOpen(false);
                    }}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              ) : (
                // 👉 Main subscription UI
                <>
                  {/* Close Button */}
                  <button
                    onClick={() => {
                      setOpen(false);
                      setCommingSoon(false);
                    }}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  <h2 className="text-3xl font-bold text-center mb-2 text-foreground">
                    Choose Your Plan
                  </h2>

                  <p className="text-center text-muted-foreground mb-10">
                    Upgrade now and unlock premium CollabRoom features.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {plans.map((plan, index) => (
                      <motion.div
                        key={index}
                        className="rounded-xl p-6 border border-border bg-card/80 shadow-lg hover:shadow-2xl transition-all relative overflow-hidden"
                        whileHover={{ scale: 1.02 }}
                      >
                        {/* Plan Icon */}
                        <div
                          className={`w-16 h-16 mb-4 rounded-xl flex items-center justify-center text-4xl bg-gradient-to-br ${plan.gradient}`}
                        >
                          {plan.icon}
                        </div>

                        {/* Plan Name */}
                        <h3 className="text-xl font-bold mb-2 text-foreground">
                          {plan.name} Plan
                        </h3>

                        {/* Price */}
                        <div className="mb-4">
                          <span className="text-3xl font-bold text-primary">
                            ₹{plan.price}
                          </span>
                          <span className="ml-3 line-through text-muted-foreground">
                            ₹{plan.original}
                          </span>

                          <div className="text-green-400 font-semibold text-sm mt-1">
                            Save{" "}
                            {Math.round(
                              ((plan.original - plan.price) / plan.original) *
                                100
                            )}
                            % 🎉
                          </div>
                        </div>

                        {/* Features */}
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          {plan.features.map((feature, i) => (
                            <li key={i}>{feature}</li>
                          ))}
                        </ul>

                        {/* SUBSCRIBE BUTTON */}
                        <button
                          onClick={handleSubscribe}
                          className="mt-6 w-full py-2 rounded-lg bg-gradient-to-r from-primary to-accent text-black font-semibold hover:opacity-90 transition"
                        >
                          Subscribe Now
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
