// gosh is launcher - spoken cardinals used by math and units
// SPDX-License-Identifier: GPL-3.0-or-later

export const NUMBER_WORDS = {
    zero: '0', one: '1', two: '2', three: '3', four: '4',
    five: '5', six: '6', seven: '7', eight: '8', nine: '9',
    ten: '10', eleven: '11', twelve: '12',
    thirteen: '13', fourteen: '14', fifteen: '15',
    sixteen: '16', seventeen: '17', eighteen: '18', nineteen: '19',
};

export const TENS_WORDS = {
    twenty: 20, thirty: 30, forty: 40, fifty: 50,
    sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

export const ORDINAL_WORDS = {
    first: '1', second: '2', third: '3', fourth: '4', fifth: '5',
    sixth: '6', seventh: '7', eighth: '8', ninth: '9', tenth: '10',
    eleventh: '11', twelfth: '12',
};

const NUMBER_WORD_RE = /\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen)\b/gi;
const ORDINAL_POWER_RE = /\bto the\s+(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth)(?:\s+power)?\b/gi;
const TENS_THOUSAND_RE = /\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)\s+thousand\b/gi;
const ONES_THOUSAND_RE = /\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen)\s+thousand\b/gi;
const ONES_HUNDRED_RE = /\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen)\s+hundred\b/gi;
const TENS_ONES_RE = /\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)(?:[\s-](one|two|three|four|five|six|seven|eight|nine))?\b/gi;

export function replaceNumberWords(text) {
    let out = text.replace(/\ba\s+thousand\b/gi, '1000');
    out = out.replace(/\ba\s+hundred\b/gi, '100');
    out = out.replace(TENS_THOUSAND_RE, (_all, tens) => String(TENS_WORDS[tens.toLowerCase()] * 1000));
    out = out.replace(ONES_THOUSAND_RE, (_all, word) => String(Number(NUMBER_WORDS[word.toLowerCase()]) * 1000));
    out = out.replace(ONES_HUNDRED_RE, (_all, word) => String(Number(NUMBER_WORDS[word.toLowerCase()]) * 100));
    out = out.replace(TENS_ONES_RE, (_all, tens, ones) => {
        let n = TENS_WORDS[tens.toLowerCase()];
        if (ones)
            n += Number(NUMBER_WORDS[ones.toLowerCase()]);
        return String(n);
    });
    out = out.replace(/\bthousand\b/gi, '1000');
    out = out.replace(/\bhundred\b/gi, '100');
    out = out.replace(NUMBER_WORD_RE, word => NUMBER_WORDS[word.toLowerCase()]);
    // one hundred and twenty becomes 100 and 20 before this join
    return out.replace(/\b(\d+00)\s+and\s+(\d{1,2})\b/g, (_all, hundreds, rest) => String(Number(hundreds) + Number(rest)));
}

export function replaceOrdinalPower(text) {
    return text.replace(ORDINAL_POWER_RE, (_all, word) => `^${ORDINAL_WORDS[word.toLowerCase()]}`);
}
