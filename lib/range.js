"use strict";

const net = require("net");

function isCIDRStyleRange(range) {
    const [ip, prefix] = range.split("/");
    return net.isIP(ip) && prefix >= 0 && prefix <= 32;
}
function isHyphenPartStyleRange(range) {
    const parts = range.split(".");
    if (parts.length !== 4) return false;
    return parts.every(p => {
        if (isNaN(p)) {
            const r = p.split("-");
            if (r.length !== 2) {
                return false;
            } else {
                return r.every(q => {
                    return !isNaN(q) && q >= 0 && q <= 255;
                });
            }
        } else {
            return p >= 0 && p <= 255;
        }
    });
}
function isHyphenFullStyleRange(range) {
    const ips = range.split("-");
    if (ips.length !== 2) return false;
    return ips.every(net.isIP);
}

function isIPRange(range) {
    if (net.isIP(range)) {
        return false;
    }
    return isCIDRStyleRange(range) || isHyphenPartStyleRange(range)
        || isHyphenFullStyleRange(range);
}

function ip2int(ip) {
    return parseInt(ip.split(".").map(c => ("00" + Number(c).toString(16)).slice(-2))
        .join(""), 16);
}

function int2ip(num) {
    const a = num >>> 24 & 0xFF;
    const b = num >>> 16 & 0xFF;
    const c = num >>> 8 & 0xFF;
    const d = num & 0xFF;
    return [a, b, c, d].join(".");
}

function* CIDRStyleRangeGenerator(range) {
    const [ip, prefix] = range.split("/");
    const ipNum = ip2int(ip);
    const mask = Number(prefix);
    const max = Math.pow(2, 32 - mask) - 1;
    const base = ipNum & ~max;
    let idx = -1;
    while (++idx <= max) {
        yield int2ip(base | idx);
    }
}

function* hyphenPartStyleRangeGenerator(range) {
    let parts = range.split(".").map(v => {
        return function* () {
            let [start, end] = v.split("-");
            start = Math.min(Number(start), 255);
            if (end === undefined) {
                return yield start;
            }
            end = Math.min(Number(end || 255), 255);
            if (start > end) {
                start = end;
            }
            while (start <= end) {
                yield start;
                start += 1;
            }
        };
    });
    function* iter(ary, cursor = 0) {
        if (cursor === ary.length - 1) {
            return yield* [...ary[cursor]()].map(v => [v]);
        }
        for (const val of ary[cursor]()) {
            for (const next of iter(ary, cursor + 1)) {
                yield [val, ...next];
            }
        }
    }
    for (const ips of iter(parts)) {
        yield ips.join(".");
    }
}

function* hyphenFullStyleRangeGenerator(range) {
    const ips = range.split("-").map(ip2int);
    let start = ips[0];
    let end = ips[1];
    if (start === end) {
        return yield int2ip(start);
    } else if (start > end) {
        [start, end] = [end, start];
    }
    while (start <= end) {
        yield int2ip(start);
        start += 1;
    }
}

function convertIPRangeToIterator(range) {
    if (isCIDRStyleRange(range)) {
        return CIDRStyleRangeGenerator(range);
    } else if (isHyphenPartStyleRange(range)) {
        return hyphenPartStyleRangeGenerator(range);
    } else if (isHyphenFullStyleRange(range)) {
        return hyphenFullStyleRangeGenerator(range);
    } else {
        throw new Error(`${range} is not valid ip-range`);
    }
}

exports.convertIPRangeToIterator = convertIPRangeToIterator;
exports.isIPRange = isIPRange;
