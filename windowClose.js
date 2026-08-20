// gosh is launcher - close and kill window queries
// SPDX-License-Identifier: GPL-3.0-or-later

export function parseWindowCloseQuery(query) {
    const text = query.trim();
    const match = /^(close|kill|quit)\s+(.+)$/i.exec(text);
    if (!match)
        return null;

    const title = match[2].trim();
    if (!title)
        return null;

    return {
        intent: match[1].toLowerCase(),
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
