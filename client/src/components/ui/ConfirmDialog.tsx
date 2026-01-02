import React from "react";
import { Terminal } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="bg-[#1E1E2E] text-gray-100 rounded-xl shadow-2xl border border-[#2A2A40] p-0 overflow-hidden font-mono max-w-md w-[95%]">
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
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-[#F38BA8] mb-3 flex items-center gap-2">
              ⚠️ {title}
            </AlertDialogTitle>
          </AlertDialogHeader>

          <pre className="text-sm text-[#A6ADC8] bg-[#2D2D3A] p-3 rounded-md border border-[#3E3E55] overflow-x-auto whitespace-pre-wrap mb-6">
            {`// System Message:
"${message}"`}
          </pre>

          <AlertDialogFooter className="flex flex-row justify-end gap-3 sm:space-x-0">
            <AlertDialogCancel
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-[#2D2D3A] hover:bg-[#3E3E55] text-gray-300 transition border border-[#3E3E55] hover:text-white"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-4 py-2 rounded-md bg-[#F38BA8] hover:bg-[#F87171] text-black font-semibold transition border-none"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmDialog;
