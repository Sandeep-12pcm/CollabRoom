import React from "react";

if (import.meta.env.DEV) {
  import("@welldone-software/why-did-you-render").then(({ default: whyDidYouRender }) => {
    whyDidYouRender(React, {
      trackAllPureComponents: false,
    });
  });
}

