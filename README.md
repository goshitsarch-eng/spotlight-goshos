# Gosh Is Launcher

A compact launcher for GNOME Shell 45 through 50. Previously named Spotlight.

[Repository](https://github.com/goshitsarch-eng/spotlight-goshos)

**Version:** 2026.08.20

## Keyboard Shortcut

`Ctrl + Space`

## Overview

Gosh Is Launcher is a keyboard-driven launcher that surfaces results the moment you begin typing. It searches installed applications, open windows, recent files, GNOME Settings panels, and arithmetic expressions. It can open URLs, run optional commands, expose system power actions, and fall back to web search when nothing local matches.

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

Picking a look applies its colors and the matching chrome (position, density, headers, number hints, icon size, and whether open windows list first). You can still override those after. There is no blur effect. COSMIC's frosted glass is a compositor feature; GNOME Shell blur is expensive and is not used. Compact density still shrinks rows on every look; it does not flatten Pop!_OS icons down to KRunner size.

## Search Priority

Results are aggregated in the following order. Each category is rendered under its own section header unless you hide headers. Web search appears only when every preceding category returned nothing, or immediately when you use the `@` prefix.

1. **URLs** — `https://…`, `www.…`, a bare domain such as `example.com`, `host:port`, `localhost`, dotted IPv4, or `[IPv6]`. Local, LAN, and IPv6 addresses open with `http`; public hosts use `https`.
2. **Applications** — Matched against every installed `.desktop` entry using prefix, word-prefix, and substring matching. Ranking combines match quality with usage frequency from `Shell.AppUsage`. Parental controls hide blocked apps.
3. **Calculator** — A recursive-descent parser evaluates the input live. Pressing `Enter` copies the result to the clipboard. Supports `+`, `-`, `*`, `/`, `%`, `^`, parentheses, and unary negation.
4. **Windows** — Switch to an open window by title or window class.
5. **System Actions** — Lock, suspend, restart, shut down, log out, switch user, and take a screenshot, only when GNOME says the action is available.
6. **GNOME Settings** — Direct navigation to Settings panels via `gnome-control-center`.
7. **Recent files** — Entries from `~/.local/share/recently-used.xbel`, loaded asynchronously so search does not block the compositor.
8. **Web Search** — Last-resort fallback in the default browser.

Before you type, the popup can show open windows and frequently used apps. Turn that off in Features if you want a blank entry.

## Prefix Modes

Walker-style prefixes jump to one provider. Disable them in Features if you never want this.

| Prefix | Provider |
|---|---|
| `=` | Calculator (`=2^8`) |
| `@` | Web search |
| `#` | GNOME Settings |
| `$` | Open windows (`$ term`, not `$HOME`) |
| `.` | Recent files (`. notes`, not `.bashrc`) |
| `!` | Run command (off by default) |

## Usage

Open the popup with `Ctrl + Space` and begin typing. Navigation is keyboard-driven.

| Action | Input |
|---|---|
| Open Gosh Is Launcher | `Ctrl + Space` |
| Launch an application | Type its name or abbreviation, then `Enter` |
| Evaluate an expression | Type the math, then `Enter` (result is copied to clipboard) |
| Switch window | Type part of the title, then `Enter` |
| Lock the screen | Type `lock`, then `Enter` |
| Open Wi-Fi settings | Type `wifi`, then `Enter` |
| Search the web | Type a query with no local matches, or `@ query` |
| Traverse results | `↑` / `↓`, `Tab`, `Page Up` / `Page Down`, `Home` / `End` |
| Activate result 1–9 | `Alt+1` … `Alt+9` when number hints are enabled |
| Dismiss | `Esc`, `Ctrl + Space`, or click outside the popup |

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
- Launcher look (Spotlight, Omarchy, Pop!_OS, Ulauncher, KRunner, GNOME, Rofi, Raycast, Albert)
- Position (center or top)
- Row density
- Result order (apps first, or windows first like Pop!_OS)
- Popup width (400–1200 px, default 600)
- Results max height (160–800 px, default 400)
- Maximum results per category (1–20, default 6)
- Search icon, section headers, result icons, descriptions, number hints
- Enable or disable every search provider
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
| `searchEntry.js` | Search input with magnifying-glass icon |
| `resultsContainer.js` | Scrollable results area |
| `scrollView.js` | GNOME 45–50 `St.ScrollView` attach, policy, and adjustment |
| `resultRow.js` | Single result row with icon, title, and optional number hint |
| `searchController.js` | Orchestrates providers and prefix modes |
| `searchPlan.js` | Feature flags and empty all-mode guard |
| `appSearch.js` | Application search via `Shell.AppSystem` |
| `windowSearch.js` | Open window switcher |
| `calculator.js` | Recursive-descent arithmetic parser |
| `themes.js` | Look catalog |
| `prefs/appearancePage.js` | Look, size, and chrome controls |
| `prefs/featuresPage.js` | Provider toggles |

## Design Principles

- **Looks are settings.** One popup, many CSS themes. No forked widget trees.
- **Dark, not black** on the Spotlight look. Background `#1c1c1e` with text `#f5f5f7`.
- **No blur, no overlay, no border** on the Spotlight look. Other looks may add a thin theme border.
- **Fixed anchor.** The popup is positioned once at open time in the primary work area (below the panel) and grows downward from that anchor.
- **Instant.** No fade-in, no slide animation.
- **GNOME 50 safe.** No X11-only APIs, no `RunDialog._restart`, no `holdKeyboard` / `releaseKeyboard`.

## Clipboard Access

This extension writes to the clipboard **only** when the user explicitly activates a calculator result by pressing `Enter` on a valid arithmetic expression. No clipboard data is ever read. No clipboard content is transmitted to any third party. This behavior is declared in `metadata.json` and is strictly user-initiated.

## GNOME 45–50

The extension lists `45` through `50` in `shell-version` and ships as one zip. The [GNOME 50 port guide](https://gjs.guide/extensions/upgrading/gnome-shell-50.html) has no `extension.js` or `prefs.js` changes that apply here. Compatibility work in this codebase:

- Skip removed X11 restart APIs (`RunDialog._restart`, `holdKeyboard` / `releaseKeyboard`).
- Keep `GLib.idle_add` instead of the 50-only `idle_add_once`.
- Honor parental-control app filtering.
- Speak both `St.ScrollView` APIs: GNOME 45 uses `get_vscroll_bar()`, GNOME 48+ uses `set_child()` and `get_vadjustment()`. All of that lives in `scrollView.js`.
- Set box-layout orientation with `set_vertical(true)` after `_init()` so GNOME 45/46 still load.
- Close the popup from an idle source after pointer and key handlers so Clutter 18 does not abort when the actor tree changes mid-event.
- Open the screenshot UI directly when Overview is already hidden. `SystemActions.activateScreenshotUI()` waits for Overview `hidden` and never fires from the launcher.

This environment cannot run a live GNOME Shell 50 Wayland session. After install, walk each look, disable a provider, and confirm Escape, click-outside, and the toggle shortcut all close the popup.

## License

GPL-3.0-or-later. See the [LICENSE](LICENSE) file for the full text.
