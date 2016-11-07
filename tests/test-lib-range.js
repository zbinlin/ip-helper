"use strict";

/* eslint-env mocha */
const assert = require("assert");
const { isIPRange, convertIPRangeToIterator } = require("../lib/range.js");

describe("test isIPRange function", () => {
    it("returns true if arguments 0 is a CIDR-style ip range", () => {
        assert.ok(isIPRange("127.0.0.1/32"));
    });
    it("returns true if arguments 0 is a hyphen-part-style ip range", () => {
        assert.ok(isIPRange("127.0.0.0-255"));
    });
    it("returns true if arguments 0 is a hyphen-full-style ip range", () => {
        assert.ok(isIPRange("127.0.0.1-127.0.0.255"));
    });
    it("returns false if arguments 0 is not a valid ip range", () => {
        assert.equal(isIPRange("127.0"), false);
    });
});

describe("test convertIPRangeToIterator", () => {
    it("returns an iterator", () => {
        assert.deepEqual([...convertIPRangeToIterator("127.0.0.1/31")], [
            "127.0.0.0", "127.0.0.1",
        ]);
        assert.deepEqual([...convertIPRangeToIterator("127.0.1-2.1")], [
            "127.0.1.1", "127.0.2.1",
        ]);
        assert.deepEqual([...convertIPRangeToIterator("127.0.1.1-127.0.1.1")], [
            "127.0.1.1",
        ]);
        assert.deepEqual([...convertIPRangeToIterator("127.0.1.1-127.0.1.2")], [
            "127.0.1.1", "127.0.1.2",
        ]);
        assert.deepEqual([...convertIPRangeToIterator("127.0.1.2-127.0.1.1")], [
            "127.0.1.1", "127.0.1.2",
        ]);
        assert.equal([...convertIPRangeToIterator("127.0.0.1/24")].length, 256);
        assert.equal([...convertIPRangeToIterator("127.0.0.-")].length, 256);
        assert.equal([...convertIPRangeToIterator("127.0.0.0-127.0.0.255")].length, 256);
    });
    it("throws an error if the arguments is not valid ip range", () => {
        assert.throws(() => {
            convertIPRangeToIterator("127.0.1");
        });
    });
});
