// plugin.ts
import type { Plugin } from "vite";
import { readFileSync } from "fs";
import { join } from "path";

function generateEntryCode(projectFileName: string, srcDir: string) {
  const importPath = `${srcDir}/${projectFileName}`.replace(/\\/g, "/");
  return `
import * as React from 'react';
import { createRoot } from 'react-dom/client';

const loadApp = async () => {
  const mod = await import('./${importPath}');
  return mod.default;
};

loadApp().then(App => {
  const root = document.getElementById('root');
  if (!root) throw new Error('react-mpx: #root element not found in index.html');
  createRoot(root).render(
    React.createElement(React.StrictMode, null,
      React.createElement(App, null)
    )
  );
}).catch(err => {
  console.error('Failed to load project "${projectFileName}":', err);
  throw err;
});
`;
}

export function MuxVitePlugin(projectFileName: string, srcDir: string): Plugin {
  // Using .tsx extension — most reliable signal for JSX
  const virtualModuleId = "virtual:mux-entry.tsx";
  const resolvedVirtualModuleId = `\0${virtualModuleId}`;

  const entryCode = generateEntryCode(projectFileName, srcDir);

  return {
    name: "react-mpx-entry",
    enforce: "pre",

    config(_, { command }) {
      if (command === "build") {
        return {
          build: {
            rollupOptions: {
              input: virtualModuleId,
            },
          },
        };
      }
    },

    resolveId(id) {
      if (id === virtualModuleId || id.startsWith(`${virtualModuleId}?`)) {
        return resolvedVirtualModuleId;
      }
    },

    load(id) {
      if (id === resolvedVirtualModuleId) {
        return entryCode;
      }
    },

    transformIndexHtml(html, ctx) {
      if (ctx.server) {
        return html.replace(
          "</body>",
          `<script type="module" src="/@id/__x00__${virtualModuleId}"></script></body>`
        );
      }
    },

    generateBundle(_options, bundle) {
      const virtualChunk = Object.values(bundle).find(
        (c) =>
          c.type === "chunk" && c.facadeModuleId === resolvedVirtualModuleId
      ) as import("rollup").OutputChunk | undefined;

      if (!virtualChunk) {
        throw new Error("react-mpx: Virtual entry chunk not found in bundle.");
      }

      const indexPath = join(process.cwd(), "index.html");
      let userHtml: string;
      try {
        userHtml = readFileSync(indexPath, "utf-8");
      } catch (err) {
        throw new Error(
          "react-mpx: index.html is required but not found in project root."
        );
      }

      const enhancedHtml = userHtml.replace(
        "</body>",
        `<script type="module" src="/${virtualChunk.fileName}"></script></body>`
      );

      this.emitFile({
        type: "asset",
        fileName: "index.html",
        source: enhancedHtml,
      });
    },
  };
}
