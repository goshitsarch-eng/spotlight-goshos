// gosh is launcher - arithmetic evaluator
// SPDX-License-Identifier: GPL-3.0-or-later

// recursive descent parser for arithmetic expressions
// returns null if input is not valid math so the caller knows to treat it as a search query
// never uses eval() - it tokenizes the input then parses with standard operator precedence
// pasted expressions often use unicode operators and thousands commas
export function normalizeMath(input) {
    let text = input
        .replace(/[\r\n]+/g, '')
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/[−–—]/g, '-')
        .replace(/[⋅·]/g, '*')
        .replace(/\*\*/g, '^')
        .replace(/(\d)\s+[xX]\s+(\d)/g, '$1*$2')
        .replace(/([1-9]\d*(?:\.\d+)?)[xX](\d)/g, '$1*$2');
    let next = text.replace(/(\d),(\d)/g, '$1$2');
    while (next !== text) {
        text = next;
        next = text.replace(/(\d),(\d)/g, '$1$2');
    }
    return text;
}

export function evaluateArithmetic(input, allowBare) {
    const text = normalizeMath(input);
    if (!/\d/.test(text))
        return null;
    if (!allowBare && !/[+\-*/%^]/.test(text))
        return null;

    const tokens = [];
    const tokenRegex = /\s*([0-9]+(?:\.[0-9]+)?(?:[eE][+\-]?[0-9]+)?|[+\-*/%()^])/g;
    let match;
    while ((match = tokenRegex.exec(text)) !== null)
        tokens.push(match[1]);

    if (tokens.join('') !== text.replace(/\s+/g, '') || tokens.length === 0)
        return null;

    let pos = 0;
    const peek = () => tokens[pos];
    const consume = () => tokens[pos++];

    function parseExpression() {
        let value = parseTerm();
        if (value === null)
            return null;
        while (peek() === '+' || peek() === '-') {
            const op = consume();
            const right = parseTerm();
            if (right === null)
                return null;
            value = op === '+' ? value + right : value - right;
        }
        return value;
    }

    function parseTerm() {
        let value = parsePower();
        if (value === null)
            return null;
        while (peek() === '*' || peek() === '/' || peek() === '%') {
            const op = consume();
            const right = parsePower();
            if (right === null)
                return null;
            if (op === '*')
                value = value * right;
            else if (op === '/') {
                if (right === 0)
                    return null;
                value = value / right;
            } else {
                if (right === 0)
                    return null;
                value = value % right;
            }
        }
        return value;
    }

    function parsePower() {
        const value = parseFactor();
        if (value === null)
            return null;
        if (peek() !== '^')
            return value;
        consume();
        const exp = parsePower();
        if (exp === null)
            return null;
        return Math.pow(value, exp);
    }

    function parseFactor() {
        const tok = peek();
        if (tok === undefined)
            return null;
        if (tok === '-') {
            consume();
            const v = parseFactor();
            return v === null ? null : -v;
        }
        if (tok === '+') {
            consume();
            return parseFactor();
        }
        if (tok === '(') {
            consume();
            const v = parseExpression();
            if (v === null || peek() !== ')')
                return null;
            consume();
            return v;
        }
        if (/^[0-9.]+(?:[eE][+\-]?[0-9]+)?$/.test(tok)) {
            consume();
            return parseFloat(tok);
        }
        return null;
    }

    const result = parseExpression();
    if (result === null || pos !== tokens.length)
        return null;
    if (!isFinite(result) || isNaN(result))
        return null;
    return result;
}

export function formatNumber(n) {
    if (Object.is(n, -0))
        return '0';
    if (Number.isInteger(n))
        return String(n);
    const rounded = Number(n.toPrecision(12));
    if (Number.isInteger(rounded))
        return String(rounded);
    return String(rounded);
}
