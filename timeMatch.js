// gosh is launcher - whether a query asks for the clock or calendar
// SPDX-License-Identifier: GPL-3.0-or-later

export function timeQueryKind(query) {
    const q = query.trim().toLowerCase();
    if (q === 'time' || q === 'now' || q === 'clock')
        return 'time';
    if (q === 'date' || q === 'today' || q === 'calendar')
        return 'date';
    return null;
}

export function formatClock(hours, minutes, seconds) {
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
}

export function formatDateTitle(weekday, day, month, year) {
    return `${weekday}, ${day} ${month} ${year}`;
}
