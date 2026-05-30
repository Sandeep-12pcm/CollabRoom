// @welldone-software/why-did-you-render is intentionally disabled.
//
// wdyr patches ALL React hook functions globally (useState, useMemo, useRef, etc.)
// at the prototype level — even when trackHooksChanges: false. This breaks
// third-party libraries (sonner, Radix UI) whose internal components call hooks
// in ways that don't survive the wdyr wrapper (e.g. useMemo with undefined deps).
//
// If you need to debug re-renders for a specific component, temporarily re-enable
// it for ONLY that component using the whyDidYouRender static property:
//
//   MyComponent.whyDidYouRender = true;
//
// and uncomment the block below for a single session.

// import React from "react";
// if (import.meta.env.DEV) {
//   import("@welldone-software/why-did-you-render").then(({ default: wdyr }) => {
//     wdyr(React, { trackAllPureComponents: false, trackHooksChanges: false });
//   });
// }

