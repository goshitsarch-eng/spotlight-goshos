// gosh is launcher - arithmetic evaluator
// SPDX-License-Identifier: GPL-3.0-or-later

// recursive descent parser for arithmetic expressions
// returns null if input is not valid math so the caller knows to treat it as a search query
// never uses eval() - it tokenizes the input then parses with standard operator precedence
// pasted expressions often use unicode operators and thousands commas
const CONSTS = {
    pi: Math.PI,
};

const FUNCS = {
    sqrt: Math.sqrt,
    cbrt: Math.cbrt,
    abs: Math.abs,
    sin: n => Math.sin(n * Math.PI / 180),
    cos: n => Math.cos(n * Math.PI / 180),
    tan: n => Math.tan(n * Math.PI / 180),
};

export function normalizeMath(input) {
    let text = input
        .replace(/[\r\n]+/g, '')
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/[−–—]/g, '-')
        .replace(/[⋅·]/g, '*')
        .replace(/\*\*/g, '^')
        .replace(/√\s*\(/g, 'sqrt(')
        .replace(/√\s*(\d+(?:\.\d+)?)/g, 'sqrt($1)')
        .replace(/(\d)\s+[xX]\s+(\d)/g, '$1*$2')
        .replace(/([1-9]\d*(?:\.\d+)?)[xX](\d)/g, '$1*$2')
        .replace(/(\d+(?:\.\d+)?)\s*%\s*of\s*(\d+(?:\.\d+)?)/gi, '($1/100)*$2')
        .replace(/(\d+(?:\.\d+)?)\s*percent\s+of\s*(\d+(?:\.\d+)?)/gi, '($1/100)*$2');
    let next = text.replace(/(\d),(\d)/g, '$1$2');
    while (next !== text) {
        text = next;
        next = text.replace(/(\d),(\d)/g, '$1$2');
    }
    return text;
}

function looksLikeMath(text, allowBare) {
    if (allowBare)
        return true;
    if (/[+\-*/%^]/.test(text))
        return true;
    const stripped = text
        .replace(/0x[0-9a-fA-F]+/gi, '0')
        .replace(/0b[01]+/g, '0')
        .replace(/\d+(?:\.\d+)?[eE][+\-]?\d+/g, '0');
    return /[a-zA-Z]/.test(stripped);
}

function isIdent(tok) {
    return tok !== undefined && /^[a-zA-Z]+$/.test(tok);
}

export function evaluateArithmetic(input, allowBare) {
    const text = normalizeMath(input);
    if (!/\d/.test(text) && !/\bpi\b/i.test(text))
        return null;
    if (!looksLikeMath(text, allowBare))
        return null;

    const tokens = [];
    const tokenRegex = /\s*(0x[0-9a-fA-F]+|0b[01]+|[0-9]+(?:\.[0-9]+)?(?:[eE][+\-]?[0-9]+)?|[a-zA-Z]+|[+\-*/%()^])/g;
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

    function implicitMul(value) {
        const next = peek();
        if (next === '(' || isIdent(next))
            return value * parseFactor();
        return value;
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
            return implicitMul(v);
        }
        if (isIdent(tok)) {
            const name = tok.toLowerCase();
            consume();
            if (FUNCS[name]) {
                if (peek() !== '(')
                    return null;
                consume();
                const v = parseExpression();
                if (v === null || peek() !== ')')
                    return null;
                consume();
                return implicitMul(FUNCS[name](v));
            }
            if (CONSTS[name] !== undefined)
                return implicitMul(CONSTS[name]);
            return null;
        }
        if (/^0x[0-9a-fA-F]+$/i.test(tok)) {
            consume();
            return implicitMul(parseInt(tok, 16));
        }
        if (/^0b[01]+$/i.test(tok)) {
            consume();
            return implicitMul(parseInt(tok.slice(2), 2));
        }
        if (/^[0-9.]+(?:[eE][+\-]?[0-9]+)?$/.test(tok)) {
            consume();
            return implicitMul(parseFloat(tok));
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

export function formatHex(n) {
    if (!Number.isInteger(n) || n < 0)
        return '';
    return `0x${n.toString(16)}`;
}

export function calculatorDescription(n) {
    const hex = formatHex(n);
    if (hex)
        return `${hex} · press Enter to copy`;
    return 'Press Enter to copy to clipboard';
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
