---
name: Bug Report
about: Report a bug in Gosh Is Launcher for GNOME Shell
title: "[BUG] "
labels: bug
assignees: ''
---

## Describe the bug

A clear and concise description of what the bug is.

## To reproduce

Steps to reproduce the behavior:

1. Press `Ctrl+Space` to open Gosh Is Launcher
2. Type `...`
3. Observe what happens

## Expected behavior

What you expected to happen instead.

## Screenshots

If applicable, add screenshots showing the issue.

## Environment

- **GNOME Shell version:** (e.g., 46, 47, 48, 49, 50)
- **Linux distribution:** (e.g., Fedora 41, Ubuntu 24.04, Arch)
- **Gosh Is Launcher version:** (check `gnome-extensions info gosh-is-launcher@nin` or look in preferences)
- **Launcher look:** (Spotlight / Omarchy / Pop!_OS / Ulauncher / KRunner / GNOME / Rofi / Raycast / Albert / Wofi / Light)
- **Display server:** Wayland (X11 is not supported)

## Logs

Run the following command and paste any lines containing `gosh`:

```bash
journalctl -b /usr/bin/gnome-shell | grep -i gosh
```

## Additional context

Add any other context about the problem here. If the issue is with a specific app not appearing in search results, mention the app name and what you typed.
