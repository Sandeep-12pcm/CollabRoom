import React, { useEffect, useRef } from "react";
import { useSubscription } from "@/hooks/useSubscription";

type AdSlotProps = {
  size?: "small" | "medium" | "large";
  slot?: string;
  format?: "auto" | "rectangle" | "vertical" | "horizontal" | "fluid";
  layoutKey?: string;
  className?: string;
};

export const AdSlot = ({
  size = "medium",
  slot = "", // Unique slot ID from AdSense dashboard
  format = "auto",
  layoutKey = "",
  className = ""
}: AdSlotProps) => {
  const { isPro } = useSubscription();

  const containerRef = useRef<HTMLDivElement>(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    if (isPro) return;

    const pushAd = () => {
      if (pushedRef.current) return;
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushedRef.current = true;
      } catch (err) {
        console.error("AdSense push error:", err);
      }
    };

    if (containerRef.current) {
      if (containerRef.current.offsetWidth > 0) {
        pushAd();
      } else {
        const observer = new ResizeObserver((entries) => {
          if (entries[0].contentRect.width > 0) {
            pushAd();
            observer.disconnect();
          }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
      }
    }
  }, [isPro]);

  if (isPro) return null;

  return (
    <div
      ref={containerRef}
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
        data-ad-layout-key={layoutKey || undefined}
        data-full-width-responsive={format === "fluid" ? undefined : "true"}
      />
    </div>
  );
};
