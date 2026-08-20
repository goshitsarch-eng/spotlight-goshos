// gosh is launcher - close and kill window queries
// SPDX-License-Identifier: GPL-3.0-or-later

function stripCloseTitle(title) {
    let text = title.trim();
    const article = /^(?:my|the|an?)\s+(.+)$/i.exec(text);
    if (article && article[1].trim())
        text = article[1].trim();

    const withoutNoun = text.replace(/\s+(windows?|applications?|apps?)$/i, '').trim();
    return withoutNoun.length > 0 ? withoutNoun : text;
}

export function parseWindowCloseQuery(query) {
    const text = query.trim();
    const match = /^(close|kill|quit|force-?quit|force\s+quit|force\s+close)\s+(.+)$/i.exec(text);
    if (!match)
        return null;

    const title = stripCloseTitle(match[2]);
    if (!title)
        return null;

    const raw = match[1].toLowerCase().replace(/[\s-]/g, '');
    return {
        intent: raw === 'forcequit' || raw === 'forceclose' ? 'kill' : raw,
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
