import * as fs from "node:fs/promises";
import * as path from "node:path";
import { initialize, type ActivationContext } from "@ableton-extensions/sdk";

import { scanPlugins, type PluginInfo } from "./scanner.js";
import { exportPlugins, type ExportFormat } from "./exporters.js";

// Inlined as a string by esbuild (see build.ts).
import inventoryInterface from "./interface.html";

const EXPORT_FORMATS: ExportFormat[] = ["json", "csv", "txt", "md"];

function toDataUrl(html: string): string {
  return `data:text/html,${encodeURIComponent(html)}`;
}

function confirmationHtml(filePath: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <script>
    function closeDialog() {
      const message = { method: "close_and_send", params: ["{}"] };
      if (window.webkit?.messageHandlers?.live) {
        window.webkit.messageHandlers.live.postMessage(message);
      } else if (window.chrome?.webview) {
        window.chrome.webview.postMessage(message);
      }
    }
  </script>
  <style>
    body {
      background-color: #4E4E4E; color: #FFF; font-family: sans-serif; font-size: 12px;
      margin: 0; height: 100vh; display: flex; flex-direction: column;
      justify-content: center; align-items: center; gap: 12px; padding: 16px; box-sizing: border-box;
    }
    code { background-color: #2C2C2C; padding: 4px 8px; word-break: break-all; user-select: all; }
    button { background-color: #FFA500; border: none; padding: 6px 16px; cursor: pointer; color: #000; }
  </style>
</head>
<body>
  <div>Plugin inventory exported to:</div>
  <code>${filePath.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</code>
  <button onclick="closeDialog()">OK</button>
</body>
</html>`;
}

export function activate(activation: ActivationContext) {
  const context = initialize(activation, "1.0.0");

  async function scanAndExport(): Promise<void> {
    // Scan plugin directories, showing progress.
    const plugins = (await context.ui.withinProgressDialog(
      "Scanning plugin directories…",
      {},
      async () => scanPlugins(),
    )) as PluginInfo[];

    // Show the inventory dialog. The plugin data is injected into the HTML.
    const html = inventoryInterface.replace(
      "__PLUGIN_DATA__",
      JSON.stringify(plugins).replace(/</g, "\\u003c"),
    );
    let result: { action?: string; format?: string };
    try {
      result = JSON.parse(await context.ui.showModalDialog(toDataUrl(html), 720, 480));
    } catch {
      return; // dialog closed without a result
    }
    if (result.action !== "export" || !EXPORT_FORMATS.includes(result.format as ExportFormat)) {
      return;
    }
    const format = result.format as ExportFormat;

    // Write the export into the extension's storage directory.
    const storageDirectory = context.environment.storageDirectory;
    if (!storageDirectory) {
      throw new Error("No storage directory available");
    }
    await fs.mkdir(storageDirectory, { recursive: true });
    const date = new Date().toISOString().slice(0, 10);
    const filePath = path.join(storageDirectory, `vst-inventory-${date}.${format}`);
    await fs.writeFile(filePath, exportPlugins(plugins, format), "utf-8");

    await context.ui.showModalDialog(toDataUrl(confirmationHtml(filePath)), 520, 200);
  }

  context.commands.registerCommand("ableton-vst-inventory.exportInventory", () => {
    scanAndExport().catch((error) => {
      console.error("VST List Exporter: export failed", error);
    });
  });

  (["AudioTrack", "MidiTrack"] as const).forEach((scope) => {
    context.ui.registerContextMenuAction(
      scope,
      "Scan & Export Plugin Inventory…",
      "ableton-vst-inventory.exportInventory",
    );
  });
}