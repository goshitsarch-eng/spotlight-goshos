// gosh is launcher - when an async gio finish may repaint
// SPDX-License-Identifier: GPL-3.0-or-later

// gio callbacks can land while clutter is still dispatching a key
export function shouldScheduleAsyncPaint(hasPendingIdle) {
    return !hasPendingIdle;
}

export function shouldRunAsyncPaint(queryIsActive) {
    return queryIsActive;
}
