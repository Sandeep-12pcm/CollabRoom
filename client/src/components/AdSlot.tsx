import React, { useEffect } from "react";
import { useSubscription } from "@/hooks/useSubscription";

type AdSlotProps = {
  size?: "small" | "medium" | "large";
  slot?: string;
  format?: "auto" | "rectangle" | "vertical" | "horizontal";
  className?: string;
};

export const AdSlot = ({
  size = "medium",
  slot = "2936421026889411", // Default to the client ID if no slot provided, though usually slot is different
  format = "auto",
  className = ""
}: AdSlotProps) => {
  const { isPro } = useSubscription();

  useEffect(() => {
    if (isPro) return;

    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense push error:", err);
    }
  }, [isPro]);

  if (isPro) return null;

  return (
    <div
      className={`
        w-full
        flex items-center justify-center
        overflow-hidden
        ${size === "small" && "min-h-[50px]"}
        ${size === "medium" && "min-h-[100px]"}
        ${size === "large" && "min-h-[250px]"}
        ${className}
      `}
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%" }}
        data-ad-client="ca-pub-2936421026889411"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
};
