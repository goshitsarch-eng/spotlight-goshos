// gosh is launcher - close and kill window queries
// SPDX-License-Identifier: GPL-3.0-or-later

export function parseWindowCloseQuery(query) {
    const text = query.trim();
    const match = /^(close|kill|quit|force-?quit|force\s+quit)\s+(.+)$/i.exec(text);
    if (!match)
        return null;

    const title = match[2].trim();
    if (!title)
        return null;

    const raw = match[1].toLowerCase().replace(/[\s-]/g, '');
    return {
        intent: raw === 'forcequit' ? 'kill' : raw,
        title,
    };
}

export function windowCloseTitle(intent, title) {
    if (intent === 'kill')
        return `Kill ${title}`;
    if (intent === 'quit')
        return `Quit ${title}`;
    return `Close ${title}`;
}

export function shouldForceQuitWindow(intent) {
    return intent === 'kill';
}
