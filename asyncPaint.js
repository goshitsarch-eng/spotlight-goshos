// gosh is launcher - when an async gio finish may repaint
// SPDX-License-Identifier: GPL-3.0-or-later

// gio callbacks can land while clutter is still dispatching a key
// close() reuses this renderer so a finish after hide must not paint
export function shouldScheduleAsyncPaint(hasPendingIdle, acceptPaint) {
    return acceptPaint && !hasPendingIdle;
}

export function shouldRunAsyncPaint(queryIsActive, acceptPaint) {
    return acceptPaint && queryIsActive;
}
