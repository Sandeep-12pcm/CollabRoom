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

    let timeoutId: NodeJS.Timeout;

    const pushAd = () => {
      if (pushedRef.current) return;
      
      // Extra safety check: ensure element is still in DOM and has width
      if (!containerRef.current || containerRef.current.getBoundingClientRect().width === 0) {
        return;
      }

      // AdSense push should happen only when page is visible and layout is stable
      if (document.visibilityState !== "visible") {
        return;
      }

      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushedRef.current = true;
      } catch (err) {
        console.error("AdSense push error:", err);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Small delay to ensure layout has settled after coming back to foreground
        timeoutId = setTimeout(pushAd, 100);
      }
    };

    if (containerRef.current) {
      const width = containerRef.current.getBoundingClientRect().width;
      
      if (width > 0 && document.visibilityState === "visible") {
        // Delay ensures that components within animations (like Navbar dropdown) 
        // have fully reached their final dimensions.
        timeoutId = setTimeout(pushAd, 200);
      } else {
        const observer = new ResizeObserver((entries) => {
          const entry = entries[0];
          if (entry.contentRect.width > 0 && document.visibilityState === "visible") {
            timeoutId = setTimeout(pushAd, 200);
            observer.disconnect();
          }
        });
        observer.observe(containerRef.current);
        
        document.addEventListener("visibilitychange", handleVisibilityChange);
        
        return () => {
          observer.disconnect();
          document.removeEventListener("visibilitychange", handleVisibilityChange);
          clearTimeout(timeoutId);
        };
      }
    }

    return () => clearTimeout(timeoutId);
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
