import React from "react";

if (import.meta.env.DEV) {
  import("@welldone-software/why-did-you-render").then(({ default: whyDidYouRender }) => {
    whyDidYouRender(React, {
      trackAllPureComponents: false,
      // Disable hook tracking — it crashes on Radix UI components that use
      // numeric useState values (e.g. ToastProvider uses useState(0) internally)
      trackHooksChanges: false,
    });
  });
}
