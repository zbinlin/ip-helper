"use strict";

var { isIPRange, convertIPRangeToIterator } = require("./lib/range");

exports.isIPRange = isIPRange;
exports.convertIPRangeToIterator = convertIPRangeToIterator;

var net = require("net");
var debuglog = require("util").debuglog || function (prefix) {
    var ps = prefix.split(":");
    prefix = ps[0];
    var debugs = (process.env["NODE_DEBUG"] || "").split(",");
    if (debugs.some(function (item) {
        return item.toLowerCase() == prefix.toLowerCase();
    })) {
        prefix = prefix.toUpperCase() + " " + process.pid + ":";
    } else {
        prefix = null;
    }

    return function (str) {
        if (prefix) {
            console.log(prefix, str);
        }
    };
};
var logger = {};
logger.debug = debuglog("ip-helper:debug");
logger.info = debuglog("ip-helper:info");
logger.warn = debuglog("ip-helper:warn");
logger.error = debuglog("ip-helper:error");


/*
 * 将有效的数字（32位整数值） IPv4 地址转成字串串形式：xx.xx.xx.xx
 * 如果无法转换（不是有效的地址），将直接返回原来的值。
 *
 * @param {*} ip
 * @return {string|*}
 */
var MAX_IP_NUMBER = Math.pow(2, 32) - 1;
function ip2str(ip) {
    var num = Number(ip);
    if (isNaN(num) || num % 1 !== 0 || num > MAX_IP_NUMBER) {
        return ip;
    }
    var a = num >>> 24;
    var b = num >>> 16 & 0xff;
    var c = num >>> 8 & 0xff;
    var d = num & 0xff;
    return [a, b, c, d].join(".");
}

function tryNormalize(str) {
    var expandLength = 8 - str.split(":").length;
    if (expandLength > 0) {
        var idx = str.indexOf("::");
        str = str.slice(0, idx) + new Array(expandLength + 1).join(":") + str.slice(idx);
    }
    return str.split(":").map(item => item ? item : 0).join(":");
}

/*
* IP 地址字符串轉換為 IP buffer 對象
* 如：
*  127.0.0.1 轉換成 <Buffer[7f, 00, 00, 01]>
*  2001:0DB8::1428:57ab 轉換成 <Buffer 20 01 0d b8 00 00 00 00 00 00 00 00 14 28 57 ab>
*  @param {string|number} str
*  @returns {Buffer}
*/
function str2buf(str) {

    // 将数字形式的 ip，如 0xffffffff 转成字符串 "255.255.255.255"
    str = ip2str(str);

    if (net.isIPv4(str)) {
        return Buffer.from(str.split(".").map(function (item) {
            return parseInt(item, 10);
        }));
    } else if (net.isIPv6(str)) {
        str = tryNormalize(str);
        return Buffer.from(str.split(":").reduce(function (pre, cur, idx, ary) {
            var num = parseInt(cur, 16);
            pre.push(num >>> 8);
            pre.push(num & 0xFF);
            return pre;
        }, []));
    } else {
        throw new Error("非法 IP 地址：" + str + "！");
    }
}

/*
* IP Buffer 對象轉換成 IP 地址字符串
* 如：
* <Buffer 7f 00 00 01> 轉換成 127.0.0.1
* @param {Buffer} buf
* @param {string} [type = buf.length === 4 ? "ipv4" : "ipv6"]
* @returns {string}
*/
function buf2str(buf, type) {
    var str = "";
    if (!(buf instanceof Buffer)) {
        throw new Error("第一個參數::" + buf + ":: 不是一個 Buffer 對象！");
    }
    if (type === undefined) {
        type = buf.length === 4 ? "ipv4" : "ipv6";
    } else if (typeof type !== "string") {
        type = String(type);
    }
    switch (type.toLowerCase()) {
        case "ipv4":
            str = ([]).slice.apply(buf.slice(0, 4)).join(".");
            break;
        case "ipv6":
            str = ([]).slice.apply(buf.slice(0, 16)).reduce(function (pre, cur, idx, arr) {
                if (0 === idx % 2) {
                    pre.push((cur << 8 | arr[idx + 1]).toString(16));
                }
                return pre;
            }, []).join(":");
            str = trimIpv6(str);
            break;
        default:
            throw new Error("第二個參數 ::" + type + ":: 為未知類型！");
    }
    if (net.isIP(str)) {
        return str;
    } else {
        throw new Error("無法轉換成合法的 IP 地址！");
    }

    function trimIpv6(ip) {
        if (!net.isIPv6(ip)) return ip;

        ip = ip.replace(/(^|:)0+(\w)/g, "$1$2");

        if (!/::/.test(ip)) {
            return ip.replace(/(^|:)(?:0{1,4}:(?:0{1,4}$)?){2,}/, "::");
        }
        return ip;
    }
}

exports.str2buf = str2buf;
exports.buf2str = buf2str;
