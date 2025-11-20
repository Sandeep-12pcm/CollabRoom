import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Confirmation",
  message = "Are you sure you want to delete this page? This action cannot be undone.",
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Modal Window */}
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="bg-[#1E1E2E] text-gray-100 rounded-xl shadow-2xl border border-[#2A2A40] w-[95%] max-w-md overflow-hidden font-mono"
          >
            {/* Header Bar like a Code Editor */}
            <div className="flex items-center justify-between bg-[#2D2D3A] px-4 py-2 border-b border-[#3E3E55]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Terminal size={14} /> CollabRoom.js
              </div>
            </div>

            {/* Content */}
            <div className="p-6 text-left">
              <h2 className="text-lg font-semibold text-[#F38BA8] mb-3">
                ⚠️ {title}
              </h2>
              <pre className="text-sm text-[#A6ADC8] bg-[#2D2D3A] p-3 rounded-md border border-[#3E3E55] overflow-x-auto">
{`// System Message:
"${message}"`}
              </pre>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-md bg-[#2D2D3A] hover:bg-[#3E3E55] text-gray-300 transition border border-[#3E3E55]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className="px-4 py-2 rounded-md bg-[#F38BA8] hover:bg-[#F87171] text-black font-semibold transition"
                >
                  Confirm
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;
