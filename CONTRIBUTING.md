# Contributing to Gosh Is Launcher

Thank you for your interest in contributing to Gosh Is Launcher (formerly Spotlight). This document outlines the development workflow, project architecture, code style conventions, and testing procedures expected of all contributions.

## Prerequisites

- GNOME Shell 45 or later (45, 46, 47, 48, 49, and 50 are all supported)
- A text editor with ES module support
- Working knowledge of JavaScript and the GNOME Shell extension API
- A Wayland session for testing (X11 is not supported)

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/goshitsarch-eng/spotlight-goshos.git
cd spotlight-goshos
```

2. Install the extension into your local extensions directory for testing:

```bash
mkdir -p ~/.local/share/gnome-shell/extensions/gosh-is-launcher@nin
cp -r * ~/.local/share/gnome-shell/extensions/gosh-is-launcher@nin/
glib-compile-schemas ~/.local/share/gnome-shell/extensions/gosh-is-launcher@nin/schemas/
```

3. Restart GNOME Shell and enable the extension:

```bash
gnome-extensions enable gosh-is-launcher@nin
```

On Wayland, restarting GNOME Shell requires logging out and logging back in.

## Project Structure

`extension.js` must reside at the root of the archive for the GNOME Extensions website to locate it. Preference files are isolated under `prefs/` because they execute in a separate GTK4 process and must not import shell-only libraries (`St`, `Clutter`, `Meta`, `Shell`), just as shell-side files must not import GTK-only libraries (`Gtk`, `Gdk`, `Adw`).

Pure catalogs (`themes.js`, `webEngines.js`, `prefixParser.js`, `urlMatch.js`, `actionMatch.js`, `calculator.js`, `sectionTitles.js`) must not import any of those libraries so both processes can share them.

### Entry Points

- **`extension.js`** — Main entry point. Constructs the popup widget and registers the keybinding manager.
- **`prefs.js`** — Preferences window entry point. Imports the individual preference pages.

### UI Components

- **`launcherPopup.js`** — The popup widget. Handles open/close lifecycle, theme chrome, positioning, and input.
- **`searchEntry.js`** — Search input box with magnifying-glass icon.
- **`resultsContainer.js`** — Scrollable results container.
- **`scrollView.js`** — GNOME 45–50 `St.ScrollView` attach, policy, and adjustment.
- **`resultRow.js`** — Constructs a single result row with icon, title, and interaction handlers.
- **`sectionHeader.js`** — Section header label for categorizing results.
- **`sectionTitles.js`** — Maps result type strings to human-readable section titles.
- **`noResults.js`** — Empty-state widget displayed when a search yields no matches.

### Search Providers

Each search type lives in its own file and exports a function that accepts a query string and returns an array of result objects. Every result object must contain `type`, `title`, `icon`, and `activate` properties.

- **`appSearch.js`** — GNOME-style application search via `Shell.AppSystem`.
- **`calculatorSearch.js`** — Arithmetic evaluation and clipboard copy.
- **`systemActionsSearch.js`** — System actions via `Shell.SystemActions`.
- **`settingsSearch.js`** — GNOME Settings panel navigation.
- **`webSearch.js`** — Web search fallback.
- **`windowSearch.js`** — Open window switcher.
- **`recentFilesSearch.js`** — Recently used files.
- **`urlSearch.js`** — URL / domain opener.
- **`commandSearch.js`** — Optional `!` command runner.

### Services

- **`searchController.js`** — Orchestrates all search providers, feature flags, and prefix modes.
- **`keybinding.js`** — Keybinding manager using `Meta.Display.grab_accelerator`.
- **`themes.js`** — Look catalog used by the popup and preferences.

### Utilities

Pure functions with no side effects:

- **`calculator.js`** — Recursive-descent arithmetic parser.
- **`prefixParser.js`** — `= @ # $ . !` prefix parsing.
- **`searchPlan.js`** — Provider plan from feature flags.
- **`urlMatch.js`** — URL detection.
- **`actionMatch.js`** — System-action keyword matching.
- **`wordMatch.js`** — GNOME-style word-prefix matching.
- **`settingsPanels.js`** — Settings panel catalog.
- **`selectionMath.js`** — Arrow wrap and page-key clamp.
- **`recentXbel.js`** — Parse `recently-used.xbel`.
- **`keyAction.js`** — Key press to popup action.
- **`commandReady.js`** — Whether a parsed command argv can be spawned.
- **`shortcutAccel.js`** — Build a mutter accelerator string from a key and modifiers.
- **`popupGate.js`** — Whether a shortcut should open or close, including lock screen.
- **`searchRun.js`** — Run a search plan against provider functions.
- **`windowMatch.js`** — Window title / class matching.

### Preference Pages

- **`prefs/shortcutPage.js`** — Keyboard shortcut capture and configuration.
- **`prefs/appearancePage.js`** — Look, position, density, size, and chrome.
- **`prefs/featuresPage.js`** — Provider and behavior toggles.
- **`prefs/webSearchPage.js`** — Search engine selection and web search toggle.
- **`prefs/aboutPage.js`** — About section.

## Code Style

Follow `AGENTS.md`. The short version:

- Lowercase comments with no punctuation unless meaning requires it.
- Explain why, not what.
- No `try`/`catch` around standard APIs, no optional chaining, no nullish coalescing for guaranteed methods.
- `enable()` and `disable()` stay next to each other.
- One concept per file.

### Process Isolation

GNOME Shell extensions execute across two distinct processes:

- **The shell process** runs `extension.js` and all root-level JavaScript files. It has access to `St`, `Clutter`, `Meta`, `Shell`, `GLib`, `GObject`, `Gio`, and `Main`. It must never import `Gtk`, `Gdk`, or `Adw`.
- **The preferences process** runs `prefs.js` and `prefs/*.js`. It has access to `Gtk`, `Gdk`, `Adw`, and `Gio`. It must never import `St`, `Clutter`, `Meta`, or `Shell`.

### Module-Scope Restrictions

Do not create objects, connect signals, add main-loop sources, or modify the shell during module initialization. Static data only.

### Signal Management

Use `connectObject()` / `disconnectObject()` except for `global.display` and `global.stage`, which need manual handler ids.

### Object Lifecycle

Everything created in `enable()` is destroyed in `disable()`. The popup `destroy()` method calls `close()` first so backdrops, idles, and stage handlers are released even if the popup never became visible.

## Adding a New Search Provider

1. Create a new file at the root level, for example `mySearch.js`.
2. Export a function that accepts a query string and returns an array of result objects.
3. Each result object must contain `type`, `title`, `icon`, and `activate` properties.
4. Import the new provider in `searchController.js`.
5. Add it to `runSearch()` in the correct priority order.
6. Add the type string to `sectionTitles.js` if a custom section header is desired.
7. Add an `enable-*` key to the schema and a switch on the Features page.
8. Never create module-scope instances — use lazy calls inside callbacks.

## Adding a New Look

1. Add an entry to `THEMES` in `themes.js`.
2. Add a `<choice>` to `launcher-theme` in the schema.
3. Add `.gosh-theme-<id>` rules in `stylesheet.css`.
4. Do not fork `launcherPopup.js`.

## Testing

```bash
bash scripts/validate.sh
```

That compiles the schema, parses every JavaScript file, runs `tests/run.mjs`, and checks process isolation, optional chaining, removed GNOME 50 APIs, and CSS comment style.

Manual testing on GNOME Shell 50 Wayland:

1. Open with `Ctrl+Space`, type `set`, confirm Settings and apps appear.
2. Type `12*8+3` and Enter — clipboard should contain `99`.
3. Type `=2^8` — calculator prefix should show `256`.
4. Switch look to Omarchy, Pop!_OS, Ulauncher, KRunner, GNOME, Rofi, Raycast, and Albert.
5. Disable calculator in Features and confirm `12*8+3` no longer evaluates.
6. Press Escape, click outside, and press the shortcut again — all three must close the popup.
7. Press Home and End in a long result list — selection should jump to the first and last rows.
8. Open the popup and immediately press the shortcut again before results appear — it must close, not stack a second backdrop.
9. Click outside the popup — it must close without crashing the shell (Clutter 18).
10. Type `!no-such-command` with the command runner on and press Enter — the popup must close and the shell must stay up.
11. Type `screenshot` and press Enter with Overview closed — the screenshot UI must open.
12. Type `localhost:3000` — a URL result should open `http://localhost:3000`.
13. Type `.bashrc` — it must stay a normal search, not jump to recent files. Type `. notes` to force files.

## Submitting Changes

1. Implement your changes following the code style above.
2. Test locally on GNOME Shell 50.
3. Run `bash scripts/validate.sh`.
4. Open a pull request with a clear description of what changed and why.

## Reporting Bugs

Open an issue on GitHub with the following information:

- GNOME Shell version
- Linux distribution
- Steps to reproduce
- Expected behavior versus actual behavior
- Relevant logs from `journalctl -b /usr/bin/gnome-shell | grep -i gosh`
