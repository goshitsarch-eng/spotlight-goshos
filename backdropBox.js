// gosh is launcher - union box that covers every monitor
// SPDX-License-Identifier: GPL-3.0-or-later

// one actor must cover the whole desktop so a click on a second display
// still counts as outside the popup
export function backdropBox(monitors) {
    if (!monitors || monitors.length === 0)
        return {x: 0, y: 0, width: 0, height: 0};

    let minX = monitors[0].x;
    let minY = monitors[0].y;
    let maxX = monitors[0].x + monitors[0].width;
    let maxY = monitors[0].y + monitors[0].height;
    for (let i = 1; i < monitors.length; i++) {
        const monitor = monitors[i];
        if (monitor.x < minX)
            minX = monitor.x;
        if (monitor.y < minY)
            minY = monitor.y;
        const right = monitor.x + monitor.width;
        const bottom = monitor.y + monitor.height;
        if (right > maxX)
            maxX = right;
        if (bottom > maxY)
            maxY = bottom;
    }
    return {x: minX, y: minY, width: maxX - minX, height: maxY - minY};
}
