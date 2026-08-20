// gosh is launcher - whether a query asks for the clock or calendar
// SPDX-License-Identifier: GPL-3.0-or-later

// stripLeadingVerb leaves time right now from what's the time right now
export function normalizeTimeQuery(query) {
    let q = query.trim().toLowerCase().replace(/['’]/g, '');
    q = q.replace(/(?:\s+(?:right\s+now|currently|at\s+the\s+moment|please))+$/g, '').trim();
    const withoutNow = q.replace(/^(.+?)\s+now$/, '$1').trim();
    return withoutNow.length > 0 ? withoutNow : q;
}

export function timeQueryKind(query) {
    const q = normalizeTimeQuery(query);
    if (q === 'time' || q === 'now' || q === 'clock' ||
        q === 'what time' || q === 'what time is it' || q === 'current time' ||
        q === 'whats the time' || q === 'what is the time' ||
        q === 'what time is it now' || q === 'whats the time now' ||
        q === 'what is the time now' || q === 'what time it is' ||
        q === 'what the time is')
        return 'time';
    if (q === 'date' || q === 'today' || q === 'calendar' ||
        q === 'what date' || q === 'what date is it' || q === 'current date' ||
        q === 'whats the date' || q === 'what is the date' ||
        q === 'todays date' || q === 'date today' || q === 'todays' ||
        q === 'what day is it' || q === 'what day is it today' || q === 'whats the day' ||
        q === 'what day it is' || q === 'what the date is')
        return 'date';
    if (q === 'tomorrow')
        return 'tomorrow';
    if (q === 'yesterday')
        return 'yesterday';
    return null;
}

export function dateOffsetDays(kind) {
    if (kind === 'tomorrow')
        return 1;
    if (kind === 'yesterday')
        return -1;
    return 0;
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

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

// glib DateTime.get_day_of_week is 1 monday through 7 sunday
export function weekdayName(dayOfWeek) {
    if (dayOfWeek < 1 || dayOfWeek > 7)
        return '';
    return WEEKDAYS[dayOfWeek - 1];
}

export function monthName(month) {
    if (month < 1 || month > 12)
        return '';
    return MONTHS[month - 1];
}

export function formatIsoDate(year, month, day) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
