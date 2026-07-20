import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

export interface PluginInfo {
  name: string;                   /* Plugin name (file name without extension). */
  format: "VST3" | "VST2" | "AU"; /* Plugin format: VST3, VST2, or AU. */
  path: string;                   /* Absolute path to the plugin bundle/file. */
  modified: string;               /* Last-modified date in ISO 8601 format. */
}

interface ScanRoot {
  dir: string;
  format: PluginInfo["format"];
  extensions: string[];
}

function scanRoots(): ScanRoot[] {
  const home = os.homedir();
  if (process.platform === "darwin") {
    return [
      { dir: "/Library/Audio/Plug-Ins/VST3", format: "VST3", extensions: [".vst3"] },
      { dir: "/Library/Audio/Plug-Ins/VST", format: "VST2", extensions: [".vst"] },
      { dir: "/Library/Audio/Plug-Ins/Components", format: "AU", extensions: [".component"] },
      { dir: path.join(home, "Library/Audio/Plug-Ins/VST3"), format: "VST3", extensions: [".vst3"] },
      { dir: path.join(home, "Library/Audio/Plug-Ins/VST"), format: "VST2", extensions: [".vst"] },
      { dir: path.join(home, "Library/Audio/Plug-Ins/Components"), format: "AU", extensions: [".component"] },
    ];
  }
  // Windows
  const programFiles = process.env["ProgramFiles"] ?? "C:\\Program Files";
  const commonFiles = process.env["CommonProgramFiles"] ?? path.join(programFiles, "Common Files");
  return [
    { dir: path.join(commonFiles, "VST3"), format: "VST3", extensions: [".vst3"] },
    { dir: path.join(commonFiles, "VST2"), format: "VST2", extensions: [".dll"] },
    { dir: path.join(programFiles, "VSTPlugins"), format: "VST2", extensions: [".dll"] },
    { dir: path.join(programFiles, "Steinberg", "VstPlugins"), format: "VST2", extensions: [".dll"] },
  ];
}

/** Recursively collects plugins under `dir`. */
async function scanDir(root: ScanRoot, dir: string, results: PluginInfo[]): Promise<void> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return; // directory doesn't exist or isn't readable
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const ext = path.extname(entry.name).toLowerCase();
    if (root.extensions.includes(ext)) {
      let modified = "";
      try {
        modified = (await fs.stat(fullPath)).mtime.toISOString();
      } catch {
        // keep empty if stat fails
      }
      results.push({
        name: path.basename(entry.name, path.extname(entry.name)),
        format: root.format,
        path: fullPath,
        modified,
      });
    } else if (entry.isDirectory()) {
      await scanDir(root, fullPath, results);
    }
  }
}

/** Scans all standard system plugin directories for the current platform. */
export async function scanPlugins(): Promise<PluginInfo[]> {
  const results: PluginInfo[] = [];
  for (const root of scanRoots()) {
    await scanDir(root, root.dir, results);
  }
  results.sort((a, b) => a.name.localeCompare(b.name) || a.format.localeCompare(b.format));
  return results;
}