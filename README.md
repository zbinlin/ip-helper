# ip-helper

ip calculate helper


## Usage

```javascript
var ipHelper = require("ip-helper");

console.log(ipHelper.str2buf("127.0.0.1")); // <Buffer 7f 00 00 01>

console.log(ipHelper.buf2str(new Buffer([0x7f, 0x00, 0x00, 0x01]))); // 127.0.0.1
```

** News in version 2.0.0 **

> Only supports Node.js v6+

* add ip range Iterator

```javascript
const { convertIPRangeToIterator } = require("ip-helper");

console.log([...convertIPRangeToIterator("127.0.0.1/31")]); // ["127.0.0.0", "127.0.0.1"]
console.log([...convertIPRangeToIterator("127.0.0.1-2")]); // ["127.0.0.1", "127.0.0.2"]

for (const ip of convertIPRangeToIterator("127.0.0.-")) {
	console.log(ip); // "127.0.0.0", ..., "127.0.0.255"
}
```
