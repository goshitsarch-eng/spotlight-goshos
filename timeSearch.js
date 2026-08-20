// gosh is launcher - local time and date
// SPDX-License-Identifier: GPL-3.0-or-later

import GLib from 'gi://GLib';
import St from 'gi://St';
import {timeQueryKind, dateOffsetDays, formatClock, formatDateTitle, weekdayName, monthName, formatIsoDate} from './timeMatch.js';

export function searchTime(query) {
    const kind = timeQueryKind(query);
    if (!kind)
        return [];

    const now = GLib.DateTime.new_now_local();
    const when = now.add_days(dateOffsetDays(kind));
    const weekday = weekdayName(when.get_day_of_week());
    const title = kind === 'time'
        ? formatClock(when.get_hour(), when.get_minute(), when.get_second())
        : formatDateTitle(weekday, when.get_day_of_month(), monthName(when.get_month()), when.get_year());
    const description = kind === 'time'
        ? weekday
        : formatIsoDate(when.get_year(), when.get_month(), when.get_day_of_month());

    return [{
        type: 'time',
        title,
        description: `${description} · press Enter to copy`,
        icon: kind === 'time' ? 'preferences-system-time-symbolic' : 'x-office-calendar-symbolic',
        id: kind,
        activate: () => {
            // clipboard write only after the user activates the clock row
            // declared in metadata.json description
            const clipboard = St.Clipboard.get_default();
            clipboard.set_text(St.ClipboardType.CLIPBOARD, title);
            clipboard.set_text(St.ClipboardType.PRIMARY, title);
        },
    }];
}
