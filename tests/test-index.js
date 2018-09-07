"use strict";

/* eslint-env mocha */

var assert = require("assert");
var util = require("util");
var rewire = require("rewire");

var ipHelper = require("../");

describe("ip-helper", function () {
    var ipv4s = [
        [ "127.0.0.1", Buffer.from([127, 0, 0, 1]) ],
    ];
    var ipv6s = [
        [ "::", Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]) ],
        [ "::1", Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01]) ],
        [ "1::", Buffer.from([0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]) ],
        [ "1::1", Buffer.from([0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01]) ],
        [ "1:2:3:4:5::", Buffer.from([0x00, 0x01, 0x00, 0x02, 0x00, 0x03, 0x00, 0x04, 0x00, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]) ],
        [ "2001:db8::1428:57ab", Buffer.from([0x20, 0x01, 0x0d, 0xb8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x14, 0x28, 0x57, 0xab]) ],
    ];
    describe(".str2buf", function () {
        ipv4s.forEach(function (item) {
            it(item[0] + " -> " + util.inspect(item[1]), function () {
                assert.deepEqual(ipHelper.str2buf(item[0]), item[1]);
            });
        });
        ipv6s.forEach(function (item) {
            it(item[0] + " -> " + util.inspect(item[1]), function () {
                assert.deepEqual(ipHelper.str2buf(item[0]), item[1]);
            });
        });

        it("abcd should throw an Error", function () {
            assert.throws(function () {
                ipHelper.str2buf("abcd");
            }, /非法 IP 地址/);
        });
    });

    describe(".buf2str", function () {
        ipv4s.forEach(function (item) {
            it(util.inspect(item[1]) + " -> " + item[0], function () {
                assert.equal(ipHelper.buf2str(item[1]), item[0]);
            });
        });
        ipv6s.forEach(function (item) {
            it(util.inspect(item[1]) + " -> " + item[0], function () {
                assert.equal(ipHelper.buf2str(item[1], "ipv6").toLowerCase(),
                             item[0].toLowerCase());
            });
        });
    });

    describe(".<private>ip2str", function () {
        var ipHelper = rewire("../index.js");
        var ip2str = ipHelper.__get__("ip2str");
        var tests = [
            { ip: "127.0.0.1", expected: "127.0.0.1" },
            { ip: 0x01000000, expected: "1.0.0.0" },
            { ip: 0xffffffff, expected: "255.255.255.255" },
        ];
        tests.forEach(function (test) {
            it((typeof test.ip == "number" ? "0x" + test.ip.toString(16) : test.ip) + " -> " + test.expected, function () {
                assert.equal(ip2str(test.ip), test.expected);
            });
        });
    });

    describe(".<private>tryNormalize", function () {
        var ipHelper = rewire("../index.js");
        var tryNormalize = ipHelper.__get__("tryNormalize");
        var tests = [
            { test: "0:1:2:3:4:5:6:7", expected: "0:1:2:3:4:5:6:7" },
            { test: "::1",             expected: "0:0:0:0:0:0:0:1" },
            { test: "::0",             expected: "0:0:0:0:0:0:0:0" },
            { test: "1::",             expected: "1:0:0:0:0:0:0:0" },
            { test: "0::",             expected: "0:0:0:0:0:0:0:0" },
            { test: "0:1::",           expected: "0:1:0:0:0:0:0:0" },
            { test: "0:1:2::",         expected: "0:1:2:0:0:0:0:0" },
            { test: "0:1:2:3::",       expected: "0:1:2:3:0:0:0:0" },
            { test: "0:1:2:3:4::",     expected: "0:1:2:3:4:0:0:0" },
            { test: "0:1:2:3:4:5::",   expected: "0:1:2:3:4:5:0:0" },
            { test: "0::7",            expected: "0:0:0:0:0:0:0:7" },
            { test: "0:1::7",          expected: "0:1:0:0:0:0:0:7" },
            { test: "0:1::6:7",        expected: "0:1:0:0:0:0:6:7" },
            { test: "0:1:2::6:7",      expected: "0:1:2:0:0:0:6:7" },
            { test: "0:1:2::5:6:7",    expected: "0:1:2:0:0:5:6:7" },
            { test: "0:1:2:3::5:6:7",  expected: "0:1:2:3:0:5:6:7" },
        ];
        tests.forEach(function (item, idx) {
            it(idx + ": " + item.test + " -> " + item.expected, function () {
                assert.equal(tryNormalize(item.test), item.expected);
            });
        });
    });
});
