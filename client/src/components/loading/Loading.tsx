import React from "react";

const Loading = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background text-foreground z-50">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
      </div>
      <p className="mt-6 text-lg animate-pulse-glow">Loading...</p>
    </div>
  );
};

export default Loading;
