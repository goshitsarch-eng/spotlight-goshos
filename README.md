# Gosh Is Launcher

A compact launcher for GNOME Shell 45 through 50. Previously named Spotlight.

[Repository](https://github.com/goshitsarch-eng/spotlight-goshos)

**Version:** 2026.08.20

## Keyboard Shortcut

`Ctrl + Space`

## Overview

Gosh Is Launcher is a keyboard-driven launcher that surfaces results the moment you begin typing. It searches installed applications, open windows, recent files, XDG folders, GTK bookmarks, GNOME Settings panels, arithmetic, unit conversions, and the local clock. It can open URLs and filesystem paths, run optional commands, expose system power actions, and fall back to web search when nothing local matches.

The popup can look like several real launchers. Pick a look in preferences:

| Look | Inspired by | Notes |
|---|---|---|
| **Spotlight** | macOS Spotlight | Default. Separate pill and results card, `#1c1c1e` dark, very rounded. |
| **Omarchy** | [Walker on Omarchy Linux](https://github.com/basecamp/omarchy) | Single Tokyo Night panel (`#1a1b26`, `#7aa2f7` accent). |
| **Pop!_OS** | [COSMIC Launcher](https://system76.com/support/pop-basics/) | Single card, cooler gray, roomy rows, top-anchored, windows first, Alt+1–9 hints. |
| **Ulauncher** | [Ulauncher](https://ulauncher.io) | Warm dark panel, larger type, orange accent. |
| **KRunner** | KDE Plasma KRunner | Compact Breeze bar with a thin blue edge, top-anchored. |
| **GNOME** | GNOME overview / Adwaita | Native-feeling card with the GNOME blue accent. |
| **Rofi** | [Rofi](https://github.com/davatorium/rofi) | Square dmenu-style list, compact rows, classic `#005577` selection. |
| **Raycast** | [Raycast](https://www.raycast.com) | Dark rounded panel, red caret, larger icons, no section headers. |
| **Albert** | [Albert](https://albertlauncher.github.io) | Breeze-dark card with a `#1d99f3` selected row and section headers. |
| **Wofi** | [Wofi](https://hg.sr.ht/~scoopta/wofi) | Compact Wayland dmenu list, `#1d1f21` with `#285577` selection. |
| **Fuzzel** | [Fuzzel](https://codeberg.org/dnkl/fuzzel) | Default Solarized light frame (`#fdf6e3`, `#eee8d5` selection, 10px radius). |
| **Anyrun** | [Anyrun](https://github.com/anyrun-org/anyrun) | Catppuccin mocha panel (`#1e1e2e`, `#89b4fa` accent), no section headers. |
| **Tofi** | [Tofi](https://github.com/philj56/tofi) | Stark black dmenu bar, white selected row, top-anchored, compact. |
| **Light** | GNOME Adwaita light | Light card for a light session: `#f6f5f4` with the GNOME blue selected row. |
| **PowerToys** | [PowerToys Run](https://learn.microsoft.com/windows/powertoys/run) | Fluent dark card, `#2c2c2c`, `#0078d4` selected row, no section headers. |
| **Synapse** | [Synapse](https://launchpad.net/synapse-project) | Large-icon dark panel, Ubuntu-orange caret, 48px icons. |
| **Onagre** | [Onagre](https://github.com/oknozor/onagre) | Centered stone-dark panel, amber selected row with dark text. |

Picking a look applies its colors and the matching chrome (position, density, headers, number hints, icon size, and whether open windows list first). Changing `launcher-theme` at runtime (preferences or `gsettings`) writes that profile too. You can still override those after. There is no blur effect. COSMIC's frosted glass is a compositor feature; GNOME Shell blur is expensive and is not used. Compact density still shrinks rows on every look; it does not flatten Pop!_OS icons down to KRunner size.

## Search Priority

Results are aggregated in the following order. Each category is rendered under its own section header unless you hide headers. Web search appears only when every preceding category returned nothing, or immediately when you use the `@` prefix.

1. **URLs** — `https://…`, `www.…`, a bare domain such as `example.com`, `host:port`, `localhost`, dotted IPv4, `[IPv6]`, or `*.local`. Also `sftp://`, `smb://`, `mailto:`, and `magnet:`. Local, LAN, mDNS, and IPv6 addresses open with `http`; public hosts use `https`. `javascript:` is rejected. Names that look like files (`node.js`, `readme.md`) stay app and file searches.
2. **Paths** — `~/…`, `./…`, and absolute paths such as `/tmp/notes.txt`. `~` and `./` resolve against the user home directory. Existing paths under the home directory show a collapsed `~/` title. Missing paths show “Path not found”. A directory also offers **Open in Terminal** (`xdg-terminal-exec`, then Ptyxis, Console, or GNOME Terminal).
3. **Folders** — XDG user folders: Home, Desktop, Documents, Downloads, Music, Pictures, Videos, Public, Templates. Typing `docs` or `downloads` opens that folder. The first match also offers Open in Terminal. A single letter only matches a prefix, so `o` does not list Home.
4. **Bookmarks** — Folders saved in `~/.config/gtk-3.0/bookmarks` and `~/.config/gtk-4.0/bookmarks`, loaded asynchronously. Remote URIs such as `sftp://` are included.
5. **Applications** — Matched against every installed `.desktop` entry using prefix, word-prefix, and substring matching on the name, plus GenericName, Keywords, and the desktop Comment so `browser` finds Firefox. Ranking combines match quality with usage frequency from `Shell.AppUsage`, then collapses variants (`Firefox` / `Firefox ESR`) so the used app wins. Parental controls hide blocked apps. Running apps say “Switch to application”. The best match can also list **New window** and desktop-file actions (Private Window, New Document). Turn those off in Features.
6. **Calculator** — A recursive-descent parser evaluates the input live. Pressing `Enter` copies the result to the clipboard. Supports `+`, `-`, `*`, `/`, `%`, `^`, `!` (factorial), parentheses, unary negation, unicode `×` `÷` `−` `√`, thousands commas (`1,000+2`), hex (`0xff+1`), binary (`0b1010`), postfix percent (`50%` is `0.5`; `10%3` stays modulo), `50% of 80`, constants (`pi`, and `e` in an expression such as `2*e`), functions (`sqrt`, `cbrt`, `abs`, `log`, `log2`, `ln`, `sin`, `cos`, `tan`, `asin`, `acos`, `atan` in degrees, `round`, `floor`, `ceil`), and implicit multiplication (`2pi`, `2(3+1)`). A bare number such as `42` or `0xff` is not math unless you prefix it (`=42`). Bare `e` stays an app search. Integer results show the hex form in the description.
7. **Units** — Conversions such as `10 km to mi`, `1,000 km to mi`, `1e3 km to mi`, `32 f in c`, `32°f to c`, `1 stone to kg`, `1 nmi to km`, `1024 bytes to kib`, and `1 gb to mib`. Length, mass, temperature, US volume, and SI/IEC data sizes. Press `Enter` to copy the converted value.
8. **Color** — A hash hex such as `#f00`, `#ff0000`, `#f00f`, or `#ff000080`, or `rgb(255, 0, 0)` / `rgb(255 0 0)` / `hsl(0, 100%, 50%)` / `hsl(0deg 100% 50%)` / `hwb(0 0% 0%)` / `hwb(0deg, 0%, 0%)`, copies the 6-digit color. `# wifi` is still the Settings prefix; `#ff0000` is not.
9. **Clock** — Type `time`, `now`, `date`, `today`, `tomorrow`, `yesterday`, or `clock` to copy the local time or date. Uses the session timezone via `GLib.DateTime`.
10. **Windows** — Switch to an open window by title, window class, or workspace number (`2`, `workspace 2`, or `ws 2`), including modal dialogs. Results are ordered by last user focus, not compositor stacking. The description shows the workspace number, or “On all workspaces” for sticky windows. The shared `Workspace N` label is not a free-text match, so `workspace` or `spa` does not list every window. Type `workspace 2` to switch to that workspace. Type `close firefox` or `quit firefox` to ask matching windows to close. Type `kill firefox` to force-quit them.
11. **System Actions** — Lock, suspend, restart, shut down, log out, switch user, lock screen rotation (tablets), and take a screenshot, only when GNOME says the action is available.
12. **GNOME Settings** — Direct navigation to Settings panels via `gnome-control-center`, or the panel desktop file / Settings app if that binary is missing. Appearance and wallpaper both open the `background` panel, which is the id GNOME 50 still ships. Camera, microphone, location, thunderbolt, and firmware open Privacy & Security because those are subpages, not launchable panel ids.
13. **Recent files** — Entries from `~/.local/share/recently-used.xbel`, loaded asynchronously so search does not block the compositor. Local `file:` paths and remote `sftp` / `smb` / `ftp` / `davs` locations are included. `http(s)` and `javascript:` bookmarks in the same file are ignored. Icons follow the file extension. The description is the parent folder (or the remote host), with the home directory collapsed to `~`. Folder names are searchable too.
14. **Web Search** — Last-resort fallback in the default browser.

Before you type, the popup can show frequently used apps and open windows. Windows-first looks (Pop!_OS) put windows above apps here too. Turn that off in Features if you want a blank entry.

## Prefix Modes

Walker-style prefixes jump to one provider. Disable them in Features if you never want this.

| Prefix | Provider |
|---|---|
| `=` | Calculator (`=2^8`) |
| `@` | Web search |
| `#` | GNOME Settings (`# wifi`, not `#ff0000`) |
| `$` | Open windows (`$ term`, not `$HOME`) |
| `.` | Recent files (`. notes`, not `.bashrc`) |
| `!` | Run command (off by default) |

## Usage

Open the popup with `Ctrl + Space` and begin typing. Navigation is keyboard-driven.

| Action | Input |
|---|---|
| Open Gosh Is Launcher | `Ctrl + Space` |
| Open a path | Type `~/Documents` or `/tmp`, then `Enter` |
| Launch an application | Type its name or abbreviation, then `Enter` |
| Evaluate an expression | Type `12*8+3`, `sqrt(16)`, or `2pi`, then `Enter` (result is copied to clipboard) |
| Convert units | Type `10 km to mi` or `32 f to c`, then `Enter` |
| Open Documents | Type `docs`, then `Enter` |
| Open a bookmark | Type part of a GTK bookmark label, then `Enter` |
| Copy the time | Type `time` or `now`, then `Enter` |
| Copy tomorrow or yesterday | Type `tomorrow` or `yesterday`, then `Enter` |
| Copy a color | Type `#ff0000`, `rgb(255, 0, 0)`, or `hwb(0 0% 0%)`, then `Enter` |
| Switch window | Type part of the title, then `Enter` |
| Lock the screen | Type `lock`, then `Enter` |
| Open Wi-Fi settings | Type `wifi`, then `Enter` |
| Search the web | Type a query with no local matches, or `@ query` |
| Traverse results | `↑` / `↓`, `Tab`, `Page Up` / `Page Down`, or `Ctrl+j` / `Ctrl+k` (also `Ctrl+n` / `Ctrl+p`). `Home` / `End` jump to the first or last row only when the caret is already at that edge of the query. |
| Activate result 1–9 | `Alt+1` … `Alt+9` when number hints are enabled |
| Dismiss | `Esc`, `Ctrl + Space`, or click / tap outside the popup. The press is claimed so the window underneath does not activate. |

## Installation

### From a zip

```bash
gnome-extensions install ~/Downloads/gosh-is-launcher@nin.zip
# On Wayland sessions, log out and back in
gnome-extensions enable gosh-is-launcher@nin
```

### From this repository

```bash
mkdir -p ~/.local/share/gnome-shell/extensions/gosh-is-launcher@nin
cp -r * ~/.local/share/gnome-shell/extensions/gosh-is-launcher@nin/
glib-compile-schemas ~/.local/share/gnome-shell/extensions/gosh-is-launcher@nin/schemas/
gnome-extensions enable gosh-is-launcher@nin
```

On Wayland, log out and back in after the first install.

If you still have the old `spotlight@nin` extension installed, disable and remove it first. Settings do not migrate because the schema id changed with the rename.

## Preferences

```bash
gnome-extensions prefs gosh-is-launcher@nin
```

Configurable options:

- Toggle keyboard shortcut
- Launcher look (Spotlight, Omarchy, Pop!_OS, Ulauncher, KRunner, GNOME, Rofi, Raycast, Albert, Wofi, Fuzzel, Anyrun, Tofi, Light, PowerToys, Synapse, Onagre)
- Position (center or top)
- Row density
- Result order (apps first, or windows first like Pop!_OS)
- Popup width (400–1200 px, default 600)
- Results max height (160–800 px, default 400)
- Result icon size (16–64 px, default 28; each look sets this)
- Maximum results per category (1–20, default 6)
- Search icon, section headers, result icons, descriptions, number hints
- Enable or disable every search provider, plus application actions, unit conversion, colors, folders, GTK bookmarks, and the clock (changes apply while the popup is open and keep the selected row)
- Prefix modes and empty-state suggestions
- Web search engine (Google, DuckDuckGo, Brave, Bing, Startpage, Ecosia, Qwant, Kagi, Wikipedia)
- Whether to display the web search fallback at all

## Architecture

The shell process loads root-level JavaScript. The preferences process loads `prefs.js` and `prefs/*.js`. Shared catalogs such as `themes.js` and `webEngines.js` are pure data so both processes can import them without crossing the GTK / Clutter isolation boundary.

| File | Responsibility |
|---|---|
| `extension.js` | Entry point — constructs the popup and registers the keybinding |
| `prefs.js` | Preferences window entry point |
| `launcherPopup.js` | Popup widget — open/close, theme chrome, positioning |
| `popupPosition.js` | Work-area origin so top looks sit below the panel |
| `backdropBox.js` | Multi-monitor box for click-outside |
| `searchEntry.js` | Search input with magnifying-glass icon |
| `resultsContainer.js` | Scrollable results area |
| `scrollView.js` | GNOME 45–50 `St.ScrollView` attach, policy, and adjustment |
| `resultRow.js` | Single result row with icon, title, and optional number hint |
| `labelEllipsize.js` | One-line ellipsis so long titles do not widen the popup |
| `entryPreedit.js` | IME preedit so stage capture does not steal compose keys |
| `searchController.js` | Orchestrates providers and prefix modes |
| `searchPlan.js` | Feature flags and empty all-mode guard |
| `appSearch.js` | Application search via `Shell.AppSystem` |
| `appAction.js` | New window and desktop-file action labels |
| `windowSearch.js` | Open window switcher |
| `windowClose.js` | `close` / `quit` / `kill` window queries |
| `workspaceQuery.js` | `workspace 2` switch-to-workspace queries |
| `appReady.js` | Hide apps until parental controls finish initialising |
| `terminalLaunch.js` | Open a folder in a terminal |
| `resultActivate.js` | Activate a result without taking down the shell |
| `pathSearch.js` | Open `~/` `./` and absolute paths |
| `homePath.js` | Expand home-relative command and path names |
| `calculator.js` | Recursive-descent arithmetic parser |
| `unitMatch.js` | Length, mass, temperature, volume, and data conversions |
| `placeMatch.js` | XDG user folder catalog |
| `bookmarkParse.js` | GTK 3/4 bookmark file parsing |
| `bookmarksSearch.js` | GTK bookmark provider |
| `timeMatch.js` | Time and date query matching |
| `colorMatch.js` | Hex, rgb, hsl, and hwb color normalization |
| `paintSelection.js` | Keep the selected row across an async or prefs refresh |
| `themes.js` | Look catalog |
| `prefs/appearancePage.js` | Look, size, and chrome controls |
| `prefs/featuresPage.js` | Provider toggles |

## Design Principles

- **Looks are settings.** One popup, many CSS themes. No forked widget trees.
- **Dark, not black** on the Spotlight look. Background `#1c1c1e` with text `#f5f5f7`.
- **No blur, no overlay, no border** on the Spotlight look. Other looks may add a thin theme border.
- **Fixed anchor.** The popup is positioned once at open time in the primary work area (below the panel) and grows downward from that anchor. If the chosen width is wider than the work area, the popup shrinks to fit.
- **Instant.** No fade-in, no slide animation.
- **GNOME 50 safe.** No X11-only APIs, no `RunDialog._restart`, no `holdKeyboard` / `releaseKeyboard`.

## Clipboard Access

This extension writes to the clipboard **only** when the user explicitly activates a calculator, unit-conversion, color, or time/date result by pressing `Enter`. No clipboard data is ever read. No clipboard content is transmitted to any third party. This behavior is declared in `metadata.json` and is strictly user-initiated.

## GNOME 45–50

The extension lists `45` through `50` in `shell-version` and ships as one zip. The [GNOME 50 port guide](https://gjs.guide/extensions/upgrading/gnome-shell-50.html) has no `extension.js` or `prefs.js` changes that apply here. Compatibility work in this codebase:

- Skip removed X11 restart APIs (`RunDialog._restart`, `holdKeyboard` / `releaseKeyboard`).
- Keep `GLib.idle_add` instead of the 50-only `idle_add_once`.
- Honor parental-control app filtering.
- Speak both `St.ScrollView` APIs: GNOME 45 uses `get_vscroll_bar()`, GNOME 48+ uses `set_child()` and `get_vadjustment()`. All of that lives in `scrollView.js`.
- Set box-layout orientation with `set_vertical(true)` after `_init()` so GNOME 45/46 still load.
- Close the popup from an idle source after pointer and key handlers so Clutter 18 does not abort when the actor tree changes mid-event.
- Open the screenshot UI directly when Overview is already hidden. `SystemActions.activateScreenshotUI()` waits for Overview `hidden` and never fires from the launcher. If `Screenshot.showScreenshotUI` is missing, fall back to SystemActions.
- Prefer `Meta.Display.list_all_windows()` for window search when it exists so closed actors are not listed.
- Stage-level key capture yields while an IME has a preedit so Enter commits the compose instead of launching a result.
- Recent-file exists checks settle after 800ms so a hung network path cannot stall the provider.
- `!` commands run from the user home directory. gnome-shell's own cwd is often `/`. `~/` and `./` in the command are expanded against that home. Slash paths are checked asynchronously so a hung network binary cannot stall the compositor.
- Typed `~/` `./` and absolute paths open in the default handler. Existence is checked asynchronously so a hung network mount cannot stall the compositor.
- A `monitors-changed` signal refits the backdrop and popup so an open launcher does not stay on a disconnected display.
- Results max height shrinks when the remaining work area is shorter than the setting so top looks cannot grow off the bottom.
- Click-outside claims the pointer press (and touch begin) so Wayland cannot deliver that click to the window below after the popup closes.
- Provider and web-engine preference changes repaint an open popup without a reopen and keep the selected row.
- Changing `launcher-theme` at runtime applies that look's chrome (position, density, headers, number hints, icon size, result order), not only the CSS class.
- Typed paths and slash-path `!` commands stay non-activatable until the exists check finishes.
- A shortcut that fails to grab keeps the previous working grab instead of leaving the launcher mute.
- Async recent-file, path, bookmark, and command refreshes keep the selected row instead of jumping to the first result.
- Calculator and web prefix queries do not refresh `recently-used.xbel`.

This environment cannot run a live GNOME Shell 50 Wayland session. After install, walk each look, disable a provider, and confirm Escape, click-outside, and the toggle shortcut all close the popup.

## License

GPL-3.0-or-later. See the [LICENSE](LICENSE) file for the full text.
