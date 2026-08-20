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
| **KRunner** | KDE Plasma KRunner | Compact Breeze bar with a thin blue edge, top-anchored, Alt+1–9 hints. |
| **GNOME** | GNOME overview / Adwaita | Native-feeling card that follows the session accent (GNOME 47+). |
| **Rofi** | [Rofi](https://github.com/davatorium/rofi) | Square dmenu-style list, compact rows, classic `#005577` selection. |
| **Raycast** | [Raycast](https://www.raycast.com) | Dark rounded panel, red caret, larger icons, no section headers. |
| **Albert** | [Albert](https://albertlauncher.github.io) | Breeze-dark card with a `#1d99f3` selected row and section headers. |
| **Wofi** | [Wofi](https://hg.sr.ht/~scoopta/wofi) | Compact Wayland dmenu list, `#1d1f21` with `#285577` selection. |
| **Fuzzel** | [Fuzzel](https://codeberg.org/dnkl/fuzzel) | Default Solarized light frame (`#fdf6e3`, `#eee8d5` selection, 10px radius). |
| **Anyrun** | [Anyrun](https://github.com/anyrun-org/anyrun) | Catppuccin mocha panel (`#1e1e2e`, `#89b4fa` accent), no section headers. |
| **Tofi** | [Tofi](https://github.com/philj56/tofi) | Stark black dmenu bar, white selected row, top-anchored, compact. |
| **Light** | GNOME Adwaita light | Light card for a light session: `#f6f5f4` with the session accent on the selected row. |
| **PowerToys** | [PowerToys Run](https://learn.microsoft.com/windows/powertoys/run) | Fluent dark card, `#2c2c2c`, `#0078d4` selected row, Alt+1–9 hints, no section headers. |
| **Synapse** | [Synapse](https://launchpad.net/synapse-project) | Large-icon dark panel, Ubuntu-orange caret, 48px icons. |
| **Onagre** | [Onagre](https://github.com/oknozor/onagre) | Centered stone-dark panel, amber selected row with dark text. |

Picking a look applies its colors and the matching chrome (position, density, headers, number hints, search icon, result icons, descriptions, icon size, and whether open windows list first). Changing `launcher-theme` at runtime (preferences or `gsettings`) writes that profile too. A look change written while the extension is disabled still applies on the next enable. You can still override those after. There is no blur effect. COSMIC's frosted glass is a compositor feature; GNOME Shell blur is expensive and is not used. Compact density still shrinks rows on every look; it does not flatten Pop!_OS icons down to KRunner size.

## Search Priority

Results are aggregated in the following order. Each category is rendered under its own section header unless you hide headers. Web search appears only when every preceding category returned nothing, or immediately when you use the `@` prefix.

1. **URLs** — `https://…`, `www.…`, a bare domain such as `example.com` or `example.com.`, `host:port`, `localhost`, dotted IPv4, `[IPv6]`, or `*.local`. Also `sftp://`, `smb://`, `mailto:`, and `magnet:`. Pasted `file:///…/My Documents` and `file://nas/Public Share` (and `file://localhost/…`) are locations; spaces are encoded before Gio opens them. `https://…` with a space is still not a URL. Local, LAN, mDNS, and IPv6 addresses open with `http`; public hosts use `https`. A trailing FQDN dot is stripped. `javascript:` is rejected. Names that look like files (`node.js`, `readme.md`, `app.mjs`, `data.csv`) stay app and file searches.
2. **Paths** — `~/…`, `./…`, and absolute paths such as `/tmp/notes.txt`. `~` and `./` resolve against the user home directory. Existing paths under the home directory show a collapsed `~/` title. Missing paths show “Path not found”. A directory also offers **Open in Terminal** (`xdg-terminal-exec`, then Ptyxis, Console, GNOME Terminal, Ghostty, Kitty, Alacritty, Foot, WezTerm, Tilix, or Black Box).
3. **Folders** — XDG user folders: Home, Desktop, Documents, Downloads, Music, Pictures, Videos, Public, Templates. Typing `docs`, `downloads`, `open my documents`, `open the pictures folder`, or `open pictures dir` opens that folder. The first match also offers Open in Terminal. A single letter only matches a prefix, so `o` does not list Home.
4. **Bookmarks** — Folders saved in `~/.config/gtk-3.0/bookmarks` and `~/.config/gtk-4.0/bookmarks`, loaded asynchronously. Bare `/home/…` and `~/…` lines become `file://` URIs. Existing `file://` lines with spaces are re-encoded so Gio can open them. Remote URIs such as `sftp://` are included. `javascript:` is rejected.
5. **Applications** — Matched against every installed `.desktop` entry using prefix, word-prefix, and substring matching on the name, plus GenericName, Keywords, and the desktop Comment so `browser` finds Firefox. Desktop ids match the last component and dotted words (`mozilla`, `nautilus`) so `org` does not list every app. GenericName and Comment are phrases, not haystacks, so `ows` does not hit Web Browser. Multi-word queries such as `chrome browser` or `firefox browser` match when each word hits a field. `open firefox`, `can you open firefox`, `please open firefox`, `launch firefox`, `run firefox`, `start firefox`, `open up firefox`, `start up firefox`, `fire up firefox`, `execute firefox`, `find firefox`, `search for firefox`, and `find windows firefox` strip the polite prefix, verb, and a category word so the app still matches. `open source`, `open office`, and `open vpn` stay as names. Ranking combines match quality with usage frequency from `Shell.AppUsage`, then collapses variants (`Firefox` / `Firefox ESR`) so the used app wins. Parental controls hide blocked apps. Running apps say “Switch to application”. The best match can also list **New window** and desktop-file actions (Private Window, New Document). Turn those off in Features.
6. **Calculator** — A recursive-descent parser evaluates the input live. Pressing `Enter` copies the result to the clipboard. Supports `+`, `-`, `*`, `/`, `%`, `^`, `!` (factorial), parentheses, unary negation, unicode `×` `÷` `−` `√` `π` `²` `³` `°`, thousands commas (`1,000+2`) and spaces (`1 000 + 2`), a trailing `=` from a paste (`1+2=` or `1+2=3`), leading decimals (`.5+1`), hex (`0xff+1`), binary (`0b1010`), postfix percent (`50%` is `0.5`; `10%3` stays modulo), `50% of 80`, constants (`pi`, and `e` in an expression such as `2*e`, `e+1`, or `=e`), functions (`sqrt`, `cbrt`, `abs`, `log`, `log2`, `ln`, `sin`, `cos`, `tan`, `asin`, `acos`, `atan` in degrees, `round`, `floor`, `ceil`; parentheses optional so `sin 90` and `sqrt 16` work), and implicit multiplication (`2pi`, `2π`, `2(3+1)`, `2pi^2` is `2` times `pi` squared). `-2^2` is `-4`. `tan(90)` is rejected. Incomplete tokens such as `0x`, `1e`, or `2foo` are not math. A bare number such as `42` or `0xff` is not math unless you prefix it (`=42`). Bare `e` stays an app search. Spoken queries such as `what is 2+2`, `what is the answer to 2+2`, `calculate 2+2`, `2 plus 2`, `two plus two`, `2 add 3`, `8 subtract 3`, `10 minus 3`, `4 times 5`, `8 divided by 2`, `8 over 2`, `5 squared`, `2 cubed`, `2 to the power of 8`, `2 to the 8th`, `2 to the eighth`, `half of 80`, `square root of 16`, `three thousand + 1`, `twenty plus two`, `one hundred + 1`, `a hundred + 1`, `one hundred twenty`, `one hundred and twenty`, `one thousand two hundred`, `two million`, `a million`, `five hundred million`, and `negative 3 plus 5` still evaluate. Integer results show the hex form in the description.
7. **Units** — Conversions such as `10 km to mi`, `ten km to mi`, `thirteen km to mi`, `three thousand km to mi`, `twenty km to mi`, `one hundred twenty km to mi`, `one thousand two hundred km to mi`, `two million km to mi`, `10 kms to mi`, `1/2 cup to ml`, `10 km into mi`, `convert 10 km to mi`, `how many miles in 10 km`, `how many miles in ten km`, `how many km in a mile`, `how many miles are there in 10 km`, `a cup to ml`, `1,000 km to mi`, `1 000 km to mi`, `1e3 km to mi`, `.5 km to m`, `2 hours to min`, `100 kph to mph`, `100 km/h to mph`, `1 acre to m2`, `1 m³ to l`, `32 f in c`, `32°f to c`, `1 stone to kg`, `1 nmi to km`, `1024 bytes to kib`, `1 gb to mib`, `1 cup to tbsp`, and `1 fl oz to ml`. Length, mass, temperature, US volume (including `tbsp`, `tsp`, and fluid ounces), SI/IEC data sizes, duration, area, speed, pressure (`32 psi to bar`), energy (`200 kcal to kj`, `1 kwh to kj`), power (`1 hp to kw`), and angle (`180 deg to rad`, `180° to rad`). Press `Enter` to copy the converted value. Minutes use `min`, not `m` (meters). `cal` is the thermochemical calorie; `calories` / `kcal` is the food calorie. Unicode `²` / `³` and slash speeds (`km/h`, `m/s`) are accepted.
8. **Color** — A hash hex such as `#f00`, `#ff0000`, `#f00f`, or `#ff000080`, or `rgb(255, 0, 0)` / `rgb 255 0 0` / `rgb 255, 0, 0` / `rgba 255 0 0 0.5` / `rgb(255 0 0)` / `rgb(100%, 0%, 0%)` / `rgb 100% 0% 0%` / `hsl(0, 100%, 50%)` / `hsl 0 100% 50%` / `hsl 0, 100%, 50%` / `hsl(0 100 50)` / `hsl(0deg 100% 50%)` / `hwb(0 0% 0%)` / `hwb 0 0% 0%` / `hwb 0, 0%, 0%` / `hwb(0deg, 0%, 0%)`, or a CSS name such as `red` or `blue`, copies the 6-digit color. `# wifi` is still the Settings prefix; `#ff0000` is not.
9. **Clock** — Type `time`, `now`, `what time is it`, `what's the time right now`, `show me the time`, `tell me the time`, `tell me what time it is`, `what time is it now`, `what's the time`, `date`, `today`, `today's date`, `what day is it`, `what's the day`, `tell me the day`, `tomorrow`, `yesterday`, or `clock` to copy the local time or date. Uses the session timezone via `GLib.DateTime`.
10. **Windows** — Switch to an open window by title, window class, or workspace number (`2`, `workspace 2`, `workspace two`, `workspace twenty`, or `ws 2`), including modal dialogs. Window classes match the last component and dotted words, so `org` does not list every `org.*` window. `switch to firefox`, `go to firefox`, `focus firefox`, and `find windows firefox` strip the verb and category word. Results are ordered by GNOME’s alt-tab list (`get_tab_list`) so Wayland still shows most-recently focused first when `get_user_time()` is 0. The description shows the workspace number, or “On all workspaces” for sticky windows. The shared `Workspace N` label is not a free-text match, so `workspace` or `spa` does not list every window. Type `workspace 2` to switch to that workspace. Type `close firefox`, `close the firefox window`, `close the firefox application`, or `can you close firefox` to ask matching windows to close. Type `kill firefox`, `force quit firefox`, or `force close firefox` to force-quit them.
11. **System Actions** — Lock, suspend, restart, power off, log out, switch user, lock or unlock screen rotation (tablets), and take a screenshot, only when GNOME says the action is available. Titles and icons come from `SystemActions.getName` / `getIconName` so they match Overview search, including the live Lock/Unlock rotation label. Spoken queries such as `lock the screen`, `lock now`, `unlock`, `lock orientation`, `shut down the computer`, `power off`, `turn off`, `sign out`, and `sign off` match. `can you open firefox` and `please open firefox` strip the polite prefix and launch verb.
12. **GNOME Settings** — Direct navigation to Settings panels via `gnome-control-center`, or the panel desktop file / Settings app if that binary is missing. `open wifi settings` and `open display preferences` strip the trailing noun. Appearance and wallpaper both open the `background` panel, which is the id GNOME 50 still ships. Camera, microphone, location, thunderbolt, and firmware open Privacy & Security because those are subpages, not launchable panel ids.
13. **Recent files** — Entries from `~/.local/share/recently-used.xbel`, loaded asynchronously so search does not block the compositor. Local `file:` paths and remote `sftp` / `smb` / `ftp` / `davs` locations are included. Spaced `file://` and `sftp://` hrefs are encoded before the exists check and before launch. `http(s)` and `javascript:` bookmarks in the same file are ignored. Icons follow the file extension. The description is the parent folder (or the remote host), with the home directory collapsed to `~`. Folder names are searchable too.
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
| `!` | Run command (off by default). This is argv, not a shell — pipes stay literal. `~/.local/bin`, Flatpak exports, `~/.cargo/bin`, `~/go/bin`, and `~/bin` are searched. Home-relative names such as `scripts/deploy` resolve against `$HOME`. |

## Usage

Open the popup with `Ctrl + Space` and begin typing. Navigation is keyboard-driven.

| Action | Input |
|---|---|
| Open Gosh Is Launcher | `Ctrl + Space` |
| Open a path | Type `~/Documents` or `/tmp`, then `Enter` |
| Launch an application | Type its name or abbreviation, then `Enter` |
| Evaluate an expression | Type `12*8+3`, `sqrt(16)`, `2pi`, `two plus two`, or `2 to the 8th`, then `Enter` (result is copied to clipboard) |
| Convert units | Type `10 km to mi` or `32 f to c`, then `Enter` |
| Open Documents | Type `docs`, then `Enter` |
| Open a bookmark | Type part of a GTK bookmark label, then `Enter` |
| Copy the time | Type `time`, `now`, `what time is it`, `tell me what time it is`, or `what time is it now`, then `Enter` |
| Copy tomorrow or yesterday | Type `tomorrow` or `yesterday`, then `Enter` |
| Copy a color | Type `#ff0000`, `rgb 255 0 0`, or `hwb(0 0% 0%)`, then `Enter` |
| Switch window | Type part of the title, or `find windows` plus that title, then `Enter` |
| Lock the screen | Type `lock`, then `Enter` |
| Open Wi-Fi settings | Type `wifi`, then `Enter` |
| Search the web | Type a query with no local matches, or `@ query` |
| Traverse results | `↑` / `↓`, `Tab`, `Page Up` / `Page Down`, or `Ctrl+j` / `Ctrl+k` (also `Ctrl+n` / `Ctrl+p`). `Home` / `End` jump to the first or last row only when the caret is already at that edge of the query. |
| Activate a result | Click or tap the row, or press `Enter` |
| Activate result 1–9 | `Alt+1` … `Alt+9` when number hints are enabled. That numbered row must be ready; a pending Checking path slot does not fall through to the next app. |
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
bash scripts/install.sh
gnome-extensions enable gosh-is-launcher@nin
```

`scripts/install.sh` packs the same files as the EGO zip and extracts them into `~/.local/share/gnome-shell/extensions/gosh-is-launcher@nin/`. That keeps `tests/`, `scripts/`, and other repository files out of the installed UUID.

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
- Search icon, section headers, result icons, descriptions, number hints. Hiding the magnifier still insets the query so Rofi, Wofi, Tofi, Fuzzel, and Anyrun do not flush text against the card.
- Enable or disable every search provider, plus application actions, unit conversion, colors, folders, GTK bookmarks, and the clock (changes apply while the popup is open and keep the selected row)
- Prefix modes and empty-state suggestions (capped at Maximum results, including Pop!_OS windows-first)
- Web search engine (Google, DuckDuckGo, Brave, Bing, Startpage, Ecosia, Qwant, Kagi, Wikipedia)
- Whether to display the web search fallback at all (the `@` prefix still searches the web)

## Architecture

The shell process loads root-level JavaScript. The preferences process loads `prefs.js` and `prefs/*.js`. Shared catalogs such as `themes.js` and `webEngines.js` are pure data so both processes can import them without crossing the GTK / Clutter isolation boundary.

| File | Responsibility |
|---|---|
| `extension.js` | Entry point — constructs the popup and registers the keybinding |
| `prefs.js` | Preferences window entry point |
| `launcherPopup.js` | Popup widget — open/close, theme chrome, positioning |
| `popupPosition.js` | Work-area origin so top looks sit below the panel |
| `popupChrome.js` | `addTopChrome` so always-on-top windows do not cover the launcher |
| `unredirect.js` | Hold compositor unredirect while open so fullscreen windows cannot hide the popup |
| `backdropBox.js` | Multi-monitor box for click-outside |
| `searchEntry.js` | Search input with magnifying-glass icon |
| `resultsContainer.js` | Scrollable results area |
| `scrollView.js` | GNOME 45–50 `St.ScrollView` attach, policy, and adjustment |
| `navRepeat.js` | Drop duplicate arrow presses without `Clutter.Event.get_time()` |
| `resultRow.js` | Single result row with icon, title, and optional number hint |
| `labelEllipsize.js` | One-line ellipsis so long titles do not widen the popup |
| `entryPreedit.js` | IME preedit so stage capture does not steal compose keys |
| `searchController.js` | Orchestrates providers and prefix modes |
| `searchPlan.js` | Feature flags, spoken-query rewrites, and empty all-mode guard |
| `searchRun.js` | Runs the planned providers and collects rows |
| `prefixParser.js` | `=` `@` `#` `$` `.` `!` prefix tokens |
| `appSearch.js` | Application search via `Shell.AppSystem` |
| `appAction.js` | New window and desktop-file action labels |
| `appInfo.js` | Skip missing desktop-only `GAppInfo` methods so one bad app cannot hide the rest |
| `windowSearch.js` | Open window switcher |
| `windowClose.js` | `close` / `quit` / `kill` window queries |
| `workspaceQuery.js` | `workspace 2` switch-to-workspace queries |
| `appReady.js` | Hide apps until parental controls finish, then show if malcontent never answers |
| `terminalLaunch.js` | Open a folder in a terminal |
| `resultActivate.js` | Activate a result without taking down the shell |
| `pathSearch.js` | Open `~/` `./` and absolute paths |
| `homePath.js` | Expand home-relative command and path names, including `scripts/deploy` |
| `userPath.js` | Extra directories the GNOME Shell PATH often omits (`~/.local/bin`, Flatpak, `~/go/bin`) |
| `commandSearch.js` | `!` argv command runner |
| `calculator.js` | Recursive-descent arithmetic parser |
| `numberWords.js` | Spoken cardinals and ordinal powers shared by math and units |
| `unitMatch.js` | Length, mass, temperature, volume, data, energy, power, and angle conversions |
| `placeMatch.js` | XDG user folder catalog |
| `bookmarkParse.js` | GTK 3/4 bookmark file parsing |
| `bookmarksSearch.js` | GTK bookmark provider |
| `timeMatch.js` | Time and date query matching |
| `timeSearch.js` | Clock and calendar provider |
| `colorMatch.js` | Hex, rgb, hsl, hwb, and CSS name normalization |
| `colorSearch.js` | Color copy provider |
| `recentFilesSearch.js` | Recently used files from `recently-used.xbel` |
| `paintSelection.js` | Keep the selected row across an async or prefs refresh |
| `asyncPaint.js` | Whether a Gio finish may schedule a result repaint |
| `resultIcon.js` | Skip a null app `gicon` so `St.Icon` can construct |
| `themes.js` | Look catalog |
| `prefs/appearancePage.js` | Look, size, and chrome controls |
| `prefs/featuresPage.js` | Provider toggles |

## Design Principles

- **Looks are settings.** One popup, many CSS themes. No forked widget trees.
- **Dark, not black** on the Spotlight look. Background `#1c1c1e` with text `#f5f5f7`.
- **No blur, no overlay, no border** on the Spotlight look. Other looks may add a thin theme border.
- **Fixed anchor.** The popup is positioned once at open time in the primary work area (below the panel) and grows downward from that anchor. If the remaining space below that origin cannot hold a usable list, the origin lifts so results stay visible. If the chosen width is wider than the work area, the popup shrinks to fit. Width is CSS pixels: on a 200% session `set_width` is multiplied by the St scale factor so the popup is not half-size, and results `max-height` is converted back to CSS pixels so the list cannot overflow.
- **Instant.** No fade-in, no slide animation.
- **GNOME 50 safe.** No X11-only APIs, no `RunDialog._restart`, no `holdKeyboard` / `releaseKeyboard`.

## Clipboard Access

This extension writes to the clipboard **only** when the user explicitly activates a calculator, unit-conversion, color, or time/date result by pressing `Enter`. No clipboard data is ever read. No clipboard content is transmitted to any third party. This behavior is declared in `metadata.json` and is strictly user-initiated.

## GNOME 45–50

The extension lists `45` through `50` in `shell-version` and ships as one zip. The [GNOME 50 port guide](https://gjs.guide/extensions/upgrading/gnome-shell-50.html) has no `extension.js` or `prefs.js` changes that apply here. Compatibility work in this codebase:

- Skip removed X11 restart APIs (`RunDialog._restart`, `holdKeyboard` / `releaseKeyboard`).
- Keep `GLib.idle_add` instead of the 50-only `idle_add_once`.
- Honor parental-control app filtering. Repaint when `app-filter-changed` fires. If malcontent never finishes, show unfiltered desktop apps after five seconds rather than an empty launcher. Disable resets that give-up flag.
- Feature-detect `get_keywords`, `get_generic_name`, and `list_actions`. GNOME 50 can type `AppSystem.get_installed()` entries as `GAppInfo`, and those desktop-only methods are then missing. Skip a desktop file whose `get_id()` throws (invalid encoding) so one bad app cannot hide the rest.
- Hide the Wellbeing settings row when `gnome-wellbeing-panel.desktop` is missing. Probe `GioUnix.DesktopAppInfo` first (GNOME 49–50), then `Gio.DesktopAppInfo` (45–48). Do not import `GioUnix` at module scope.
- Close an open popup when the session locks, the greeter starts, or GNOME 48–50 screen-time limits reach `LIMIT_REACHED`. The toggle shortcut also closes via an idle source so Clutter 18 does not abort mid-key.
- Speak both `St.ScrollView` APIs: GNOME 45 uses `get_vscroll_bar()`, GNOME 48+ uses `set_child()` and `get_vadjustment()`. All of that lives in `scrollView.js`. Do not write a scroll offset when `page_size` is still 0 (before the first allocate).
- Arrow-key debounce uses `GLib.get_monotonic_time()`, not `Clutter.Event.get_time()`. Wayland often reports `CLUTTER_CURRENT_TIME` (0), which would swallow every later Down.
- Set box-layout orientation with `set_vertical(true)` after `_init()` so GNOME 45/46 still load.
- Close the popup from an idle source after pointer and key handlers so Clutter 18 does not abort when the actor tree changes mid-event.
- Returning focus to the search entry after a row click also runs on idle. `grab_key_focus()` inside `notify::key-focus` or button-release aborts Clutter 18.
- Open the screenshot UI directly when Overview is already hidden. `SystemActions.activateScreenshotUI()` waits for Overview `hidden` and never fires from the launcher. If `Screenshot.showScreenshotUI` is missing, fall back to SystemActions.
- Prefer `Meta.Display.list_all_windows()` for window search when it exists so closed actors are not listed. Recency uses `get_tab_list` so Wayland sessions still list the focused window first.
- Stage-level key capture yields while an IME has a preedit so Enter commits the compose instead of launching a result.
- Recent-file exists checks settle after 800ms so a hung network path cannot stall the provider.
- `!` commands run from the user home directory as argv, not `/bin/sh -c`. gnome-shell's own cwd is often `/`. `~/`, `./`, and other slash paths such as `scripts/deploy` resolve against that home before the exists check. Bare names also look in `~/.local/bin`, Flatpak exports, `~/.cargo/bin`, `~/go/bin`, and `~/bin`. Slash paths are checked asynchronously so a hung network binary cannot stall the compositor.
- Typed `~/` `./` and absolute paths open in the default handler. Existence is checked asynchronously so a hung network mount cannot stall the compositor.
- A `monitors-changed` signal refits the backdrop and popup so an open launcher does not stay on a disconnected display.
- Results max height shrinks when the remaining work area is shorter than the setting so top looks cannot grow off the bottom. A short work area lifts the origin so the list is not `max-height: 0`.
- Click-outside claims the pointer press (and touch begin) so Wayland cannot deliver that click to the window below after the popup closes. A tap on a result row activates it the same way a click does.
- Provider and web-engine preference changes repaint an open popup without a reopen and keep the selected row.
- Changing `launcher-theme` at runtime applies that look's chrome (position, density, headers, number hints, search icon, result icons, descriptions, icon size, result order), not only the CSS class. A look write while the extension is disabled is applied on the next enable via `applied-look`. First enable of the default Spotlight look only stamps that key so a custom icon size is not reset. A non-default look written before the first enable still applies its chrome.
- Hiding the search icon (Rofi, Wofi, Tofi, Fuzzel, Anyrun, or the Search icon switch) adds `gosh-no-search-icon` so the query stays inset. The default entry left padding is 0 because the magnifier is the inset; compact density's `padding` shorthand would otherwise reset that to 0 again.
- The GNOME and Light looks follow `org.gnome.desktop.interface accent-color` on GNOME 47+. The desktop schema is looked up before `Gio.Settings` is constructed, so a missing schema cannot abort enable. Blue stays the stylesheet default so GNOME 45/46 construct nothing. Spotlight, Pop!_OS, and the other looks keep their own colors.
- A missing `ThemeContext` at enable is treated as 1× so load cannot throw. The next width fit retries the scale listen, so a context that appears later still drives live HiDPI refits.
- Typed paths and slash-path `!` commands stay non-activatable until the exists check finishes.
- A shortcut that fails to grab keeps the previous working grab instead of leaving the launcher mute. Preferences then show that working shortcut. Fallbacks such as Ctrl+Space are only tried when nothing is grabbed yet.
- The shortcut grab uses `Meta.KeyBindingFlags.IGNORE_AUTOREPEAT` so a held key cannot cancel a pending open or flip reopen-after-close.
- Disable and shortcut swaps release a grab with `allowKeybinding(NONE)` then `ungrab_accelerator`. GNOME 50 `removeKeybinding` is the gsettings path and does not clear the allow map for `grab_accelerator` names; a throw there would also skip ungrab and leave the old key live.
- `disable()` still tears down whatever `enable()` finished. GNOME calls disable after a failed enable; a missing popup or keybinding manager must not skip the other. The accelerator-activated handler disconnect is isolated so a vanishing display at logout cannot skip popup destroy.
- `close()` hides the popup before disconnecting the stage or layout manager. A throw there used to leave the actor visible, and `canOpenPopup` then treated the leftover as already open so the shortcut stayed stuck. `destroy()` isolates session/overview/layout unlisten so logout still closes, releases unredirect, and removes chrome.
- The click-outside backdrop hides before `removeChrome`. Clutter 18 aborts if chrome detaches a still-mapped actor (`clutter_actor_real_unrealize`). The popup itself is already hidden by `close()`; the backdrop was the leftover mapped chrome.
- Close hides the popup and backdrop before releasing compositor unredirect. Releasing that hold while the backdrop was still mapped let a fullscreen surface scanout through leftover chrome.
- Async recent-file, path, bookmark, and command refreshes keep the selected row instead of jumping to the first result. Those Gio finish callbacks schedule one idle paint so Clutter 18 does not abort if they land during a key press.
- Hover selection is ignored while result rows are being rebuilt. `destroy_all_children()` emits enter on the next row, and restyling that dying actor aborts Clutter 18.
- Calculator and web prefix queries do not refresh `recently-used.xbel`.
- `@` still searches the web when the fallback toggle is off.
- `-2^2` is `-4`. Incomplete tokens such as `0x` and `1e` do not become `0` or Euler.
- Duration, area, energy, power, and angle conversions (`2 hours to min`, `1 acre to m2`, `200 kcal to kj`, `1 hp to kw`, `180 deg to rad`). Minutes are `min` so `m` stays meters.
- GTK bookmark lines that are bare filesystem paths or `~/…` become `file://` URIs. Existing `file://` and `sftp://` lines with spaces are re-encoded before launch, including network `file://host/share`. `javascript:` bookmarks are ignored.
- Gio finishes after close are dropped so a late exists check cannot repaint a hidden popup. Clicking a result row or the scrollbar returns focus to the search entry so later letters still type. Alt-tab still closes.
- A provider that throws (a window that closed mid-search, or a recent-file URI with latin-1 percent bytes) leaves the other categories on screen. The empty-state list isolates windows from frequent apps the same way, and one vanished window is skipped instead of dropping the whole window list.
- A missing app icon no longer becomes `gicon: null`. A throw while building rows clears the painting flag so hover selection is not stuck off. A throwing `get_icon()` still paints that row with a fallback.
- Super / Activities closes the launcher so `addTopChrome` cannot cover Overview. Opening with the shortcut while Overview is already visible still works.
- Print Screen, polkit, and other system modals emit `system-modal-opened`. The launcher closes so it cannot sit over that grab.
- On-screen keyboard long-press accent keys grab focus in `addTopChrome`. That does not close the launcher.
- The on-screen keyboard parks `keyboardBox` at the monitor bottom and slides the keys with the child's `translation_y`. The work area follows that child so the list is not covered. While the keyboard is visible it is raised above the launcher so taps hit the keys instead of the backdrop. Accent popovers that GNOME 50 left in `addTopChrome` from an earlier long-press are raised with the keys so a tap types instead of closing the launcher. The IBus candidate popup is the same class of chrome: it is added at shell init and only raises itself above `keyboardBox`, so the launcher raises `candidate-popup-boxpointer` too and leaves Enter / arrows / numbers with the IME while that popup is visible.
- A finger swipe on the result list scrolls. A tap still activates. Mouse clicks still claim the press so Wayland cannot deliver it through the popup.
- While the popup is open, a window that appears or closes, a workspace change, or an installed-app change repaints the current query so Pop!_OS windows-first does not keep a closed window.

This environment cannot run a live GNOME Shell 50 Wayland session. After install, walk each look, disable a provider, and confirm Escape, click-outside, and the toggle shortcut all close the popup.

## License

GPL-3.0-or-later. See the [LICENSE](LICENSE) file for the full text.
