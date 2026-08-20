# agents guide for gosh is launcher

this file is the single source of truth for any person ai or agent working on this extension read it fully before touching any code it covers design philosophy architecture gnome version support code style ego review constraints and the why behind every non-obvious decision

if you are an ai agent read the whole file do not skim

## what this extension is

gosh is launcher is a compact launcher for gnome shell it was previously named spotlight you press a shortcut a popup appears you type and results show up in real time it searches apps windows recent files and settings does math runs optional commands opens urls controls the system and falls back to web search

users can switch the look between spotlight omarchy (walker) popos (cosmic) ulauncher krunner gnome rofi raycast albert wofi fuzzel anyrun tofi light powertoys synapse and onagre and can enable or disable every provider from preferences

## design philosophy

### looks are user choice

the original spotlight look stays available as one theme it is still the default so the compact macos-inspired pill is what you get before opening preferences

the other looks follow real launchers researched for this project

- omarchy uses walker on omarchy linux with the tokyo night palette from https://github.com/basecamp/omarchy/tree/dev/themes/tokyo-night
- popos follows the cosmic launcher a single card cooler gray roomy rows often placed near the top
- ulauncher is the alfred-like dark panel with a warm orange accent
- krunner is the plasma compact bar with breeze blue and a tight radius
- gnome follows adwaita
- rofi is the dmenu-style list with a square frame and the classic #005577 selected row
- raycast is a dark rounded panel with a red caret and no section headers
- albert is a breeze-dark card with a #1d99f3 selected row
- wofi is a compact wayland dmenu list with a steel-blue selected row
- fuzzel is the default solarized light wayland launcher #fdf6e3 card #eee8d5 selection 10px radius
- anyrun is a catppuccin mocha panel #1e1e2e with a #89b4fa selected edge
- tofi is a stark black dmenu bar with a white selected row
- light is adwaita light
- powertoys is a fluent dark card with a #0078d4 selected row
- synapse is a large-icon dark panel with an ubuntu-orange caret
- onagre is a stone-dark card with an amber selected row and dark selected text

do not add gnome shell blur to fake frosted glass cosmic 1.3 uses compositor blur we do not gnome blur is expensive and noisy on some hardware a slightly transparent color is allowed a Shell.BlurEffect is not

### minimal chrome

the popup has no title bar no close button clicking outside or pressing escape closes it the popup floats above all windows including always-on-top ones via addtopchrome it uses a backdrop actor plus grab_key_focus not Main.pushModal

### compact not full screen

the popup is 600px wide by default it grows downward as results appear and scrolls after the configured results max height

### no animations

the popup appears instantly with no fade-in or slide animation this is intentional a launcher that animates feels slow

## gnome shell version support

### supported versions

gosh is launcher supports gnome shell 45 46 47 48 49 and 50 listed in metadata.json under shell-version

the minimum is 45 because gnome shell 45 switched to es modules (import/export syntax) extensions using es modules cannot run on gnome shell 44 or earlier

see https://gjs.guide/extensions/upgrading/gnome-shell-45.html#esm

### gnome 50 notes

the official port guide is https://gjs.guide/extensions/upgrading/gnome-shell-50.html

gnome 50 removed x11 and with it RunDialog._restart plus the global.display restart signals keyboardManager lost releaseKeyboard and holdKeyboard do not call any of those

easeAsync and GLib.idle_add_once exist only on 50 do not use them if you want one zip for 45-50 keep GLib.idle_add

parentalControlsManager.shouldShowApp is used when filtering apps so wellbeing limits on 50 still hide blocked apps listen for app-filter-changed and repaint so a search typed during init is not stuck empty if malcontent dbus fails without setting initialized show desktop apps after five seconds rather than never

get_installed returns gappinfo get_keywords get_generic_name and list_actions live on desktopappinfo gnome 50 can type some installed entries as the interface so those methods are missing not null feature-detect them and skip a desktop whose get_id throws the same way appDisplay._loadApps does one bad encoding must not hide every app

gio.desktopappinfo moved to giounix.desktopappinfo on 49/50 do not import giounix at module scope it is missing on 45 settings wellbeing checks must try giounix first then gio and must not touch gio.desktopappinfo when the unix ctor exists that access warns on 49

Main.timeLimitsManager exists on 48 49 and 50 not on 45-47 check for it before connecting when its state is LIMIT_REACHED (2) refuse to open and closeSoon an already-open popup so a screen-time shield cannot be bypassed by launching apps

gnome 50 settings dropped the appearance panel id style and wallpaper live on background keep that id so one zip still opens a real panel datetime users about and region are system subpages gnome-control-center still remaps the old ids so keep launching those names for gnome 45 wifi applications background and wellbeing are still launchable panel ids

SystemActions.getName and getIconName are the same labels and icons overview search shows including Unlock Screen Rotation when the tablet lock is on use those live values so a translated session still matches gnome search power-off is Power Off not Shut Down

clutter 18 on gnome 50 aborts if the actor tree changes inside an input handler never destroy the backdrop or hide the popup from button-release-event use closeSoon() which idle_adds close() after the event finishes the toggle shortcut also uses closeSoon() a second press while that idle is pending arms reopen after close instead of eating the key

do not debounce arrows with event.get_time() that getter is milliseconds or clutter_current_time (0) and wayland often reports 0 so a second down looks like the same instant and never moves again use glib.get_monotonic_time() via navRepeat.js

st.scrollview page_size is 0 before the first allocate do not write rowY + rowHeight as the adjustment or a keep-selection refresh jumps the list off screen

### no x11 support

gnome shell 50 removed x11 support entirely this extension does not support x11 on any version if you are on x11 use gnome's overview search instead do not add x11 compatibility code

### wayland only

tested on wayland only the keybinding uses global.display.grab_accelerator

### version-specific api notes

the codebase calls set_vertical(true) after _init() for the popup box layout not orientation: Clutter.Orientation.VERTICAL inside the constructor the orientation property is not reliably settable on gnome shell 45 and 46 a real user report (issue #5 gnome shell 46.0 on ubuntu 24.04.4) hit Error: No property orientation on Gjs_spotlight_nin_spotlightPopup_SpotlightPopup when the constructor tried to set it

vertical and set_vertical() are confirmed to exist across the full 45 through 50 range so this is the correct choice do not switch back to orientation in the constructor without first confirming it against the actual minimum supported version not just the newest one

St.ScrollView is not the same object on 45 and 48

- gnome 45 is an St.Bin with get_vscroll_bar() and set_policy() see https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/gnome-45/src/st/st-scroll-view.h
- gnome 48 rewrote it as an St.Widget with set_child() and get_vadjustment() and dropped get_vscroll_bar() see https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/gnome-48/src/st/st-scroll-view.h

do not call get_vscroll_bar() from results or selection code and do not rely on add_child() to attach the results box add_child does not wire the scrollable child on some 45/46 builds use scrollView.js which feature-detects set_child set_policy and get_vadjustment

### single package for all versions

ego supports multi-versioning where you upload separate zips for different gnome versions this extension does not do that one zip works on all supported versions

## architecture

### file layout

```
gosh-is-launcher@nin/
    extension.js              entry point
    prefs.js                  preferences entry point
    launcherPopup.js          main popup widget
    searchEntry.js            search input box
    resultsContainer.js       scrollable results area
    resultRow.js              single result row
    labelEllipsize.js         one-line ellipsis on result labels
    sectionHeader.js          section header label
    sectionTitles.js          result type to title mapping
    noResults.js              empty state widget
    appSearch.js              app search provider
    appInfo.js                desktop-only app info methods (pure)
    appAction.js              desktop action labels (pure)
    calculatorSearch.js       calculator provider
    unitSearch.js             unit conversion provider
    unitMatch.js              unit aliases and conversion (pure)
    placesSearch.js           xdg user folders
    placeMatch.js             folder catalog (pure)
    bookmarksSearch.js        gtk bookmark provider
    bookmarkParse.js          gtk bookmark parse (pure)
    timeSearch.js             local time and date
    timeMatch.js              time and date query (pure)
    colorSearch.js            color copy
    colorMatch.js             hex rgb hsl hwb normalize (pure)
    systemActionsSearch.js    system actions provider
    settingsSearch.js         gnome settings provider
    webSearch.js              web search fallback
    windowSearch.js           open window provider with workspace labels
    recentFilesSearch.js      recent files provider
    recentXbel.js             parse recently-used.xbel (pure)
    keyAction.js              key press to popup action (pure)
    commandReady.js           whether a command argv can be spawned (pure)
    shortcutAccel.js          mutter accelerator string (pure)
    popupGate.js              open versus toggle-close (pure)
    searchLive.js             when to watch windows and apps (pure)
    liveSearchWatcher.js      refresh rows when a window or app changes
    popupPosition.js          work-area origin (pure)
    uiScale.js                st css px versus clutter stage pixels (pure)
    popupChrome.js            addtopchrome versus addchrome and osk/ime raise (pure)
    unredirect.js             hold compositor unredirect while open (pure)
    resultPointer.js          result row press/release and touch tap versus swipe (pure)
    resultIcon.js             skip a null app gicon so st.icon can construct (pure)
    focusLoss.js              close vs refocus the entry (pure)
    backdropBox.js            multi-monitor click-outside box (pure)
    searchRun.js              run a plan against providers and isolate a throw including empty-state (pure)
    windowMatch.js            window title class match and wayland recency (pure)
    windowClose.js            close kill and quit window queries (pure)
    workspaceQuery.js         switch to workspace n (pure)
    appMatch.js               app name generic-name keyword tiers (pure)
    appReady.js               parental-controls listing (pure)
    userPath.js               extra dirs the shell PATH often omits (pure)
    resultActivate.js         activate without crashing the shell (pure)
    terminalLaunch.js         open a folder in a terminal (pure)
    gioLaunch.js              async spawn and uri open
    urlSearch.js              url open provider
    pathSearch.js             ~/ ./ and absolute path opener
    pathMatch.js              path result row (pure)
    homePath.js               expand ~ ./ file:// sftp:// encode including network file://host/share (pure)
    commandSearch.js          command runner
    searchController.js       orchestrates all providers
    prefixParser.js           = @ # $ . ! prefixes
    searchPlan.js             provider plan from flags (pure)
    scrollView.js             45-50 scrollview attach policy adjustment
    navRepeat.js              drop duplicate arrows without clutter event time (pure)
    selectionManager.js       selected row and scroll-into-view
    resultsRenderer.js        debounce search and paint rows
    paintSelection.js         keep selected row across a refresh (pure)
    asyncPaint.js             whether a gio finish may repaint (pure)
    popupKeyHandler.js        stage-level key capture
    entryPreedit.js           ime preedit and candidate lookup (pure)
    popupBackdrop.js          click-outside closer
    focusLossWatcher.js       close on alt-tab or return focus to the entry
    themes.js                 look catalog (pure data)
    accentColor.js            session accent nicks for gnome and light (pure)
    prefsCombo.js             keep prefs combos in sync with gsettings (pure)
    webEngines.js             search engine catalog (pure data)
    urlMatch.js               url detection including spaced file:// and file://host/share pastes (pure)
    actionMatch.js            system action matching (pure)
    wordMatch.js              gnome-style word prefix (pure)
    settingsPanels.js         settings catalog (pure)
    selectionMath.js          wrap and clamp selection (pure)
    keybinding.js             keybinding manager
    calculator.js             arithmetic parser
    numberWords.js            spoken cardinals and ordinal powers (pure)
    stylesheet.css            all launcher looks
    metadata.json             extension metadata
    schemas/                  gsettings schema
    prefs/                    preference pages
        shortcutPage.js
        appearancePage.js
        featuresPage.js
        webSearchPage.js
        aboutPage.js
    scripts/
        pack.sh               ego zip
        install.sh            local uuid install from that zip
        validate.sh           syntax schema tests and zip checks
```

pure modules (themes accentColor prefsCombo webEngines prefixParser urlMatch actionMatch calculator numberWords unitMatch placeMatch bookmarkParse timeMatch colorMatch paintSelection sectionTitles recentXbel keyAction commandReady shortcutAccel popupGate popupPosition uiScale popupChrome backdropBox searchPlan searchRun windowMatch appMatch appInfo appAction wordMatch entryPreedit homePath pathMatch resultPointer resultIcon focusLoss navRepeat) must not import gi://St Clutter Meta Shell Gtk Gdk or Adw so both processes can share them

### process isolation

gnome shell extensions run in two processes

- the shell process runs extension.js and all root-level js files it has access to St Clutter Meta Shell GLib GObject Gio and Main it must not import Gtk Gdk or Adw these conflict with clutter

- the preferences process runs prefs.js and prefs/*.js it has access to Gtk Gdk Adw Gio it must not import St Clutter Meta or Shell these conflict with gtk

never import a shell-only library in a prefs file or vice versa ego review rejects extensions that violate process isolation see https://gjs.guide/extensions/development/preferences.html

gio.settings outlives the prefs window connectObject is a shell signaltracker helper and is not available in the gtk prefs process bindSettingsChanged disconnects on widget destroy so a reused prefs process cannot stack look-apply or combo sync

### search priority

results are combined in this order urls first then filesystem paths then xdg folders then gtk bookmarks then apps then calculator then units then colors then time then windows then system actions then settings then recent files then web last web search only appears if nothing else matched unless the user typed the @ prefix

the priority is set in searchController.js do not change it without reason

keywords match as prefixes or word-prefixes not mid-string so row does not hit browser and een does not hit lock screen titles can still substring-match at three letters generic-name and desktop comments are phrases so ows does not hit browser and ite does not hit write desktop ids and window classes match the last component and dotted words so mozilla finds firefox and nautilus finds files but org and zil do not path segments use slash as a word boundary so doc matches ~/Documents and ome does not match /home

popos look uses windows-first result order so open windows sit above apps the way the cosmic launcher does other looks keep apps first empty-state suggestions use the same order and still stop at max-results

typing close firefox or quit firefox lists matching windows as close actions kill firefox force-quits them

searchPlan.stripLeadingVerb rewrites spoken queries before providers run it loops please can you could you would you will you tell me then strips one launch verb (open launch run start show find search look switch go focus convert calculate compute what is how much is) then loops leading articles (my the a an me) then strips one category word (windows settings files recent app) and a trailing folder/dir/settings/preferences noun so find windows firefox open the pictures folder open wifi settings and search settings wifi still match do not loop verbs or category words search for open source and open source must stay open source open office and open vpn stay names too open up terminal start up firefox fire up steam and execute vscode still strip to the app prefix modes keep the typed words so @ open cats stays a web query for open cats except the same verb/category strip still runs for $ # and . so $ windows firefox is firefox

prefix modes when enabled jump to a single provider

- `=` calculator
- `@` web
- `#` settings only when followed by a space or nothing so #ff0000 stays a color
- `$` windows only when followed by a space or nothing so $HOME stays a normal query
- `.` recent files only when followed by a space or nothing so .bashrc stays a normal query
- `!` command

### signal management

all signal connections on gobjects use connectObject and disconnectObject not connect and disconnect this is a gnome shell 42+ api that auto-disconnects all signals connected with a given owner object see https://gjs.guide/extensions/upgrading/gnome-shell-42.html

in disable() or destroy() we call disconnectObject(this) which removes every signal connected with this as the owner this prevents signal leaks if you forget to disconnect one manually

a few connections use plain connect with manual disconnect instead of connectObject

- global.display.connect('accelerator-activated') in keybinding.js disconnected manually in disable()
- global.display.connect('window-created') in liveSearchWatcher.js disconnected manually in stop()
- global.stage.connect('notify::key-focus') in focusLossWatcher.js for focus-loss detection disconnected manually in stop()
- global.stage.connect('captured-event') in launcherPopup.js for stage-level key capture disconnected manually in close()
- Main.sessionMode.connect('updated') in launcherPopup.js so lock and greeter close an open popup disconnected manually in destroy()
- Main.timeLimitsManager.connect('notify::state') in launcherPopup.js on gnome 50 so a reached screen-time limit closes the popup disconnected manually in destroy()
- Main.layoutManager.connect('monitors-changed') in launcherPopup.js disconnected manually in close()
- Main.layoutManager.connect('system-modal-opened') in launcherPopup.js so screenshot and polkit close an open popup disconnected manually in destroy()
- layoutManager.uiGroup.connect('child-added') in launcherPopup.js so a later accent popover or ibus candidate is raised above the backdrop disconnected manually in close()

parentalControlsManager is a gobject so app-filter-changed uses connectObject and is disconnected in destroy() ThemeContext scale-factor uses connectObject the same way so a hidpi change refits width keyboardBox uses connectObject the same way and is disconnected in close() and destroy() so a later open does not stack handlers the sliding osk keys are the first child of keyboardbox and their translation-y is disconnected the same way liveSearchWatcher uses connectObject on each tracked window plus AppSystem and workspace_manager and disconnects those in stop() so a later open does not stack handlers start() and stop() isolate a vanished window or display so open() cannot abort after the backdrop is in chrome

each of these tracks its own handler id in an instance field and disconnects it explicitly rather than relying on disconnectObject(this) if you add a new connection on global.display or global.stage or Main.sessionMode or Main.timeLimitsManager follow the same pattern track the id and disconnect it manually do not assume connectObject covers it without checking first

### popup positioning

the popup and backdrop use addtopchrome not addchrome addchrome stacks below top_window_group so an always-on-top window paints over the launcher and steals clicks that should hit the backdrop addtopchrome is the same input tracking but above those windows and the parked keyboardbox hosts without addtopchrome fall back to addchrome a visible osk is raised above the popup so taps hit the keys instead of the backdrop gnome 50 keeps accent popovers in addtopchrome after first use so a later launcher open sits above those actors ibus candidates are also addtopchrome at init and only raise above keyboardbox so a later launcher open buries cjk lookup tables raiseInputChrome lifts keyboardbox then keyboard-subkeys-boxpointer then candidate-popup-boxpointer notify::visible raises immediately then again on idle because candidate open() then set_child_above_sibling(this, keyboardBox) runs after that notify and would bury the lookup under us again update-lookup-table does that restack on an already-visible popup so notify::allocation and ime key propagate also idle-raise close() disconnects those handlers and clears the raise idle so a reused long-press or ime page is not buried under the backdrop https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/gnome-50/js/ui/ibusCandidatePopup.js

an unredirected fullscreen window bypasses composition so even top chrome is invisible open() holds unredirect via Meta.Compositor.disable_unredirect on 48-50 or Meta.disable_unredirect_for_display on 45-47 close() and destroy() release that hold once disable/enable are a matched pair do not enable without a hold https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/gnome-50/js/ui/boxpointer.js

the popup is positioned once in open() via _reposition() on the primary monitor work area so top looks sit below the panel the empty-state height is used then the popup grows downward from that fixed origin as results appear st multiplies stylesheet px by ThemeContext.scale_factor but set_width is stage pixels so _fittedWidth and placePopup must scale the width setting and convert results max-height back to css px or a 200% session gets a half-width popup and a list that overflows _uiScale must treat a missing ThemeContext as 1x so enable cannot throw when get_for_stage is null retry the scale listen on later fits so a context that appears after enable still gets notify::scale-factor and refits while open the on-screen keyboard is not a strut keyboardbox stays parked at the monitor bottom and the keys slide with the child translation-y workAreaAvoidingKeyboard subtracts that child slide and keyboardbox notify::visible allocation plus the child translation-y schedule a layout while the popup is open

center mode uses the empty-state height so the pill stays visually centered top mode uses 12% of the work area height so popos and krunner looks sit high without covering the panel

if that origin leaves fewer than 120px below the entry placePopup lifts the origin so the list is not max-height 0 on a short work area

do not reposition the popup on notify::allocation or any other size-change signal doing so causes the popup to shift upward when results grow because the centering math recalculates with the new height and moves the top edge up the user perceives this as the popup drifting from center to upper side width and position changes may call _reposition while open that path must still use the empty-state height not the current results height

if the monitor geometry changes while the popup is open listen for layoutmanager monitors-changed then resize the backdrop and reposition in the new work area do not wait for the next open or the popup can sit off-screen with a stale click-outside box

### input capture and click outside to close

the popup does not use Main.pushModal a modal grab swallows pointer events before they reach the stage which makes click-outside detection impossible instead the popup uses two mechanisms working together

first a transparent full-screen reactive St.Widget called the backdrop is added with addtopchrome before the popup itself the backdrop covers every monitor and listens for button-press button-release and touch-event press must return EVENT_STOP or wayland delivers it to the window below and the matching release activates that window after closeSoon() hides the launcher release and touch-end call closeSoon() after the event so clutter 18 does not abort while destroying that actor the popup sits above the backdrop in the same stack so clicks on the popup itself are received normally

second FocusLossWatcher monitors notify::key-focus on global.stage if keyboard focus moves to an actor outside the popup for example via alt-tab the popup closes if focus stays inside but is not the search entry a click on a result row or scrollbar the watcher returns it to the entry so later letters do not vanish gnome 48 get_key_focus returns null instead of the stage when nothing is focused a click on non-focusable chrome does that so null and stage must refocus the entry not ignore captured-event still handles escape and arrows in that gap and must not handle keys once another actor owns focus start() is deferred via an idle source to avoid firing during the initial grab_key_focus call in open() the return grab is also idle_add via refocusEntrySoon because grab_key_focus inside notify::key-focus or button-release aborts clutter 18 result rows and chrome use can_focus false for the same reason

keyboard input is captured by calling grab_key_focus() on the search entry which directs all key events to the entry while it holds focus the escape key closes the popup arrow keys tab and page up/down move the selection and enter activates the selected result if that row is still pending enter runs the first ready sibling so a checking path can still open in terminal alt+1-9 activates only that numbered row when the setting is on a pending slot must not steal a later app home and end edit the query unless the caret is already at that edge in which case they jump to the first or last result stage capture must propagate while clutter text has a preedit or candidate-popup-boxpointer is visible so enter arrows and numbers stay with ibus instead of activating a result a click on that lookup must not be treated as alt-tab

close() must release that grab when the hidden entry still has stage focus call global.stage.set_key_focus(null) only if get_key_focus() is still inside the popup so alt-tab close does not steal the window the user just focused

the toggle shortcut must not call open() from accelerator-activated clutter 18 aborts if addchrome runs inside that dispatch so toggleFromShortcut schedules openSoon and a second press before that idle cancels the pending open open() uses an _isOpen flag not just visible because the first frames after that idle still have visible=false while the position idle runs a second press in that later gap must close not leak another backdrop a throw after _isOpen must call close() so the shortcut is not stuck and an unredirect hold is not leaked the position idle uses closeSoon for the same reason clearing the search entry must also paint the empty state on idle destroying result rows inside text-changed during a key press is the same abort prefs changed handlers schedule _repaintIfOpen on that idle instead of painting immediately a look change writes several keys and one idle paints them together width position and results height changes schedule _scheduleLayout on the same idle so set_width and set_position do not run inside a key dispatch gio query_info and load_contents finish callbacks must not paint immediately they can land while a key is still dispatching the renderer schedules one idle and coalesces path command recent and bookmark completions a later keystroke cancels that idle so a stale finish does not jump the highlight to row 0 close() must invalidate those caches before renderer.destroy() so a finish after hide cannot call onReady the renderer also drops _acceptAsyncPaint in destroy() and only sets it again from onTextChanged or repaintKeepingSelection the same instance is reused across open/close so do not set a permanent destroyed flag destroy_all_children emits enter on the next row so hover must not applySelection while the renderer is painting that restyles a dying actor destroy clears the open close position repaint layout refocus raise and renderer refresh idles before close so a dying popup cannot paint after teardown

### object lifecycle

every object created in enable() is destroyed in disable() every widget added to the chrome layer is removed every main loop source is removed every signal is disconnected

the popup widget overrides destroy() to clear the open close position repaint layout refocus and raise idles then unlisten session overview system-modal time-limits parental and scale isolate each host disconnect sessionmode can vanish at logout so a throw must not skip close() close() hides first so a later throw cannot leave visible true (canOpenPopup treats that leftover as already open) then it invalidates path command recent and bookmark caches destroys the renderer (search scroll and gio refresh idles) removes the backdrop disconnects the focus handler and removes those popup idles again then it removes itself from the chrome layer and chains up to the parent destroy

if you add a new widget or source you must add cleanup for it in disable() or the relevant destroy method ego review rejects extensions that leak objects

command existence for slash paths uses query_info_async and the FileInfo access::can-execute attribute do not call GLib.file_test from that callback that is sync io on the compositor thread PATH names still use find_program_in_path

### module-scope restrictions

gnome shell extensions must not create any objects connect any signals add any main loop sources or modify the shell during module initialization this means no `new SomeClass()` no `something.connect()` no `GLib.timeout_add()` at the top level of any js file

the only exception is static data structures like arrays objects maps sets and regexps

see https://gjs.guide/extensions/review-guidelines/review-guidelines.html#only-use-initialization-for-static-resources

systemActionsSearch.js calls SystemActions.getDefault() lazily inside each activate() arrow function and at search time not at module scope this is why the SYSTEM_ACTIONS array contains arrow functions that call getDefault() at invocation time not a module-level singleton variable

## code style

### comments

- all comments are lowercase no exceptions unless a capital letter is required to preserve meaning for example `curl -fsSL` must keep the capital `S` and `L` because they are case-sensitive flags
- no punctuation in comments no periods no commas no exclamation marks no question marks unless punctuation changes meaning
- explain why not what the code already shows what it does
- no block comment boxes no jsdoc no `/* */` banners use plain `//` comments only
- no references to other projects or extensions in comments
- no llm-smell phrases like "here we" "let's" "we need to" "note that" "important:" "todo" "fixme"
- for obscure or uncommon code provide both what and why for common code provide only why
- provide verified working links whenever possible prefer https://gjs.guide links over blog posts

### code structure

- split logic into many small files each with a single responsibility
- keep the entry point extension.js as small as possible it should only wire things together
- keep enable() and disable() next to each other in the entry point for easy review
- one concept per file one file per concept
- prefer pure functions with no side effects in utility files
- no typescript this is plain javascript no build step

### anti ai-code smells

- do not wrap standard api calls in try/catch blocks
- do not use try/catch to silence errors that should never happen return null instead
- do not use optional chaining `?.` or nullish coalescing `??` for methods that are guaranteed to exist
- do not add defensive null checks that mask bugs instead of handling them
- do not add "just in case" code for situations that cannot occur
- do not add comments that describe what a line does only describe why

### review discipline

- before producing final output read every single line you wrote
- look for potential issues on every line not just the line you are currently editing
- when fixing a bug check whether the same bug pattern exists elsewhere in the codebase
- do not assume a fix works verify it against the actual code

## keybinding

the default shortcut is `Ctrl+Space` stored in gsettings as `['<Control>space']`

`Super+Space` is grabbed by gnome shell for input source switching on some setups and grab_accelerator fails silently when this happens use `Ctrl+Space` instead users can change it in preferences

the keybinding uses global.display.grab_accelerator() not Main.wm.addKeybinding() because addkeybinding can fail if the schema is not ready at enable time grab_accelerator is more reliable pass Meta.KeyBindingFlags.IGNORE_AUTOREPEAT so a held shortcut cannot fire accelerator-activated again and cancel the pending open or flip reopen-after-close feature-detect the flag so a host without it still grabs with 0

teardown must call allowKeybinding(name NONE) then ungrab_accelerator independently do not call Main.wm.removeKeybinding for these names that api only clears the allow map when display.remove_keybinding succeeds which is the add_keybinding path a throw there would skip ungrab and leave the shortcut live after disable isolate the accelerator-activated disconnect the same way display can vanish at session teardown

disable must tolerate a partial enable gnome still calls disable when enable throws so a missing popup or keybinding manager must not skip the other

see https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/gnome-50/js/ui/windowManager.js

the popup can be closed in three ways pressing the toggle shortcut again pressing `Escape` or clicking outside the popup bounds

changing the shortcut grabs the new key before dropping the old one so a conflict cannot leave the launcher with no grab if the new key fails keep the previous grab and write that accelerator back to settings do not walk ctrl/super/alt space fallbacks unless nothing is grabbed yet

see the keybinding.js file for the implementation

## clipboard access

gosh is launcher writes to the clipboard only when the user explicitly selects a calculator unit conversion color or time date result by pressing enter it does not read the clipboard ever it does not share clipboard data with any third party

this is declared in metadata.json description under the CLIPBOARD ACCESS section ego review requires this declaration for any extension that touches the clipboard

see https://gjs.guide/extensions/review-guidelines/review-guidelines.html#clipboard-access-must-be-declared

## gsettings schema

the schema id is `org.gnome.shell.extensions.gosh-is-launcher` and the path is `/org/gnome/shell/extensions/gosh-is-launcher/` both follow the gnome shell extension convention

the schema file is `schemas/org.gnome.shell.extensions.gosh-is-launcher.gschema.xml` the filename must match the schema id pattern

the `web-search-engine` and `launcher-theme` keys use `<choices>` not `<enum>` because the code reads and writes them as strings with get_string() and set_string() using an enum would require get_enum() and set_enum() instead

the `applied-look` key is a plain string so it can be empty before the first enable stamp do not put it on the appearance page

the `gschemas.compiled` binary is not shipped in the zip gnome shell 44 and later compiles schemas automatically on install shipping the compiled binary is unnecessary

see https://gjs.guide/extensions/development/preferences.html#gsettings

## testing

### static analysis

run the validator

```bash
bash scripts/validate.sh
```

`scripts/install.sh` packs that zip and extracts only those files into the local uuid directory do not `cp -r` the repository tree into `gosh-is-launcher@nin`

if you do not have the script use gjs or node to parse each file

```bash
gjs -c "Reflect.parse(readFile('extension.js'), { target: 'module' })"
```

### schema validation

compile the schema to verify the xml is valid

```bash
glib-compile-schemas schemas/
```

### syntax check

every js file must parse as an es module if any file has a syntax error gnome shell will fail to load the extension silently

### unit tests

pure modules are covered by `node tests/run.mjs` calculator prefixes urls themes engines and section titles

### manual testing

test on gnome shell 50 wayland first then test on at least one older version if possible the extension should work identically across all supported versions

walk each look in preferences confirm providers can be disabled and confirm escape click-outside and the toggle shortcut all close the popup

## adding a new search provider

1. create a new file at the root level for example `mySearch.js`
2. export a function that takes a query string and returns an array of result objects
3. each result object needs `type` `title` `icon` and `activate` properties
4. import your new provider in `searchController.js`
5. add it to the `runSearch` function in the correct priority order
6. add the type string to `sectionTitles.js` if you want a custom section header
7. add an enable-* gsettings key and a switch on the features page
8. do not create any module-scope instances use lazy calls inside callbacks

## adding a new look

1. add an entry to THEMES in themes.js including a look profile with iconSize showSearchIcon showResultIcons and showDescriptions
2. add a choice to the launcher-theme key in the schema
3. add `.gosh-theme-<id>` rules in stylesheet.css
4. keep the look as css on the existing widgets do not fork the popup class
5. keep `.gosh-container.gosh-density-compact` rules last in stylesheet.css so they beat theme-specific row padding
6. launcherPopup applies the look profile when launcher-theme changes so dconf writes get the same chrome as the prefs combo
7. the prefs combo must not apply on init see shouldApplyLook so a custom icon size survives reopening appearance
8. changed::launcher-theme must not advance lastThemeId the combo writes that key before notify::selected so lastThemeId has to stay on the previous look or picking popos from prefs never writes top windows-first chrome when the extension is disabled
9. syncLookSettings on popup construct applies a look written while disabled applied-look tracks the last written profile first enable only stamps that key so a custom icon size is not reset
10. gnome and light looks follow org.gnome.desktop.interface accent-color on gnome 47+ feature-detect has_key and read get_enum blue stays the stylesheet default so 45/46 need no class do not create gio.settings at module scope

the applied-look key is a plain string not choices so it can be empty before the first stamp

## adding a new ui component

1. create a new file at the root level for example `myWidget.js`
2. export a function that builds and returns the widget
3. import it in `launcherPopup.js` where needed
4. use `connectObject` for all signal connections
5. ensure the widget is destroyed when the popup is destroyed

## contacts

- repository https://github.com/goshitsarch-eng/spotlight-goshos
- security issues email ninx.sh@gmail.com
- ego page search for gosh is launcher by nin

## license

gpl-3.0-or-later see the LICENSE file

this is compatible with gnome shell's gpl-2.0-or-later requirement
