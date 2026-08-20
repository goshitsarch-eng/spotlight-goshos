// gosh is launcher - drop duplicate nav presses without a wayland event clock
// SPDX-License-Identifier: GPL-3.0-or-later

// clutter event time is milliseconds or clutter_current_time (0)
// wayland often reports 0 so a second down would look like it arrived
// in the same instant and the debounce would swallow every later arrow
// https://gnome.pages.gitlab.gnome.org/mutter/clutter/method.Event.get_time.html
export const NAV_REPEAT_GAP_US = 50000;

export function shouldIgnoreNavRepeat(key, lastKey, nowUs, lastTimeUs, minGapUs) {
    const gap = minGapUs > 0 ? minGapUs : NAV_REPEAT_GAP_US;
    if (key !== lastKey)
        return false;
    if (lastTimeUs <= 0)
        return false;
    return nowUs - lastTimeUs < gap;
}
