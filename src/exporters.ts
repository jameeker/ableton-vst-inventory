import type { PluginInfo } from "./scanner.js";

export type ExportFormat = "json" | "csv" | "txt" | "md";

const COLUMNS = ["name", "format", "path", "modified"] as const;

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function toJson(plugins: PluginInfo[]): string {
  return JSON.stringify(plugins, null, 2) + "\n";
}

function toCsv(plugins: PluginInfo[]): string {
  const rows = [COLUMNS.join(",")];
  for (const p of plugins) {
    rows.push(COLUMNS.map((c) => csvEscape(p[c])).join(","));
  }
  return rows.join("\n") + "\n";
}

function toTxt(plugins: PluginInfo[]): string {
  const lines = [`Plugin Inventory (${plugins.length} plugins)`, ""];
  for (const p of plugins) {
    lines.push(`${p.name} [${p.format}]`);
    lines.push(`  ${p.path}`);
  }
  return lines.join("\n") + "\n";
}

function toMd(plugins: PluginInfo[]): string {
  const lines = [
    "# Plugin Inventory",
    "",
    `${plugins.length} plugins found.`,
    "",
    "| Name | Format | Path | Modified |",
    "| --- | --- | --- | --- |",
  ];
  for (const p of plugins) {
    const cells = COLUMNS.map((c) => p[c].replace(/\|/g, "\\|"));
    lines.push(`| ${cells.join(" | ")} |`);
  }
  return lines.join("\n") + "\n";
}

export function exportPlugins(plugins: PluginInfo[], format: ExportFormat): string {
  switch (format) {
    case "json":
      return toJson(plugins);
    case "csv":
      return toCsv(plugins);
    case "txt":
      return toTxt(plugins);
    case "md":
      return toMd(plugins);
  }
}