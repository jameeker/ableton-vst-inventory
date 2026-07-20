# ableton-vst-inventory
A minimal Ableton Extension for exporting all locally-installed VST plugins (VST 3, AU, and other formats) into one organized list. Multiple output filetypes (JSON, CSV, TXT, MD).

Discover what you have, for reference or archival purposes.

### Features:

- Automatic scanning of system VST install directories
- Export plugin inventory as JSON, CSV, TXT, or MD
- Cross-platform support (macOS/Windows)

### Use Cases:

- Quickly audit what plugins you have
- Generate a list for documentation or backup
- Identify unused VSTs

## Usage

1. Download the latest `.ablx` file from the [`releases/`](releases) directory and install it by dropping it onto the **Extensions** page in Live's Settings/Preferences.
2. Enable the extension in the **Extensions** list (it should be enabled by default after install).
3. In Live, right-click any **audio track** and choose **VST List Exporter: Scan & Export Plugin Inventory…**.
4. Browse the scanned inventory — filter by name or format (VST3 / VST2 / AU), pick an export format (JSON, CSV, TXT, or Markdown), and click **Export**.
5. The inventory file is written to the extension's storage directory; a confirmation dialog shows the full path.

Scanned directories:

- **macOS:** `/Library/Audio/Plug-Ins/{VST3,VST,Components}` and the `~/Library` equivalents
- **Windows:** `Common Files\VST3`, `Common Files\VST2`, `Program Files\VSTPlugins`, `Program Files\Steinberg\VstPlugins`

### Building

Requires Node.js ≥ 22.

```sh
npm install
npm run build   # Type-check + production bundle → dist/extension.js
npm run package # Build + package as dist/ableton-vst-inventory.ablx
```

Install the extension by dropping the `.ablx` file onto the Extensions page in Live's settings.

### Development

Copy [`.env.example`](.env.example) to `.env` and set `EXTENSION_HOST_PATH` to your local Ableton Live installation (see the comments in that file for how to find it). Then enable **Developer Mode** in Live's Extensions preferences, and run:

```sh
npm start # Build + launch the Extension Host with this extension
```


> **Note on storage:** when installed normally via the `.ablx` file, Live provides and manages `context.environment.storageDirectory` automatically — no configuration needed. When running the standalone dev Extension Host with `npm start`, however, that directory isn't set unless explicitly provided. The `start` script therefore passes `--storage-directory ./.storage --temp-directory ./.temp` so exports work the same way during development.

See the [Extensions SDK docs](extensions-sdk-1.0.0-beta.0/docs) for details.
