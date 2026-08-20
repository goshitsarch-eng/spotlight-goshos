// gosh is launcher - work-area origin for the popup
// SPDX-License-Identifier: GPL-3.0-or-later

// use the work area so a top look sits below the panel and a center look
// is centered in the usable desktop not under chrome
export function popupWidthForWorkArea(requested, workWidth) {
    if (workWidth > 0 && requested > workWidth)
        return workWidth;
    return requested;
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
