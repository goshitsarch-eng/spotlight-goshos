// gosh is launcher - arithmetic evaluator
// SPDX-License-Identifier: GPL-3.0-or-later

// recursive descent parser for arithmetic expressions
// returns null if input is not valid math so the caller knows to treat it as a search query
// never uses eval() - it tokenizes the input then parses with standard operator precedence
// pasted expressions often use unicode operators and thousands commas
const CONSTS = {
    pi: Math.PI,
    e: Math.E,
};

const FUNCS = {
    sqrt: Math.sqrt,
    cbrt: Math.cbrt,
    abs: Math.abs,
    log: Math.log10,
    log2: Math.log2,
    ln: Math.log,
    sin: n => Math.sin(n * Math.PI / 180),
    cos: n => Math.cos(n * Math.PI / 180),
    tan: n => {
        const rad = n * Math.PI / 180;
        if (Math.abs(Math.cos(rad)) < 1e-10)
            return NaN;
        return Math.tan(rad);
    },
    asin: n => Math.asin(n) * 180 / Math.PI,
    acos: n => Math.acos(n) * 180 / Math.PI,
    atan: n => Math.atan(n) * 180 / Math.PI,
    round: Math.round,
    floor: Math.floor,
    ceil: Math.ceil,
};

export function normalizeMath(input) {
    let text = input
        .replace(/[\r\n]+/g, '')
        .replace(/\u00a0/g, ' ')
        .replace(/[πΠ𝜋]/g, 'pi')
        .replace(/²/g, '^2')
        .replace(/³/g, '^3')
        .replace(/°/g, '')
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

function hasEvaluableValue(text, allowBare) {
    if (/\d/.test(text) || /\bpi\b/i.test(text))
        return true;
    // e+e and =e are euler bare e stays an app search
    if (!/\be\b/i.test(text))
        return false;
    return allowBare || /[+\-*/%^!()]/.test(text);
}

function looksLikeMath(text, allowBare) {
    if (allowBare)
        return true;
    if (/[+\-*/%^!]/.test(text))
        return true;
    const stripped = text
        .replace(/0x[0-9a-fA-F]+/gi, '0')
        .replace(/0b[01]+/g, '0')
        .replace(/\d+(?:\.\d+)?[eE][+\-]?\d+/g, '0');
    return /[a-zA-Z]/.test(stripped);
}

function isIdent(tok) {
    return tok !== undefined && /^[a-zA-Z][a-zA-Z0-9]*$/.test(tok);
}

export function evaluateArithmetic(input, allowBare) {
    const text = normalizeMath(input);
    if (!hasEvaluableValue(text, allowBare))
        return null;
    if (!looksLikeMath(text, allowBare))
        return null;

    const tokens = [];
    const tokenRegex = /\s*(0x[0-9a-fA-F]+|0b[01]+|(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)(?:[eE][+\-]?[0-9]+)?|[a-zA-Z][a-zA-Z0-9]*|[+\-*/%()^!])/g;
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

    // 2pi^2 is 2 times pi squared not (2pi) squared
    function isImplicitFactor() {
        const next = peek();
        if (next === '(')
            return true;
        if (!isIdent(next))
            return false;
        // 1e is incomplete scientific not 1 times euler
        return next.toLowerCase() !== 'e';
    }

    function parseTerm() {
        let value = parseUnary();
        if (value === null)
            return null;
        while (peek() === '*' || peek() === '/' || peek() === '%' || isImplicitFactor()) {
            if (isImplicitFactor()) {
                const right = parseUnary();
                if (right === null)
                    return null;
                value = value * right;
                continue;
            }
            const op = consume();
            const right = parseUnary();
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

    // unary is outside power so -2^2 is -(2^2)
    function parseUnary() {
        if (peek() === '-') {
            consume();
            const v = parseUnary();
            return v === null ? null : -v;
        }
        if (peek() === '+') {
            consume();
            return parseUnary();
        }
        return parsePower();
    }

    function parsePower() {
        const value = parsePrimary();
        if (value === null)
            return null;
        if (peek() !== '^')
            return value;
        consume();
        const exp = parseUnary();
        if (exp === null)
            return null;
        return Math.pow(value, exp);
    }

    function factorial(n) {
        if (!Number.isInteger(n) || n < 0 || n > 170)
            return null;
        let value = 1;
        for (let i = 2; i <= n; i++)
            value *= i;
        return value;
    }

    function postfixFact(value) {
        if (value === null || peek() !== '!')
            return value;
        consume();
        return factorial(value);
    }

    // 50% is a fraction infix 10%3 stays modulo
    function isBinaryModuloPercent() {
        if (peek() !== '%')
            return false;
        const next = tokens[pos + 1];
        if (next === undefined)
            return false;
        if (next === '(' || isIdent(next))
            return false;
        if (/^0x[0-9a-fA-F]+$/i.test(next) || /^0b[01]+$/i.test(next))
            return true;
        return /^[0-9.]+(?:[eE][+\-]?[0-9]+)?$/.test(next);
    }

    function postfixPercent(value) {
        if (value === null || peek() !== '%' || isBinaryModuloPercent())
            return value;
        consume();
        return value / 100;
    }

    function finishValue(value) {
        if (value === null)
            return null;
        return postfixPercent(postfixFact(value));
    }

    function applyFunc(fn, v) {
        const out = fn(v);
        if (!Number.isFinite(out))
            return null;
        return out;
    }

    function parsePrimary() {
        const tok = peek();
        if (tok === undefined)
            return null;
        if (tok === '(') {
            consume();
            const v = parseExpression();
            if (v === null || peek() !== ')')
                return null;
            consume();
            return finishValue(v);
        }
        if (isIdent(tok)) {
            const name = tok.toLowerCase();
            consume();
            if (FUNCS[name]) {
                if (peek() === '(') {
                    consume();
                    const v = parseExpression();
                    if (v === null || peek() !== ')')
                        return null;
                    consume();
                    return finishValue(applyFunc(FUNCS[name], v));
                }
                // sin 90 and sqrt 16 are what people type
                const v = parseUnary();
                if (v === null)
                    return null;
                return finishValue(applyFunc(FUNCS[name], v));
            }
            if (CONSTS[name] !== undefined)
                return finishValue(CONSTS[name]);
            return null;
        }
        if (/^0x[0-9a-fA-F]+$/i.test(tok)) {
            consume();
            return finishValue(parseInt(tok, 16));
        }
        if (/^0b[01]+$/i.test(tok)) {
            consume();
            return finishValue(parseInt(tok.slice(2), 2));
        }
        if (/^[0-9.]+(?:[eE][+\-]?[0-9]+)?$/.test(tok)) {
            consume();
            return finishValue(parseFloat(tok));
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
