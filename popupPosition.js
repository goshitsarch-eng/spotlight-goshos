// gosh is launcher - work-area origin for the popup
// SPDX-License-Identifier: GPL-3.0-or-later

import {themeScale, stagePx, cssPx} from './uiScale.js';

// use the work area so a top look sits below the panel and a center look
// is centered in the usable desktop not under chrome
// requested is the settings css px workWidth is stage pixels
export function popupWidthForWorkArea(requested, workWidth, scale) {
    const width = stagePx(requested, scale);
    if (workWidth > 0 && width > workWidth)
        return workWidth;
    return width;
}

// top looks grow down from a high origin so the list must shrink
// instead of covering the dock or running off the work area
export const MIN_RESULTS_HEIGHT = 120;

export function resultsMaxHeightForWorkArea(requested, spaceBelow) {
    // 0 is a real bottom-clamped popup not an unknown work area
    if (spaceBelow <= 0)
        return 0;
    return Math.min(requested, spaceBelow);
}

export function spaceBelowOrigin(workArea, originY, emptyHeight) {
    return workArea.y + workArea.height - originY - emptyHeight;
}

// top looks on a short work area would otherwise get max-height 0
export function liftOriginForResults(origin, workArea, emptyHeight, minResults) {
    if (minResults <= 0)
        return origin;
    const space = spaceBelowOrigin(workArea, origin.y, emptyHeight);
    if (space >= minResults)
        return origin;
    const needed = emptyHeight + minResults;
    let y = workArea.y + workArea.height - needed;
    const maxY = workArea.y + workArea.height - emptyHeight;
    if (y > maxY)
        y = maxY;
    if (y < workArea.y)
        y = workArea.y;
    return {x: origin.x, y};
}

export function placePopup(workArea, popupWidth, emptyHeight, position, requestedResults, minResults, scale) {
    const factor = themeScale(scale);
    const floorLogical = minResults === undefined ? MIN_RESULTS_HEIGHT : minResults;
    const floor = stagePx(floorLogical, factor);
    const requested = stagePx(requestedResults, factor);
    let origin = popupOrigin(workArea, popupWidth, emptyHeight, position);
    origin = liftOriginForResults(origin, workArea, emptyHeight, Math.min(requested, floor));
    return {
        x: origin.x,
        y: origin.y,
        resultsMax: cssPx(resultsMaxHeightForWorkArea(
            requested,
            spaceBelowOrigin(workArea, origin.y, emptyHeight),
        ), factor),
    };
}

// keyboardbox stays parked at the monitor bottom the keys are a child
// that slides with translation-y https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/gnome-50/js/ui/keyboard.js
export function keyboardOverlapFromBox(box, keyboardMonitorIndex, workMonitorIndex, slide) {
    if (!box)
        return {visible: false, y: 0, height: 0, translationY: 0, monitorIndex: -1, workMonitorIndex};
    const mover = slide || box;
    const height = slide && slide.height > 0 ? slide.height : box.height;
    return {
        visible: Boolean(box.visible),
        y: box.y,
        height,
        translationY: mover.translation_y,
        monitorIndex: keyboardMonitorIndex,
        workMonitorIndex,
    };
}

export function workAreaAvoidingKeyboard(workArea, keyboard) {
    if (!keyboard || !keyboard.visible || keyboard.height <= 0)
        return workArea;
    if (keyboard.monitorIndex >= 0 && keyboard.workMonitorIndex >= 0 &&
        keyboard.monitorIndex !== keyboard.workMonitorIndex)
        return workArea;
    const top = keyboard.y + keyboard.translationY;
    const workBottom = workArea.y + workArea.height;
    if (top >= workBottom)
        return workArea;
    if (top + keyboard.height <= workArea.y)
        return workArea;
    if (top <= workArea.y)
        return {x: workArea.x, y: workArea.y, width: workArea.width, height: 0};
    return {x: workArea.x, y: workArea.y, width: workArea.width, height: top - workArea.y};
}

export function popupOrigin(workArea, popupWidth, popupHeight, position) {
    let x = Math.floor(workArea.x + (workArea.width - popupWidth) / 2);
    let y;
    if (position === 'top')
        y = Math.floor(workArea.y + workArea.height * 0.12);
    else
        y = Math.floor(workArea.y + (workArea.height - popupHeight) / 2);

    const maxX = workArea.x + workArea.width - popupWidth;
    const maxY = workArea.y + workArea.height - popupHeight;
    if (x > maxX)
        x = maxX;
    if (x < workArea.x)
        x = workArea.x;
    if (y > maxY)
        y = maxY;
    if (y < workArea.y)
        y = workArea.y;
    return {x, y};
}
