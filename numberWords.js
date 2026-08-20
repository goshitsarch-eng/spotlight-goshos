// gosh is launcher - spoken cardinals used by math and units
// SPDX-License-Identifier: GPL-3.0-or-later

export const NUMBER_WORDS = {
    zero: '0', one: '1', two: '2', three: '3', four: '4',
    five: '5', six: '6', seven: '7', eight: '8', nine: '9',
    ten: '10', eleven: '11', twelve: '12',
    thirteen: '13', fourteen: '14', fifteen: '15',
    sixteen: '16', seventeen: '17', eighteen: '18', nineteen: '19',
};

export const ORDINAL_WORDS = {
    first: '1', second: '2', third: '3', fourth: '4', fifth: '5',
    sixth: '6', seventh: '7', eighth: '8', ninth: '9', tenth: '10',
    eleventh: '11', twelfth: '12',
};

const NUMBER_WORD_RE = /\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen)\b/gi;
const ORDINAL_POWER_RE = /\bto the\s+(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth)(?:\s+power)?\b/gi;

export function replaceNumberWords(text) {
    return text.replace(NUMBER_WORD_RE, word => NUMBER_WORDS[word.toLowerCase()]);
}

export function replaceOrdinalPower(text) {
    return text.replace(ORDINAL_POWER_RE, (_all, word) => `^${ORDINAL_WORDS[word.toLowerCase()]}`);
}
