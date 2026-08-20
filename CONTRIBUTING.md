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
- **`labelEllipsize.js`** — Keeps long titles on one line inside the fixed-width popup.
- **`sectionHeader.js`** — Section header label for categorizing results.
- **`sectionTitles.js`** — Maps result type strings to human-readable section titles.
- **`noResults.js`** — Empty-state widget displayed when a search yields no matches.

### Search Providers

Each search type lives in its own file and exports a function that accepts a query string and returns an array of result objects. Every result object must contain `type`, `title`, `icon`, and `activate` properties.

- **`appSearch.js`** — GNOME-style application search via `Shell.AppSystem`.
- **`appAction.js`** — New window and desktop-file action labels.
- **`calculatorSearch.js`** — Arithmetic evaluation and clipboard copy.
- **`unitSearch.js`** — Length, mass, temperature, volume, data, energy, power, and angle conversion.
- **`unitMatch.js`** — Unit aliases and conversion math.
- **`placesSearch.js`** — XDG user folders.
- **`placeMatch.js`** — Folder titles and keywords.
- **`bookmarksSearch.js`** — GTK 3/4 folder bookmarks.
- **`bookmarkParse.js`** — Bookmark file parsing.
- **`timeSearch.js`** — Local time and date.
- **`timeMatch.js`** — Time and date query matching.
- **`colorSearch.js`** — Hex color copy.
- **`colorMatch.js`** — Hex color normalization.
- **`systemActionsSearch.js`** — System actions via `Shell.SystemActions`.
- **`settingsSearch.js`** — GNOME Settings panel navigation.
- **`webSearch.js`** — Web search fallback.
- **`windowSearch.js`** — Open window switcher, including modal dialogs.
- **`windowClose.js`** — `close` / `quit` / `kill` window queries.
- **`workspaceQuery.js`** — `workspace 2` switch-to-workspace queries.
- **`recentFilesSearch.js`** — Recently used files.
- **`urlSearch.js`** — URL / domain opener.
- **`pathSearch.js`** — `~/` `./` and absolute path opener.
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
- **`popupGate.js`** — Whether a shortcut should open or close, and whether lock or greeter must close an open popup.
- **`popupPosition.js`** — Work-area origin so the popup stays off the panel, lifting when a short display would hide the list.
- **`backdropBox.js`** — Union box so click-outside covers every monitor.
- **`searchRun.js`** — Run a search plan against provider functions.
- **`windowMatch.js`** — Window title / class matching.
- **`windowClose.js`** — Close / quit / kill query parsing.
- **`workspaceQuery.js`** — Workspace switch query parsing.
- **`appReady.js`** — Whether an app may appear before parental controls finish, and the give-up after malcontent never answers.
- **`resultActivate.js`** — Activate a result without taking down the shell.
- **`terminalLaunch.js`** — Pick a terminal command for a directory.
- **`entryPreedit.js`** — Whether stage capture must yield to an IME compose.
- **`appMatch.js`** — App name, GenericName, and keyword match tiers.
- **`homePath.js`** — Expand `~`, `./`, and home-relative slash commands such as `scripts/deploy`.
- **`userPath.js`** — Extra directories the GNOME Shell PATH often omits (`~/.local/bin`).
- **`pathMatch.js`** — Path result title, icon, and missing-path copy.
- **`resultPointer.js`** — Result-row press must stay on the same row.

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

1. Open with `Ctrl+Space`, type `set`, confirm Settings and apps appear. Type `browser` if Firefox or another browser is installed — it should appear from GenericName, Keywords, or the desktop Comment.
2. Type `12*8+3` and Enter — clipboard should contain `99`. Type `2×3`, `2**3`, `2 x 3`, `1e3+2`, or `1,000+2` — all should evaluate.
3. Type `=2^8` — calculator prefix should show `256`.
4. Switch look to Omarchy, Pop!_OS, Ulauncher, KRunner, GNOME, Rofi, Raycast, Albert, Wofi, Fuzzel, Anyrun, Tofi, Light, PowerToys, and Synapse. Change a look while the popup is open — rows should restyle.
5. Disable calculator in Features and confirm `12*8+3` no longer evaluates.
6. Press Escape, click outside, and press the shortcut again — all three must close the popup.
7. Press Home in the middle of a query — the caret should move to the start of the text, not the first result. Press Home again at the start — selection should jump to the first row. End at the end of the query should jump to the last row. Keypad arrows with Num Lock off should move the selection too.
8. Open the popup and immediately press the shortcut again before results appear — it must close, not stack a second backdrop.
9. Click outside the popup — it must close without crashing the shell (Clutter 18) and without activating the window underneath. On a second monitor the click must still close it. A tap on a touchscreen should dismiss the same way.
10. Type `!no-such-command` with the command runner on — the row should say Command not found. Press Enter — the popup must close and the shell must stay up.
11. Type `screenshot` and press Enter with Overview closed — the screenshot UI must open.
12. Type `localhost:3000` — a URL result should open `http://localhost:3000`. Type `::1` — it should open `http://[::1]`. Type `node.js` — it must stay an app search, not a URL. Type `nas.local` — it should open `http://nas.local`.
13. Type `.bashrc` — it must stay a normal search, not jump to recent files. Type `. notes` to force files.
14. Switch to Pop!_OS or KRunner — the popup must sit below the GNOME top bar, not under it. Set results max height to 800 on a short display — the list must stay inside the work area.
15. Type `appearance` or `wallpaper` — Settings should open the background panel. GNOME 50 has no appearance id.
16. With an IME composing a character, Enter and arrows must stay with the compose, not activate a result.
17. Change width or position in preferences while the popup is open — it should move or resize without a reopen.
18. With the command runner on, `! pwd` should print the home directory, not `/`.
19. Change resolution or unplug a monitor while the popup is open — it should move into the new work area, and click-outside should still cover every screen.
20. Toggle a provider or the web engine in preferences while the popup is open — results should update without a reopen.
21. With both Firefox and Firefox ESR installed, the one you use more should be the only Firefox row.
22. Open several windows, focus one, then open the launcher with Pop!_OS (windows first) — that window should be first in the empty-state list. Switch result order to apps first — frequent apps should lead.
23. Type `~/` then a folder that exists — it should open that path. Type `/no-such-gosh-path` — the row should say Path not found.
24. With the command runner on, `! ./` plus a script in your home directory should run, and `! ~/bin/true` should resolve if that file exists.
25. Type `camera`, `location`, or `microphone` — Privacy & Security should appear. Those are GNOME 50 privacy subpages, not separate panel ids.
26. Open windows on two workspaces — window rows should say Workspace 1 / Workspace 2. A sticky window should say On all workspaces. Typing `workspace 2` should list windows on that workspace.
27. Open a recent file under the home directory — the description should start with `~`.
28. Select a result on Fuzzel — the description must stay dark on the light selected row. On Omarchy, Raycast, and Anyrun the selected description must stay readable on the tinted row.
29. Type `firefox` while Firefox is open — a New window action should appear under Actions. Type `=0xff` — the result should be 255 with a `0xff` description. `2x3` must still evaluate to 6.
30. Type `10 km to mi` — a Units row should appear. Type `32 f to c` — the title should be `0 c`. Type `clock` — Lock Screen must not appear; a Clock row with the local time should. Type `50% of 80` — the calculator result should be 40.
31. Type `docs` — Documents should appear under Folders. Type `time` — the local time should copy with Enter. Open `~/Documents` — the path title should start with `~`.
32. Type `#ff0000` — a Color row should copy `#ff0000`. Type `# wifi` — Settings should still list Wi-Fi. Unset XDG folders that point at Home must not list Documents as a second Home.
33. Type `o` — Home must not appear just because the word contains o. Type `~` or `docs` — Home / Documents should. Type `sqrt(16)` or `2pi` — the calculator should evaluate.
34. Add a GTK bookmark under `~/.config/gtk-3.0/bookmarks` — typing part of its label should open that folder. Disable Bookmarks in Features — it should disappear.
35. Select a numbered row on Tofi, KRunner, and PowerToys — the 1–9 hint must stay readable on the selected color.
36. Type `o` with several windows open — they must not all appear just because “Workspace 1” contains o. Type `2` or `workspace 2` to find that workspace. Type `log(100)` — the result should be 2. Type `32°f to c` — the title should be `0 c`. Type `tomorrow` — the date should be tomorrow. Type `rgb(255, 0, 0)` — a Color row should copy `#ff0000`.
37. Type `firefox` with six other apps matching and Firefox as the best match — New window must still appear under Actions. Type `5!` — the result should be 120. Type `#f00f` — a Color row should copy `#ff0000`. Type `zoom` — Accessibility should appear. The About page must list PowerToys and Synapse.
38. On a short display, set results max height to 800 and a top look — the list must not grow off the work area even if the empty popup was already clamped to the bottom. Change icon size in Appearance while the popup is open — row icons should resize. Type `2*e` — Euler’s number should evaluate. Type `e` alone — it must stay an app search. Type `hsl(0, 100%, 50%)` — a Color row should copy `#ff0000`.
39. Type `sftp://` plus a host you use — it should open that location, not become a web search. Type `mailto:you@example.com` — it should offer Write email. Type `javascript:alert(1)` — it must not be a URL. Type `rgb(255 0 0)` — a Color row should copy `#ff0000`.
40. Type `close` plus an open window title — the row should say Close … and Enter should close that window. Type `kill` plus the same title — it should force-quit. Type `50%` — the calculator result should be 0.5. Type `10%3` — the result should be 1. Type `hsl(0deg 100% 50%)` — a Color row should copy `#ff0000`. On a tablet that manages orientation, type `rotation` — Lock Screen Rotation should appear.
41. Type `workspace` — open windows must not all appear. Type `workspace 2` — a Switch to Workspace 2 row should appear if that workspace exists, plus windows on that workspace.
42. With results visible, `Ctrl+j` and `Ctrl+n` should move down, `Ctrl+k` and `Ctrl+p` should move up. Typing `j` without Control must still insert the letter. Type `1 stone to kg` — a Units row should appear. If parental controls are still initialising, blocked apps must not flash in the list. After they finish, an already-open search must grow app rows without retyping.
43. Type `~/` plus an existing folder — after the exists check, Open in Terminal should appear under Open Path. Type `docs` — Documents should appear, and Open in Terminal should follow if a terminal is installed.
44. Open Appearance, change icon size, close prefs, reopen Appearance without changing the look — the custom icon size must still be there. Switch to Onagre — selected rows should be amber with dark descriptions. The About page must list Onagre.
45. Type `hwb(0 0% 0%)` or `hwb(0deg, 0%, 0%)` — a Color row should copy `#ff0000`. Arrow to a later result, then wait for recent files or a path exists-check to finish — the same row should stay selected and stay in view. Change icon size or a provider toggle while a result is selected — that row should stay selected.
46. Type `~/` plus a path — the first row must say Checking path and Enter must do nothing until the exists check finishes. A missing path must stay Path not found. Change the look with `gsettings set … launcher-theme popos` while the popup is open — it should move to the top, show number hints, and list windows first. Set a shortcut that is already taken — the previous shortcut must keep working.
47. Type `1,000 km to mi` — a Units row should appear. Type `1024 bytes to kib` — the title should be `1 kib`. Type `asin(1)` — the calculator result should be 90. Type `log2(8)` — the result should be 3. Type `round(1.5)` — the result should be 2.
48. Type `yesterday` — the date should be yesterday. Type `1e3 km to mi` — a Units row should appear. Type `yesterdays` — it must not be a clock row.
49. Open a file on an `sftp` or `smb` share, then search for its name — it should appear under Recent files with the host as the description. An `https` bookmark in `recently-used.xbel` must not appear. Type `screenshot` with Overview closed — the screenshot UI must still open.
50. Focus a terminal, then another app, then open the launcher with Pop!_OS (windows first) and an empty query — the app you just focused should be first among windows, even on Wayland.
51. Open the launcher, then lock the screen — the popup must be gone after unlock. Type `e+1` or `=e` — Euler’s number should evaluate. Type `e` alone — it must stay an app search. Type `what time is it` — a Clock row should appear. On a short display with a top look, results must stay visible (not a zero-height list).
52. With the command runner on, `!` plus a script under your home such as `scripts/true` (no `./`) should run after the exists check. A tool installed only in `~/.local/bin` should be found. On GNOME 45–47, `wellbeing` must not appear under Settings. Disable and re-enable the extension — blocked apps must stay hidden until parental controls finish again.
53. Type `-2^2` — the result should be `-4`. Type `tan(90)` or `0x` or `2foo` — those must not be calculator rows. Turn off Show web search fallback, then type `@ cats` — a web row should still appear. On Raycast and Anyrun, arrow to a later row — the selected row must be obviously different from its neighbors. In Shortcut prefs, click the shortcut row then Tab away — the label must restore the current shortcut.
54. Type `2 hours to min` — the title should be `120 min`. Type `1 acre to m2` — an area row should appear. Type `.5+1` — the calculator result should be 1.5. Type `1e` — it must stay an app search. Type `2*e` — Euler’s number should evaluate. A GTK bookmark line that is a bare `/home/…` path should open that folder.
55. Type `100 kph to mph` or `100 km/h to mph` — a speed row should appear. Type `1 m3 to l` — the title should be `1000 l`. Type `1 m² to ft2` — an area row should appear. Type `rgb(100%, 0%, 0%)` — a Color row should copy `#ff0000`. Type `what's the time` — a Clock row should appear.
56. Type `2pi^2` — the result should be about 19.74, not 39.48. Type `2^3pi` — the result should be about 25.13. Type `~/` plus a path and press Enter while it says Checking path — the popup must stay open. A missing path or `!badcmd` must also stay open.
57. Type `force quit` plus an open window title — the row should say Kill … and Enter should force-quit. A GTK bookmark line that is `~/Documents` should open that folder. A `javascript:` bookmark must not appear.
58. On a machine whose only terminal is Kitty, Ghostty, Alacritty, or Foot, `~/` plus a folder should still offer Open in Terminal after the exists check. `xdg-terminal-exec` must still win when it is installed.
59. Type `32 psi to bar` — a pressure row should appear. Type `1 atm to kpa` — the title should be about `101 kpa`. With the Pop!_OS look and number hints on, a long list should keep 1-9 visible beside the scrollbar.
60. Type `200 kcal to kj` or `200 calories to kj` — the title should be `836.8 kj`. Type `1 kwh to kj` — the title should be `3600 kj`. Type `1 hp to kw` — a power row should appear. Type `180 deg to rad` or `180° to rad` — an angle row should appear. Type `2π` or `5²` or `sin(90°)` — calculator rows should appear. Type `what time is it now` — a Clock row should appear.
61. Type `sin 90` or `sqrt 16` — calculator rows should appear. Type `1 cup to tbsp` — the title should be `16 tbsp`. Type `1 fl oz to ml` — a volume row should appear. Type `app.mjs` or `data.csv` — those must not be URL rows. With the command runner on, `!` plus a directory or a non-executable file must stay Command not found and Enter must not close the popup.
62. Type `1+2=` — the calculator result should be 3. Type `1 000 + 2` — the result should be 1002. Type `1 000 km to mi` — a Units row should appear. Type `example.com.` — a URL row should open `https://example.com`. Type `readme.md.` — it must not be a URL.
63. Type `open firefox` — Firefox (or your browser) should appear as an app, not only a web search. Type `switch to` plus an open window title — that window should appear. Type `red` or `blue` — a Color row should copy the hex. Type `1+2=3` — the calculator result should be 3. Type `force close` plus an open window title — the row should say Kill … and Enter should force-quit.

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
