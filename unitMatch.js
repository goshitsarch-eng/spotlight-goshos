// gosh is launcher - length mass temp volume and data conversions
// SPDX-License-Identifier: GPL-3.0-or-later

const ALIASES = {
    km: 'km', kilometer: 'km', kilometers: 'km', kilometre: 'km', kilometres: 'km',
    m: 'm', meter: 'm', meters: 'm', metre: 'm', metres: 'm',
    cm: 'cm', centimeter: 'cm', centimeters: 'cm', centimetre: 'cm', centimetres: 'cm',
    mm: 'mm', millimeter: 'mm', millimeters: 'mm',
    mi: 'mi', mile: 'mi', miles: 'mi',
    nmi: 'nmi', nautical: 'nmi', nauticalmile: 'nmi', nauticalmiles: 'nmi',
    yd: 'yd', yard: 'yd', yards: 'yd',
    ft: 'ft', foot: 'ft', feet: 'ft',
    in: 'in', inch: 'in', inches: 'in',
    kg: 'kg', kilogram: 'kg', kilograms: 'kg',
    g: 'g', gram: 'g', grams: 'g',
    mg: 'mg', milligram: 'mg', milligrams: 'mg',
    lb: 'lb', lbs: 'lb', pound: 'lb', pounds: 'lb',
    oz: 'oz', ounce: 'oz', ounces: 'oz',
    t: 't', tonne: 't', tonnes: 't',
    st: 'st', stone: 'st', stones: 'st',
    c: 'c', celsius: 'c', centigrade: 'c',
    f: 'f', fahrenheit: 'f',
    k: 'k', kelvin: 'k',
    l: 'l', liter: 'l', liters: 'l', litre: 'l', litres: 'l',
    ml: 'ml', milliliter: 'ml', milliliters: 'ml',
    gal: 'gal', gallon: 'gal', gallons: 'gal',
    qt: 'qt', quart: 'qt', quarts: 'qt',
    pt: 'pt', pint: 'pt', pints: 'pt',
    cup: 'cup', cups: 'cup',
    b: 'b', byte: 'b', bytes: 'b',
    kb: 'kb', kilobyte: 'kb', kilobytes: 'kb',
    mb: 'mb', megabyte: 'mb', megabytes: 'mb',
    gb: 'gb', gigabyte: 'gb', gigabytes: 'gb',
    tb: 'tb', terabyte: 'tb', terabytes: 'tb',
    kib: 'kib', mib: 'mib', gib: 'gib', tib: 'tib',
};

const UNITS = {
    mm: {dim: 'length', toBase: 0.001},
    cm: {dim: 'length', toBase: 0.01},
    m: {dim: 'length', toBase: 1},
    km: {dim: 'length', toBase: 1000},
    in: {dim: 'length', toBase: 0.0254},
    ft: {dim: 'length', toBase: 0.3048},
    yd: {dim: 'length', toBase: 0.9144},
    mi: {dim: 'length', toBase: 1609.344},
    nmi: {dim: 'length', toBase: 1852},
    mg: {dim: 'mass', toBase: 0.000001},
    g: {dim: 'mass', toBase: 0.001},
    kg: {dim: 'mass', toBase: 1},
    t: {dim: 'mass', toBase: 1000},
    oz: {dim: 'mass', toBase: 0.028349523125},
    lb: {dim: 'mass', toBase: 0.45359237},
    st: {dim: 'mass', toBase: 6.35029318},
    ml: {dim: 'volume', toBase: 0.001},
    l: {dim: 'volume', toBase: 1},
    cup: {dim: 'volume', toBase: 0.2365882365},
    pt: {dim: 'volume', toBase: 0.473176473},
    qt: {dim: 'volume', toBase: 0.946352946},
    gal: {dim: 'volume', toBase: 3.785411784},
    b: {dim: 'data', toBase: 1},
    kb: {dim: 'data', toBase: 1000},
    mb: {dim: 'data', toBase: 1e6},
    gb: {dim: 'data', toBase: 1e9},
    tb: {dim: 'data', toBase: 1e12},
    kib: {dim: 'data', toBase: 1024},
    mib: {dim: 'data', toBase: 1048576},
    gib: {dim: 'data', toBase: 1073741824},
    tib: {dim: 'data', toBase: 1099511627776},
    c: {dim: 'temp'},
    f: {dim: 'temp'},
    k: {dim: 'temp'},
};

const QUERY_RE = /^(-?\d+(?:\.\d+)?)\s*([a-z]+)\s+(?:to|in)\s+([a-z]+)$/i;

export function resolveUnit(name) {
    const id = ALIASES[name.toLowerCase()];
    if (!id)
        return null;
    return {id, dim: UNITS[id].dim, toBase: UNITS[id].toBase};
}

export function normalizeUnitQuery(query) {
    let text = query
        .replace(/°/g, ' ')
        .replace(/\s*degrees?\s*/gi, ' ');
    // pasted values often use thousands commas the way the calculator does
    let next = text.replace(/(\d),(\d)/g, '$1$2');
    while (next !== text) {
        text = next;
        next = text.replace(/(\d),(\d)/g, '$1$2');
    }
    return text;
}

export function parseUnitQuery(query) {
    const match = normalizeUnitQuery(query).trim().match(QUERY_RE);
    if (!match)
        return null;
    return {
        value: Number(match[1]),
        from: match[2],
        to: match[3],
    };
}

function convertTemp(value, fromId, toId) {
    let celsius = value;
    if (fromId === 'f')
        celsius = (value - 32) * (5 / 9);
    else if (fromId === 'k')
        celsius = value - 273.15;

    if (toId === 'c')
        return celsius;
    if (toId === 'f')
        return celsius * (9 / 5) + 32;
    return celsius + 273.15;
}

export function convertUnits(value, fromName, toName) {
    const from = resolveUnit(fromName);
    const to = resolveUnit(toName);
    if (!from || !to || from.dim !== to.dim || from.id === to.id)
        return null;
    if (from.dim === 'temp')
        return {value: convertTemp(value, from.id, to.id), fromId: from.id, toId: to.id};
    return {value: value * from.toBase / to.toBase, fromId: from.id, toId: to.id};
}

export function formatUnitValue(n) {
    if (Object.is(n, -0))
        return '0';
    if (Number.isInteger(n))
        return String(n);
    const rounded = Number(n.toPrecision(8));
    if (Number.isInteger(rounded))
        return String(rounded);
    return String(rounded);
}

export function convertQuery(query) {
    const parsed = parseUnitQuery(query);
    if (!parsed)
        return null;
    const converted = convertUnits(parsed.value, parsed.from, parsed.to);
    if (!converted)
        return null;
    return {
        title: `${formatUnitValue(converted.value)} ${converted.toId}`,
        description: `${formatUnitValue(parsed.value)} ${converted.fromId}`,
    };
}
