// gosh is launcher - length mass temp volume data duration area speed pressure energy power and angle conversions
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
    tbsp: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp',
    tsp: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp',
    floz: 'floz', fluidounce: 'floz', fluidounces: 'floz',
    b: 'b', byte: 'b', bytes: 'b',
    kb: 'kb', kilobyte: 'kb', kilobytes: 'kb',
    mb: 'mb', megabyte: 'mb', megabytes: 'mb',
    gb: 'gb', gigabyte: 'gb', gigabytes: 'gb',
    tb: 'tb', terabyte: 'tb', terabytes: 'tb',
    kib: 'kib', mib: 'mib', gib: 'gib', tib: 'tib',
    s: 's', sec: 's', secs: 's', second: 's', seconds: 's',
    min: 'min', mins: 'min', minute: 'min', minutes: 'min',
    h: 'h', hr: 'h', hrs: 'h', hour: 'h', hours: 'h',
    d: 'd', day: 'd', days: 'd',
    kph: 'kph', kmh: 'kph', kmph: 'kph',
    mph: 'mph',
    mps: 'mps',
    kn: 'kn', knot: 'kn', knots: 'kn',
    m3: 'm3', cubicmeter: 'm3', cubicmetre: 'm3',
    cm3: 'cm3', cc: 'cm3',
    ft3: 'ft3', cuft: 'ft3',
    m2: 'm2', sqm: 'm2', sqmeter: 'm2', sqmetre: 'm2',
    km2: 'km2',
    ha: 'ha', hectare: 'ha', hectares: 'ha',
    acre: 'acre', acres: 'acre',
    ft2: 'ft2', sqft: 'ft2',
    mi2: 'mi2', sqmi: 'mi2',
    pa: 'pa', pascal: 'pa', pascals: 'pa',
    kpa: 'kpa',
    bar: 'bar', bars: 'bar',
    atm: 'atm', atmosphere: 'atm', atmospheres: 'atm',
    psi: 'psi',
    mmhg: 'mmhg', torr: 'mmhg',
    j: 'j', joule: 'j', joules: 'j',
    kj: 'kj', kilojoule: 'kj', kilojoules: 'kj',
    cal: 'cal',
    kcal: 'kcal', kilocalorie: 'kcal', kilocalories: 'kcal', calorie: 'kcal', calories: 'kcal',
    wh: 'wh', watthour: 'wh', watthours: 'wh',
    kwh: 'kwh', kilowatthour: 'kwh', kilowatthours: 'kwh',
    btu: 'btu',
    w: 'w', watt: 'w', watts: 'w',
    kw: 'kw', kilowatt: 'kw', kilowatts: 'kw',
    hp: 'hp', horsepower: 'hp',
    deg: 'deg', degree: 'deg', degrees: 'deg',
    rad: 'rad', radian: 'rad', radians: 'rad',
    gon: 'gon', grad: 'gon', grads: 'gon', gradians: 'gon',
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
    tbsp: {dim: 'volume', toBase: 0.01478676478125},
    tsp: {dim: 'volume', toBase: 0.00492892159375},
    floz: {dim: 'volume', toBase: 0.0295735295625},
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
    s: {dim: 'duration', toBase: 1},
    min: {dim: 'duration', toBase: 60},
    h: {dim: 'duration', toBase: 3600},
    d: {dim: 'duration', toBase: 86400},
    m2: {dim: 'area', toBase: 1},
    km2: {dim: 'area', toBase: 1e6},
    ha: {dim: 'area', toBase: 10000},
    acre: {dim: 'area', toBase: 4046.8564224},
    ft2: {dim: 'area', toBase: 0.09290304},
    mi2: {dim: 'area', toBase: 2589988.110336},
    kph: {dim: 'speed', toBase: 1000 / 3600},
    mph: {dim: 'speed', toBase: 1609.344 / 3600},
    mps: {dim: 'speed', toBase: 1},
    kn: {dim: 'speed', toBase: 1852 / 3600},
    m3: {dim: 'volume', toBase: 1000},
    cm3: {dim: 'volume', toBase: 0.001},
    ft3: {dim: 'volume', toBase: 28.316846592},
    pa: {dim: 'pressure', toBase: 1},
    kpa: {dim: 'pressure', toBase: 1000},
    bar: {dim: 'pressure', toBase: 1e5},
    atm: {dim: 'pressure', toBase: 101325},
    psi: {dim: 'pressure', toBase: 6894.757293168361},
    mmhg: {dim: 'pressure', toBase: 133.32236842105263},
    j: {dim: 'energy', toBase: 1},
    kj: {dim: 'energy', toBase: 1000},
    cal: {dim: 'energy', toBase: 4.184},
    kcal: {dim: 'energy', toBase: 4184},
    wh: {dim: 'energy', toBase: 3600},
    kwh: {dim: 'energy', toBase: 3.6e6},
    btu: {dim: 'energy', toBase: 1055.05585262},
    w: {dim: 'power', toBase: 1},
    kw: {dim: 'power', toBase: 1000},
    hp: {dim: 'power', toBase: 745.6998715822702},
    deg: {dim: 'angle', toBase: 1},
    rad: {dim: 'angle', toBase: 180 / Math.PI},
    gon: {dim: 'angle', toBase: 0.9},
};

const NUMBER = '(-?(?:\\d+(?:\\.\\d+)?|\\.\\d+)(?:[eE][+\\-]?\\d+)?)';
const UNIT = '([a-z][a-z0-9]*)';
const QUERY_RE = new RegExp(`^${NUMBER}\\s*${UNIT}\\s+(?:to|in|into|as)\\s+${UNIT}$`, 'i');
const HOW_MANY_RE = new RegExp(`^how\\s+many\\s+${UNIT}\\s+(?:are\\s+there\\s+in|are\\s+in|is|are|in)\\s+${NUMBER}\\s*${UNIT}$`, 'i');

export function resolveUnit(name) {
    const id = ALIASES[name.toLowerCase()];
    if (!id)
        return null;
    return {id, dim: UNITS[id].dim, toBase: UNITS[id].toBase};
}

export function normalizeUnitQuery(query) {
    let text = query
        // 180° to rad is an angle 32°f keeps the temperature letter
        .replace(/(\d)\s*°\s*(to|in|into|as)\b/gi, '$1 deg $2')
        .replace(/²/g, '2')
        .replace(/³/g, '3')
        .replace(/km\s*\/\s*h(?:r)?/gi, 'kph')
        .replace(/mi\s*\/\s*h/gi, 'mph')
        .replace(/(^|[^a-z])m\s*\/\s*s\b/gi, '$1mps')
        .replace(/\bfluid\s+ounces?\b/gi, 'floz')
        .replace(/\bfl(?:uid)?\s*ozs?\b/gi, 'floz')
        .replace(/\s*degrees?\s+(f|c|k|fahrenheit|celsius|kelvin|centigrade)\b/gi, ' $1')
        .replace(/°/g, ' ');
    // pasted values often use thousands commas or spaces the way the calculator does
    let next = text.replace(/(\d),(\d)/g, '$1$2');
    while (next !== text) {
        text = next;
        next = text.replace(/(\d),(\d)/g, '$1$2');
    }
    next = text.replace(/(\d) (\d{3})\b/g, '$1$2');
    while (next !== text) {
        text = next;
        next = text.replace(/(\d) (\d{3})\b/g, '$1$2');
    }
    return text;
}

export function parseUnitQuery(query) {
    const text = normalizeUnitQuery(query).trim();
    const match = text.match(QUERY_RE);
    if (match) {
        return {
            value: Number(match[1]),
            from: match[2],
            to: match[3],
        };
    }
    const spoken = text.match(HOW_MANY_RE);
    if (!spoken)
        return null;
    return {
        value: Number(spoken[2]),
        from: spoken[3],
        to: spoken[1],
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
