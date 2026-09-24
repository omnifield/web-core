import { defineLibraryConfig } from "@web-core/build/vite";

export default defineLibraryConfig({
  entries: [
    { name: "index", source: "src/index.ts" },
    { name: "transport", source: "src/transport/index.ts" },
    { name: "pagination", source: "src/pagination/index.ts" },
    { name: "peer", source: "src/peer/index.ts" },
    { name: "browser", source: "src/browser/index.ts" },
    { name: "feedback", source: "src/feedback/index.ts" },
  ],
});
