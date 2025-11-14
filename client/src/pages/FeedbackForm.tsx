import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sun, Moon, Home, Send, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const FeedbackForm: React.FC = () => {
  const navigate = useNavigate();

  // form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // theme state
  const [darkMode, setDarkMode] = useState(true);

  const canSubmit = name.trim() && email.trim() && review.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!canSubmit) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const {data, error: feedbackError} = await supabase
        .from("feedbacks")
        .insert([{ name, email, review }]);
      setMessage("✅ Thank you! Your feedback has been submitted successfully.");
      setName("");
      setEmail("");
      setReview("");
    } catch (feedbackError: any) {
      setError(feedbackError?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className={`min-h-screen flex flex-col items-center justify-center px-4 py-12 transition-colors duration-500 ${
        darkMode ? "bg-[#0e0e14] text-gray-100" : "bg-[#f9f9fb] text-gray-900"
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      {/* Floating Background Glow */}
      <motion.div
        className="absolute inset-0 -z-10 blur-3xl"
        animate={{
          background: [
            "radial-gradient(circle at 20% 30%, rgba(147,197,253,0.1), transparent 60%), radial-gradient(circle at 80% 70%, rgba(236,72,153,0.1), transparent 60%)",
            "radial-gradient(circle at 30% 60%, rgba(147,197,253,0.15), transparent 60%), radial-gradient(circle at 70% 40%, rgba(236,72,153,0.15), transparent 60%)",
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Header */}
      <motion.div
        className="flex items-center justify-between w-full max-w-2xl mb-6"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <button
          onClick={() => navigate("/")}
          className={`flex items-center gap-2 px-3 py-2 rounded-md border transition-all duration-300 ${
            darkMode
              ? "border-gray-700 text-gray-300 hover:bg-gray-800"
              : "border-gray-300 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <Home className="w-4 h-4" />
          Back Home
        </button>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`flex items-center gap-2 px-3 py-2 rounded-md border transition-all duration-300 ${
            darkMode
              ? "border-gray-700 text-gray-300 hover:bg-gray-800"
              : "border-gray-300 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {darkMode ? (
            <>
              <Sun className="w-4 h-4 text-yellow-400" /> Light
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-blue-500" /> Dark
            </>
          )}
        </button>
      </motion.div>

      {/* Form Card */}
      <motion.form
        onSubmit={handleSubmit}
        className={`relative w-full max-w-2xl rounded-2xl shadow-2xl border backdrop-blur-xl p-8 transition-all duration-500 ${
          darkMode
            ? "bg-[#1a1a24]/90 border-[#2a2a40]"
            : "bg-white/80 border-gray-200"
        }`}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <motion.h2
          className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Share Your Feedback
        </motion.h2>
        <p className="text-center text-muted-foreground mb-6 text-sm">
          Your thoughts help us improve DevRoom. Thank you for taking the time!
        </p>

        {/* Fields */}
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium opacity-80 mb-1">
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className={`w-full rounded-md px-3 py-2 text-sm transition border focus:outline-none focus:ring-1 ${
                darkMode
                  ? "bg-[#111218] border-[#2d2d40] text-gray-100 focus:ring-primary/50"
                  : "bg-gray-100 border-gray-300 text-gray-900 focus:ring-primary/40"
              }`}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium opacity-80 mb-1">
              Email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="you@domain.com"
              className={`w-full rounded-md px-3 py-2 text-sm transition border focus:outline-none focus:ring-1 ${
                darkMode
                  ? "bg-[#111218] border-[#2d2d40] text-gray-100 focus:ring-primary/50"
                  : "bg-gray-100 border-gray-300 text-gray-900 focus:ring-primary/40"
              }`}
            />
          </div>

          {/* From */}
          <div>
            <label className="block text-xs font-medium opacity-80 mb-1">
              From
            </label>
            <input
              value="Yourself"
              disabled
              className={`w-full rounded-md px-3 py-2 text-sm cursor-not-allowed ${
                darkMode
                  ? "bg-[#121218] border border-[#26262f] text-gray-400"
                  : "bg-gray-100 border border-gray-300 text-gray-500"
              }`}
            />
          </div>

          {/* Review */}
          <div>
            <label className="block text-xs font-medium opacity-80 mb-1">
              Review
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={6}
              placeholder="Write your thoughts here..."
              className={`w-full rounded-md px-3 py-2 text-sm resize-y transition border focus:outline-none focus:ring-1 ${
                darkMode
                  ? "bg-[#0f1115] border-[#2d2d40] text-gray-100 focus:ring-primary/50"
                  : "bg-gray-100 border-gray-300 text-gray-900 focus:ring-primary/40"
              }`}
            />
          </div>
        </div>

        {/* Messages */}
        {error && (
          <motion.div
            className="text-sm text-red-500 mt-4 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.div>
        )}
        {message && (
          <motion.div
            className="text-sm text-green-500 mt-4 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {message}
          </motion.div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <motion.button
            type="submit"
            disabled={!canSubmit || loading}
            whileHover={{ scale: canSubmit ? 1.05 : 1 }}
            whileTap={{ scale: 0.98 }}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-md font-semibold shadow-md transition-all ${
              canSubmit
                ? "bg-gradient-to-r from-primary to-accent text-black hover:opacity-90"
                : "bg-gray-500/30 text-gray-400 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <>
                <motion.div
                  className="w-4 h-4 border-2 border-t-transparent border-black rounded-full animate-spin"
                />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Submit
              </>
            )}
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setName("");
              setEmail("");
              setReview("");
              setError(null);
              setMessage(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md border text-sm transition ${
              darkMode
                ? "border-gray-600 text-gray-300 hover:bg-gray-800"
                : "border-gray-300 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </motion.button>
        </div>
      </motion.form>
    </motion.div>
  );
};

export default FeedbackForm;
