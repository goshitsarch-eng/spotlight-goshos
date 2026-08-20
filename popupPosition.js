// gosh is launcher - work-area origin for the popup
// SPDX-License-Identifier: GPL-3.0-or-later

// use the work area so a top look sits below the panel and a center look
// is centered in the usable desktop not under chrome
export function popupWidthForWorkArea(requested, workWidth) {
    if (workWidth > 0 && requested > workWidth)
        return workWidth;
    return requested;
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

export function placePopup(workArea, popupWidth, emptyHeight, position, requestedResults, minResults) {
    const floor = minResults === undefined ? MIN_RESULTS_HEIGHT : minResults;
    let origin = popupOrigin(workArea, popupWidth, emptyHeight, position);
    origin = liftOriginForResults(origin, workArea, emptyHeight, Math.min(requestedResults, floor));
    return {
        x: origin.x,
        y: origin.y,
        resultsMax: resultsMaxHeightForWorkArea(
            requestedResults,
            spaceBelowOrigin(workArea, origin.y, emptyHeight),
        ),
    };
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
