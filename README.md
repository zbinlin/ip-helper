# ip-helper

ip calculate helper


## Usage

```javascript
var ipHelper = require("ip-helper");

console.log(ipHelper.str2buf("127.0.0.1")); // <Buffer 7f 00 00 01>

console.log(ipHelper.buf2str(new Buffer([0x7f, 0x00, 0x00, 0x01]))); // 127.0.0.1
```
