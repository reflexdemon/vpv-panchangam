var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// node_modules/@swisseph/browser/dist/swisseph.js
var swisseph_exports = {};
__export(swisseph_exports, {
  default: () => swisseph_default
});
var SwissEphModule, swisseph_default;
var init_swisseph = __esm({
  "node_modules/@swisseph/browser/dist/swisseph.js"() {
    SwissEphModule = (() => {
      var _scriptName = globalThis.document?.currentScript?.src;
      return async function(moduleArg = {}) {
        var Module = moduleArg;
        var ENVIRONMENT_IS_WEB = !!globalThis.window;
        var ENVIRONMENT_IS_WORKER = !!globalThis.WorkerGlobalScope;
        var ENVIRONMENT_IS_NODE = globalThis.process?.versions?.node && globalThis.process?.type != "renderer";
        var programArgs = [];
        var thisProgram = "./this.program";
        if (ENVIRONMENT_IS_WORKER) {
          _scriptName = self.location.href;
        }
        var scriptDirectory = "";
        function locateFile(path) {
          if (Module["locateFile"]) {
            return Module["locateFile"](path, scriptDirectory);
          }
          return scriptDirectory + path;
        }
        var readAsync, readBinary;
        if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
          try {
            scriptDirectory = new URL(".", _scriptName).href;
          } catch {
          }
          {
            if (ENVIRONMENT_IS_WORKER) {
              readBinary = (url) => {
                var xhr = new XMLHttpRequest();
                xhr.open("GET", url, false);
                xhr.responseType = "arraybuffer";
                xhr.send(null);
                return new Uint8Array(xhr.response);
              };
            }
            readAsync = async (url) => {
              var response = await fetch(url, { credentials: "same-origin" });
              if (response.ok) {
                return response.arrayBuffer();
              }
              throw new Error(response.status + " : " + response.url);
            };
          }
        } else {
        }
        var out = console.log.bind(console);
        var err = console.error.bind(console);
        var wasmBinary;
        var ABORT = false;
        class EmscriptenEH {
        }
        class EmscriptenSjLj extends EmscriptenEH {
        }
        var runtimeInitialized = false;
        function getMemoryBuffer() {
          return wasmMemory.buffer;
        }
        function updateMemoryViews() {
          if (HEAP8?.buffer?.resizable) return;
          var b = getMemoryBuffer();
          HEAP8 = new Int8Array(b);
          HEAP16 = new Int16Array(b);
          HEAPU8 = new Uint8Array(b);
          HEAPU16 = new Uint16Array(b);
          HEAP32 = new Int32Array(b);
          HEAPU32 = new Uint32Array(b);
          HEAPF32 = new Float32Array(b);
          HEAPF64 = new Float64Array(b);
          HEAP64 = new BigInt64Array(b);
          HEAPU64 = new BigUint64Array(b);
        }
        function preRun() {
          var preRun2 = Module["preRun"];
          if (preRun2) {
            if (typeof preRun2 == "function") preRun2 = [preRun2];
            onPreRuns.push(...preRun2);
          }
          callRuntimeCallbacks(onPreRuns);
        }
        function initRuntime() {
          runtimeInitialized = true;
          if (!Module["noFSInit"] && !FS.initialized) FS.init();
          TTY.init();
          wasmExports["l"]();
          FS.ignorePermissions = false;
        }
        function postRun() {
          var postRun2 = Module["postRun"];
          if (postRun2) {
            if (typeof postRun2 == "function") postRun2 = [postRun2];
            onPostRuns.push(...postRun2);
          }
          callRuntimeCallbacks(onPostRuns);
        }
        function abort(what) {
          Module["onAbort"]?.(what);
          what = `Aborted(${what})`;
          err(what);
          ABORT = true;
          what += ". Build with -sASSERTIONS for more info.";
          var e = new WebAssembly.RuntimeError(what);
          throw e;
        }
        var wasmBinaryFile;
        function findWasmBinary() {
          return locateFile("swisseph.wasm");
        }
        function getBinarySync(file) {
          if (readBinary) {
            return readBinary(file);
          }
          throw "both async and sync fetching of the wasm failed";
        }
        async function getWasmBinary(binaryFile) {
          if (!wasmBinary) {
            try {
              var response = await readAsync(binaryFile);
              return new Uint8Array(response);
            } catch {
            }
          }
          return getBinarySync(binaryFile);
        }
        async function instantiateArrayBuffer(binaryFile, imports) {
          try {
            var binary = await getWasmBinary(binaryFile);
            var instance = await WebAssembly.instantiate(binary, imports);
            return instance;
          } catch (reason) {
            err(`failed to asynchronously prepare wasm: ${reason}`);
            abort(reason);
          }
        }
        async function instantiateAsync(binary, binaryFile, imports) {
          if (!binary) {
            try {
              var response = fetch(binaryFile, { credentials: "same-origin" });
              var instantiationResult = await WebAssembly.instantiateStreaming(response, imports);
              return instantiationResult;
            } catch (reason) {
              err(`wasm streaming compile failed: ${reason}`);
              err("falling back to ArrayBuffer instantiation");
            }
          }
          return instantiateArrayBuffer(binaryFile, imports);
        }
        function getWasmImports() {
          var imports = { a: wasmImports };
          return imports;
        }
        async function createWasm() {
          function receiveInstance(instance) {
            wasmExports = instance.exports;
            assignWasmExports(wasmExports);
            updateMemoryViews();
            return wasmExports;
          }
          function receiveInstantiationResult(result2) {
            return receiveInstance(result2["instance"]);
          }
          var info = getWasmImports();
          var instantiateWasm = Module["instantiateWasm"];
          if (instantiateWasm) {
            return new Promise((resolve) => {
              instantiateWasm(info, (inst) => resolve(receiveInstance(inst)));
            });
          }
          wasmBinaryFile ??= findWasmBinary();
          var result = await instantiateAsync(wasmBinary, wasmBinaryFile, info);
          var exports2 = receiveInstantiationResult(result);
          return exports2;
        }
        class ExitStatus {
          name = "ExitStatus";
          constructor(status) {
            this.message = `Program terminated with exit(${status})`;
            this.status = status;
          }
        }
        var HEAP16;
        var HEAP32;
        var HEAP64;
        var HEAP8;
        var HEAPF32;
        var HEAPF64;
        var HEAPU16;
        var HEAPU32;
        var HEAPU64;
        var HEAPU8;
        var callRuntimeCallbacks = (callbacks) => {
          while (callbacks.length > 0) {
            callbacks.shift()(Module);
          }
        };
        var onPostRuns = [];
        var onPreRuns = [];
        function getValue(ptr, type = "i8") {
          if (type.endsWith("*")) type = "*";
          switch (type) {
            case "i1":
              return HEAP8[ptr];
            case "i8":
              return HEAP8[ptr];
            case "i16":
              return HEAP16[ptr >> 1];
            case "i32":
              return HEAP32[ptr >> 2];
            case "i64":
              return HEAP64[ptr >> 3];
            case "float":
              return HEAPF32[ptr >> 2];
            case "double":
              return HEAPF64[ptr >> 3];
            case "*":
              return HEAPU32[ptr >> 2];
            default:
              abort(`invalid type for getValue: ${type}`);
          }
        }
        var noExitRuntime = true;
        function setValue(ptr, value, type = "i8") {
          if (type.endsWith("*")) type = "*";
          switch (type) {
            case "i1":
              HEAP8[ptr] = value;
              break;
            case "i8":
              HEAP8[ptr] = value;
              break;
            case "i16":
              HEAP16[ptr >> 1] = value;
              break;
            case "i32":
              HEAP32[ptr >> 2] = value;
              break;
            case "i64":
              HEAP64[ptr >> 3] = BigInt(value);
              break;
            case "float":
              HEAPF32[ptr >> 2] = value;
              break;
            case "double":
              HEAPF64[ptr >> 3] = value;
              break;
            case "*":
              HEAPU32[ptr >> 2] = value;
              break;
            default:
              abort(`invalid type for setValue: ${type}`);
          }
        }
        var stackRestore = (val) => __emscripten_stack_restore(val);
        var stackSave = () => _emscripten_stack_get_current();
        var syscallGetVarargI = () => {
          var ret = HEAP32[+SYSCALLS.varargs >> 2];
          SYSCALLS.varargs += 4;
          return ret;
        };
        var syscallGetVarargP = syscallGetVarargI;
        var PATH = { isAbs: (path) => path.charAt(0) === "/", splitPath: (filename) => {
          var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
          return splitPathRe.exec(filename).slice(1);
        }, normalizeArray: (parts, allowAboveRoot) => {
          var up = 0;
          for (var i = parts.length - 1; i >= 0; i--) {
            var last = parts[i];
            if (last === ".") {
              parts.splice(i, 1);
            } else if (last === "..") {
              parts.splice(i, 1);
              up++;
            } else if (up) {
              parts.splice(i, 1);
              up--;
            }
          }
          if (allowAboveRoot) {
            for (; up; up--) {
              parts.unshift("..");
            }
          }
          return parts;
        }, normalize: (path) => {
          var isAbsolute = PATH.isAbs(path), trailingSlash = path.slice(-1) === "/";
          path = PATH.normalizeArray(path.split("/").filter((p) => !!p), !isAbsolute).join("/");
          if (!path && !isAbsolute) {
            path = ".";
          }
          if (path && trailingSlash) {
            path += "/";
          }
          return (isAbsolute ? "/" : "") + path;
        }, dirname: (path) => {
          var result = PATH.splitPath(path), root = result[0], dir = result[1];
          if (!root && !dir) {
            return ".";
          }
          if (dir) {
            dir = dir.slice(0, -1);
          }
          return root + dir;
        }, basename: (path) => path && path.match(/([^\/]+|\/)\/*$/)[1], join: (...paths) => PATH.normalize(paths.join("/")), join2: (l, r) => PATH.normalize(l + "/" + r) };
        var initRandomFill = () => (view) => (crypto.getRandomValues(view), 0);
        var randomFill = (view) => (randomFill = initRandomFill())(view);
        var PATH_FS = { resolve: (...args) => {
          var resolvedPath = "", resolvedAbsolute = false;
          for (var i = args.length - 1; i >= -1 && !resolvedAbsolute; i--) {
            var path = i >= 0 ? args[i] : FS.cwd();
            if (typeof path != "string") {
              throw new TypeError("Arguments to path.resolve must be strings");
            } else if (!path) {
              return "";
            }
            resolvedPath = path + "/" + resolvedPath;
            resolvedAbsolute = PATH.isAbs(path);
          }
          resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter((p) => !!p), !resolvedAbsolute).join("/");
          return (resolvedAbsolute ? "/" : "") + resolvedPath || ".";
        }, relative: (from, to) => {
          from = PATH_FS.resolve(from).slice(1);
          to = PATH_FS.resolve(to).slice(1);
          function trim(arr) {
            var start = 0;
            for (; start < arr.length; start++) {
              if (arr[start] !== "") break;
            }
            var end = arr.length - 1;
            for (; end >= 0; end--) {
              if (arr[end] !== "") break;
            }
            if (start > end) return [];
            return arr.slice(start, end - start + 1);
          }
          var fromParts = trim(from.split("/"));
          var toParts = trim(to.split("/"));
          var length = Math.min(fromParts.length, toParts.length);
          var samePartsLength = length;
          for (var i = 0; i < length; i++) {
            if (fromParts[i] !== toParts[i]) {
              samePartsLength = i;
              break;
            }
          }
          var outputParts = [];
          for (var i = samePartsLength; i < fromParts.length; i++) {
            outputParts.push("..");
          }
          outputParts = outputParts.concat(toParts.slice(samePartsLength));
          return outputParts.join("/");
        } };
        var UTF8Decoder = globalThis.TextDecoder && new TextDecoder();
        var findStringEnd = (heapOrArray, idx, maxBytesToRead, ignoreNul) => {
          var maxIdx = idx + maxBytesToRead;
          if (ignoreNul) return maxIdx;
          while (heapOrArray[idx] && !(idx >= maxIdx)) ++idx;
          return idx;
        };
        var UTF8ArrayToString = (heapOrArray, idx = 0, maxBytesToRead, ignoreNul) => {
          var endPtr = findStringEnd(heapOrArray, idx, maxBytesToRead, ignoreNul);
          if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
            return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
          }
          var str = "";
          while (idx < endPtr) {
            var u0 = heapOrArray[idx++];
            if (!(u0 & 128)) {
              str += String.fromCharCode(u0);
              continue;
            }
            var u1 = heapOrArray[idx++] & 63;
            if ((u0 & 224) == 192) {
              str += String.fromCharCode((u0 & 31) << 6 | u1);
              continue;
            }
            var u2 = heapOrArray[idx++] & 63;
            if ((u0 & 240) == 224) {
              u0 = (u0 & 15) << 12 | u1 << 6 | u2;
            } else {
              u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heapOrArray[idx++] & 63;
            }
            if (u0 < 65536) {
              str += String.fromCharCode(u0);
            } else {
              var ch = u0 - 65536;
              str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
            }
          }
          return str;
        };
        var FS_stdin_getChar_buffer = [];
        var lengthBytesUTF8 = (str) => {
          var len = 0;
          for (var i = 0; i < str.length; ++i) {
            var c = str.charCodeAt(i);
            if (c <= 127) {
              len++;
            } else if (c <= 2047) {
              len += 2;
            } else if (c >= 55296 && c <= 57343) {
              len += 4;
              ++i;
            } else {
              len += 3;
            }
          }
          return len;
        };
        var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
          if (!(maxBytesToWrite > 0)) return 0;
          var startIdx = outIdx;
          var endIdx = outIdx + maxBytesToWrite - 1;
          for (var i = 0; i < str.length; ++i) {
            var u = str.codePointAt(i);
            if (u <= 127) {
              if (outIdx >= endIdx) break;
              heap[outIdx++] = u;
            } else if (u <= 2047) {
              if (outIdx + 1 >= endIdx) break;
              heap[outIdx++] = 192 | u >> 6;
              heap[outIdx++] = 128 | u & 63;
            } else if (u <= 65535) {
              if (outIdx + 2 >= endIdx) break;
              heap[outIdx++] = 224 | u >> 12;
              heap[outIdx++] = 128 | u >> 6 & 63;
              heap[outIdx++] = 128 | u & 63;
            } else {
              if (outIdx + 3 >= endIdx) break;
              heap[outIdx++] = 240 | u >> 18;
              heap[outIdx++] = 128 | u >> 12 & 63;
              heap[outIdx++] = 128 | u >> 6 & 63;
              heap[outIdx++] = 128 | u & 63;
              i++;
            }
          }
          heap[outIdx] = 0;
          return outIdx - startIdx;
        };
        var intArrayFromString = (stringy, dontAddNull, length) => {
          var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
          var u8array = new Array(len);
          var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
          if (dontAddNull) u8array.length = numBytesWritten;
          return u8array;
        };
        var FS_stdin_getChar = () => {
          if (!FS_stdin_getChar_buffer.length) {
            var result = null;
            if (globalThis.window?.prompt) {
              result = window.prompt("Input: ");
              if (result !== null) {
                result += "\n";
              }
            } else {
            }
            if (!result) {
              return null;
            }
            FS_stdin_getChar_buffer = intArrayFromString(result, true);
          }
          return FS_stdin_getChar_buffer.shift();
        };
        var TTY = { ttys: [], init() {
        }, shutdown() {
        }, register(dev, ops) {
          TTY.ttys[dev] = { input: [], output: [], ops };
          FS.registerDevice(dev, TTY.stream_ops);
        }, stream_ops: { open(stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(43);
          }
          stream.tty = tty;
          stream.seekable = false;
        }, close(stream) {
          stream.tty.ops.fsync(stream.tty);
        }, fsync(stream) {
          stream.tty.ops.fsync(stream.tty);
        }, read(stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(60);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(29);
            }
            if (result === void 0 && bytesRead === 0) {
              throw new FS.ErrnoError(6);
            }
            if (result === null || result === void 0) break;
            bytesRead++;
            buffer[offset + i] = result;
          }
          if (bytesRead) {
            stream.node.atime = Date.now();
          }
          return bytesRead;
        }, write(stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(60);
          }
          try {
            for (var i = 0; i < length; i++) {
              stream.tty.ops.put_char(stream.tty, buffer[offset + i]);
            }
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
          if (length) {
            stream.node.mtime = stream.node.ctime = Date.now();
          }
          return i;
        } }, default_tty_ops: { get_char(tty) {
          return FS_stdin_getChar();
        }, put_char(tty, val) {
          if (val === null || val === 10) {
            out(UTF8ArrayToString(tty.output));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val);
          }
        }, fsync(tty) {
          if (tty.output?.length > 0) {
            out(UTF8ArrayToString(tty.output));
            tty.output = [];
          }
        }, ioctl_tcgets(tty) {
          return { c_iflag: 25856, c_oflag: 5, c_cflag: 191, c_lflag: 35387, c_cc: [3, 28, 127, 21, 4, 0, 1, 0, 17, 19, 26, 0, 18, 15, 23, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] };
        }, ioctl_tcsets(tty, optional_actions, data) {
          return 0;
        }, ioctl_tiocgwinsz(tty) {
          return [24, 80];
        } }, default_tty1_ops: { put_char(tty, val) {
          if (val === null || val === 10) {
            err(UTF8ArrayToString(tty.output));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val);
          }
        }, fsync(tty) {
          if (tty.output?.length > 0) {
            err(UTF8ArrayToString(tty.output));
            tty.output = [];
          }
        } } };
        var mmapAlloc = (size) => {
          abort();
        };
        var MEMFS = { ops_table: null, mount(mount) {
          return MEMFS.createNode(null, "/", 16895, 0);
        }, createNode(parent, name, mode, dev) {
          if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
            throw new FS.ErrnoError(63);
          }
          MEMFS.ops_table ||= { dir: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr, lookup: MEMFS.node_ops.lookup, mknod: MEMFS.node_ops.mknod, rename: MEMFS.node_ops.rename, unlink: MEMFS.node_ops.unlink, rmdir: MEMFS.node_ops.rmdir, readdir: MEMFS.node_ops.readdir, symlink: MEMFS.node_ops.symlink }, stream: { llseek: MEMFS.stream_ops.llseek } }, file: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr }, stream: { llseek: MEMFS.stream_ops.llseek, read: MEMFS.stream_ops.read, write: MEMFS.stream_ops.write, mmap: MEMFS.stream_ops.mmap, msync: MEMFS.stream_ops.msync } }, link: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr, readlink: MEMFS.node_ops.readlink }, stream: {} }, chrdev: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr }, stream: FS.chrdev_stream_ops } };
          var node = FS.createNode(parent, name, mode, dev);
          if (FS.isDir(node.mode)) {
            node.node_ops = MEMFS.ops_table.dir.node;
            node.stream_ops = MEMFS.ops_table.dir.stream;
            node.contents = {};
          } else if (FS.isFile(node.mode)) {
            node.node_ops = MEMFS.ops_table.file.node;
            node.stream_ops = MEMFS.ops_table.file.stream;
            node.usedBytes = 0;
            node.contents = MEMFS.emptyFileContents ??= new Uint8Array(0);
          } else if (FS.isLink(node.mode)) {
            node.node_ops = MEMFS.ops_table.link.node;
            node.stream_ops = MEMFS.ops_table.link.stream;
          } else if (FS.isChrdev(node.mode)) {
            node.node_ops = MEMFS.ops_table.chrdev.node;
            node.stream_ops = MEMFS.ops_table.chrdev.stream;
          }
          node.atime = node.mtime = node.ctime = Date.now();
          if (parent) {
            parent.contents[name] = node;
            parent.atime = parent.mtime = parent.ctime = node.atime;
          }
          return node;
        }, getFileDataAsTypedArray(node) {
          return node.contents.subarray(0, node.usedBytes);
        }, expandFileStorage(node, newCapacity) {
          var prevCapacity = node.contents.length;
          if (prevCapacity >= newCapacity) return;
          var CAPACITY_DOUBLING_MAX = 1024 * 1024;
          newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) >>> 0);
          if (prevCapacity) newCapacity = Math.max(newCapacity, 256);
          var oldContents = MEMFS.getFileDataAsTypedArray(node);
          node.contents = new Uint8Array(newCapacity);
          node.contents.set(oldContents);
        }, resizeFileStorage(node, newSize) {
          if (node.usedBytes == newSize) return;
          var oldContents = node.contents;
          node.contents = new Uint8Array(newSize);
          node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)));
          node.usedBytes = newSize;
        }, node_ops: { getattr(node) {
          var attr = {};
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.usedBytes;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.atime);
          attr.mtime = new Date(node.mtime);
          attr.ctime = new Date(node.ctime);
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        }, setattr(node, attr) {
          for (const key of ["mode", "atime", "mtime", "ctime"]) {
            if (attr[key] != null) {
              node[key] = attr[key];
            }
          }
          if (attr.size !== void 0) {
            MEMFS.resizeFileStorage(node, attr.size);
          }
        }, lookup(parent, name) {
          if (!MEMFS.doesNotExistError) {
            MEMFS.doesNotExistError = new FS.ErrnoError(44);
            MEMFS.doesNotExistError.stack = "<generic error, no stack>";
          }
          throw MEMFS.doesNotExistError;
        }, mknod(parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        }, rename(old_node, new_dir, new_name) {
          var new_node;
          try {
            new_node = FS.lookupNode(new_dir, new_name);
          } catch (e) {
          }
          if (new_node) {
            if (FS.isDir(old_node.mode)) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(55);
              }
            }
            FS.hashRemoveNode(new_node);
          }
          delete old_node.parent.contents[old_node.name];
          new_dir.contents[new_name] = old_node;
          old_node.name = new_name;
          new_dir.ctime = new_dir.mtime = old_node.parent.ctime = old_node.parent.mtime = Date.now();
        }, unlink(parent, name) {
          delete parent.contents[name];
          parent.ctime = parent.mtime = Date.now();
        }, rmdir(parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(55);
          }
          delete parent.contents[name];
          parent.ctime = parent.mtime = Date.now();
        }, readdir(node) {
          return [".", "..", ...Object.keys(node.contents)];
        }, symlink(parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
          node.link = oldpath;
          return node;
        }, readlink(node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(28);
          }
          return node.link;
        } }, stream_ops: { read(stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= stream.node.usedBytes) return 0;
          var size = Math.min(stream.node.usedBytes - position, length);
          buffer.set(contents.subarray(position, position + size), offset);
          return size;
        }, write(stream, buffer, offset, length, position, canOwn) {
          if (buffer.buffer === HEAP8.buffer) {
            canOwn = false;
          }
          if (!length) return 0;
          var node = stream.node;
          node.mtime = node.ctime = Date.now();
          if (canOwn) {
            node.contents = buffer.subarray(offset, offset + length);
            node.usedBytes = length;
          } else if (node.usedBytes === 0 && position === 0) {
            node.contents = buffer.slice(offset, offset + length);
            node.usedBytes = length;
          } else {
            MEMFS.expandFileStorage(node, position + length);
            node.contents.set(buffer.subarray(offset, offset + length), position);
            node.usedBytes = Math.max(node.usedBytes, position + length);
          }
          return length;
        }, llseek(stream, offset, whence) {
          var position = offset;
          if (whence === 1) {
            position += stream.position;
          } else if (whence === 2) {
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.usedBytes;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(28);
          }
          return position;
        }, mmap(stream, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(43);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          if (!(flags & 2) && contents.buffer === HEAP8.buffer) {
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            allocated = true;
            ptr = mmapAlloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(48);
            }
            if (contents) {
              if (position > 0 || position + length < contents.length) {
                if (contents.subarray) {
                  contents = contents.subarray(position, position + length);
                } else {
                  contents = Array.prototype.slice.call(contents, position, position + length);
                }
              }
              HEAP8.set(contents, ptr);
            }
          }
          return { ptr, allocated };
        }, msync(stream, buffer, offset, length, mmapFlags) {
          MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
          return 0;
        } } };
        var FS_modeStringToFlags = (str) => {
          if (typeof str != "string") return str;
          var flagModes = { r: 0, "r+": 2, w: 512 | 64 | 1, "w+": 512 | 64 | 2, a: 1024 | 64 | 1, "a+": 1024 | 64 | 2 };
          var flags = flagModes[str];
          if (typeof flags == "undefined") {
            throw new Error(`Unknown file open mode: ${str}`);
          }
          return flags;
        };
        var FS_fileDataToTypedArray = (data) => {
          if (typeof data == "string") {
            data = intArrayFromString(data, true);
          }
          if (!data.subarray) {
            data = new Uint8Array(data);
          }
          return data;
        };
        var FS_getMode = (canRead, canWrite) => {
          var mode = 0;
          if (canRead) mode |= 292 | 73;
          if (canWrite) mode |= 146;
          return mode;
        };
        var asyncLoad = async (url) => {
          var arrayBuffer = await readAsync(url);
          return new Uint8Array(arrayBuffer);
        };
        var FS_createDataFile = (...args) => FS.createDataFile(...args);
        var getUniqueRunDependency = (id) => id;
        var dependenciesPromise = null;
        var resolveRunDependencies = async () => dependenciesPromise;
        var runDependencies = 0;
        var dependenciesPromiseResolve = null;
        var removeRunDependency = (id) => {
          runDependencies--;
          Module["monitorRunDependencies"]?.(runDependencies);
          if (!runDependencies) {
            dependenciesPromiseResolve();
          }
        };
        var addRunDependency = (id) => {
          if (!runDependencies) {
            dependenciesPromise = new Promise((resolve) => dependenciesPromiseResolve = resolve);
          }
          runDependencies++;
          Module["monitorRunDependencies"]?.(runDependencies);
        };
        var preloadPlugins = [];
        var FS_handledByPreloadPlugin = async (byteArray, fullname) => {
          if (typeof Browser != "undefined") Browser.init();
          for (var plugin of preloadPlugins) {
            if (plugin["canHandle"](fullname)) {
              return plugin["handle"](byteArray, fullname);
            }
          }
          return byteArray;
        };
        var FS_preloadFile = async (parent, name, url, canRead, canWrite, dontCreateFile, canOwn, preFinish) => {
          var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
          var dep = getUniqueRunDependency(`cp ${fullname}`);
          addRunDependency(dep);
          try {
            var byteArray = url;
            if (typeof url == "string") {
              byteArray = await asyncLoad(url);
            }
            byteArray = await FS_handledByPreloadPlugin(byteArray, fullname);
            preFinish?.();
            if (!dontCreateFile) {
              FS_createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
          } finally {
            removeRunDependency(dep);
          }
        };
        var FS_createPreloadedFile = (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) => {
          FS_preloadFile(parent, name, url, canRead, canWrite, dontCreateFile, canOwn, preFinish).then(onload).catch(onerror);
        };
        var FS = { root: null, mounts: [], devices: {}, streams: [], nextInode: 1, nameTable: null, currentPath: "/", initialized: false, ignorePermissions: true, filesystems: null, syncFSRequests: 0, ErrnoError: class {
          name = "ErrnoError";
          constructor(errno) {
            this.errno = errno;
          }
        }, FSStream: class {
          shared = {};
          get object() {
            return this.node;
          }
          set object(val) {
            this.node = val;
          }
          get isRead() {
            return (this.flags & 2097155) !== 1;
          }
          get isWrite() {
            return (this.flags & 2097155) !== 0;
          }
          get isAppend() {
            return this.flags & 1024;
          }
          get flags() {
            return this.shared.flags;
          }
          set flags(val) {
            this.shared.flags = val;
          }
          get position() {
            return this.shared.position;
          }
          set position(val) {
            this.shared.position = val;
          }
        }, FSNode: class {
          node_ops = {};
          stream_ops = {};
          readMode = 292 | 73;
          writeMode = 146;
          mounted = null;
          constructor(parent, name, mode, rdev) {
            if (!parent) {
              parent = this;
            }
            this.parent = parent;
            this.mount = parent.mount;
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.rdev = rdev;
            this.atime = this.mtime = this.ctime = Date.now();
          }
          get read() {
            return (this.mode & this.readMode) === this.readMode;
          }
          set read(val) {
            val ? this.mode |= this.readMode : this.mode &= ~this.readMode;
          }
          get write() {
            return (this.mode & this.writeMode) === this.writeMode;
          }
          set write(val) {
            val ? this.mode |= this.writeMode : this.mode &= ~this.writeMode;
          }
          get isFolder() {
            return FS.isDir(this.mode);
          }
          get isDevice() {
            return FS.isChrdev(this.mode);
          }
          addListener(cb, exclusive = false) {
            var entry = { cb, exclusive };
            var listeners = this.listeners ??= /* @__PURE__ */ new Set();
            listeners.add(entry);
            return { listeners, entry };
          }
          notifyListeners(flags) {
            if (!this.listeners) return;
            var excl;
            for (var entry of this.listeners) {
              if (entry.exclusive) (excl ||= []).push(entry);
              else entry.cb(flags);
            }
            if (excl) {
              var i = (this.exclTurn || 0) % excl.length;
              this.exclTurn = i + 1;
              excl[i].cb(flags);
            }
          }
        }, lookupPath(path, opts = {}) {
          if (!path) {
            throw new FS.ErrnoError(44);
          }
          opts.follow_mount ??= true;
          if (!PATH.isAbs(path)) {
            path = FS.cwd() + "/" + path;
          }
          linkloop: for (var nlinks = 0; nlinks < 40; nlinks++) {
            var parts = path.split("/").filter((p) => !!p);
            var current = FS.root;
            var current_path = "/";
            for (var i = 0; i < parts.length; i++) {
              var islast = i === parts.length - 1;
              if (islast && opts.parent) {
                break;
              }
              if (parts[i] === ".") {
                continue;
              }
              if (parts[i] === "..") {
                current_path = PATH.dirname(current_path);
                if (FS.isRoot(current)) {
                  path = current_path + "/" + parts.slice(i + 1).join("/");
                  nlinks--;
                  continue linkloop;
                } else {
                  current = current.parent;
                }
                continue;
              }
              current_path = PATH.join2(current_path, parts[i]);
              try {
                current = FS.lookupNode(current, parts[i]);
              } catch (e) {
                if (e?.errno === 44 && islast && opts.noent_okay) {
                  return { path: current_path };
                }
                throw e;
              }
              if (FS.isMountpoint(current) && (!islast || opts.follow_mount)) {
                current = current.mounted.root;
              }
              if (FS.isLink(current.mode) && (!islast || opts.follow)) {
                if (!current.node_ops.readlink) {
                  throw new FS.ErrnoError(52);
                }
                var link = current.node_ops.readlink(current);
                if (!PATH.isAbs(link)) {
                  link = PATH.dirname(current_path) + "/" + link;
                }
                path = link + "/" + parts.slice(i + 1).join("/");
                continue linkloop;
              }
            }
            return { path: current_path, node: current };
          }
          throw new FS.ErrnoError(32);
        }, getPath(node) {
          var path;
          while (true) {
            if (FS.isRoot(node)) {
              var mount = node.mount.mountpoint;
              if (!path) return mount;
              return mount[mount.length - 1] !== "/" ? `${mount}/${path}` : mount + path;
            }
            path = path ? `${node.name}/${path}` : node.name;
            node = node.parent;
          }
        }, hashName(parentid, name) {
          var hash = 0;
          for (var i = 0; i < name.length; i++) {
            hash = (hash << 5) - hash + name.charCodeAt(i) | 0;
          }
          return (parentid + hash >>> 0) % FS.nameTable.length;
        }, hashAddNode(node) {
          var hash = FS.hashName(node.parent.id, node.name);
          node.name_next = FS.nameTable[hash];
          FS.nameTable[hash] = node;
        }, hashRemoveNode(node) {
          var hash = FS.hashName(node.parent.id, node.name);
          if (FS.nameTable[hash] === node) {
            FS.nameTable[hash] = node.name_next;
          } else {
            var current = FS.nameTable[hash];
            while (current) {
              if (current.name_next === node) {
                current.name_next = node.name_next;
                break;
              }
              current = current.name_next;
            }
          }
        }, lookupNode(parent, name) {
          var errCode = FS.mayLookup(parent);
          if (errCode) {
            throw new FS.ErrnoError(errCode);
          }
          var hash = FS.hashName(parent.id, name);
          for (var node = FS.nameTable[hash]; node; node = node.name_next) {
            var nodeName = node.name;
            if (node.parent.id === parent.id && nodeName === name) {
              return node;
            }
          }
          return FS.lookup(parent, name);
        }, createNode(parent, name, mode, rdev) {
          var node = new FS.FSNode(parent, name, mode, rdev);
          FS.hashAddNode(node);
          return node;
        }, destroyNode(node) {
          FS.hashRemoveNode(node);
        }, isRoot(node) {
          return node === node.parent;
        }, isMountpoint(node) {
          return !!node.mounted;
        }, isFile(mode) {
          return (mode & 61440) === 32768;
        }, isDir(mode) {
          return (mode & 61440) === 16384;
        }, isLink(mode) {
          return (mode & 61440) === 40960;
        }, isChrdev(mode) {
          return (mode & 61440) === 8192;
        }, isBlkdev(mode) {
          return (mode & 61440) === 24576;
        }, isFIFO(mode) {
          return (mode & 61440) === 4096;
        }, isSocket(mode) {
          return (mode & 49152) === 49152;
        }, flagsToPermissionString(flag) {
          var perms = ["r", "w", "rw"][flag & 3];
          if (flag & 512) {
            perms += "w";
          }
          return perms;
        }, nodePermissions(node, perms) {
          if (FS.ignorePermissions) {
            return 0;
          }
          if (perms.includes("r") && !(node.mode & 292)) {
            return 2;
          }
          if (perms.includes("w") && !(node.mode & 146)) {
            return 2;
          }
          if (perms.includes("x") && !(node.mode & 73)) {
            return 2;
          }
          return 0;
        }, mayLookup(dir) {
          if (!FS.isDir(dir.mode)) return 54;
          var errCode = FS.nodePermissions(dir, "x");
          if (errCode) return errCode;
          if (!dir.node_ops.lookup) return 2;
          return 0;
        }, mayCreate(dir, name) {
          if (!FS.isDir(dir.mode)) {
            return 54;
          }
          try {
            var node = FS.lookupNode(dir, name);
            return 20;
          } catch (e) {
          }
          return FS.nodePermissions(dir, "wx");
        }, mayDelete(dir, name, isdir) {
          var node;
          try {
            node = FS.lookupNode(dir, name);
          } catch (e) {
            return e.errno;
          }
          var errCode = FS.nodePermissions(dir, "wx");
          if (errCode) {
            return errCode;
          }
          if (isdir) {
            if (!FS.isDir(node.mode)) {
              return 54;
            }
            if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
              return 10;
            }
          } else if (FS.isDir(node.mode)) {
            return 31;
          }
          return 0;
        }, mayOpen(node, flags) {
          if (!node) {
            return 44;
          }
          if (FS.isLink(node.mode)) {
            return 32;
          }
          var mode = FS.flagsToPermissionString(flags);
          if (FS.isDir(node.mode)) {
            if (mode !== "r" || flags & (512 | 64)) {
              return 31;
            }
          }
          return FS.nodePermissions(node, mode);
        }, checkOpExists(op, err2) {
          if (!op) {
            throw new FS.ErrnoError(err2);
          }
          return op;
        }, MAX_OPEN_FDS: 4096, nextfd() {
          for (var fd = 0; fd <= FS.MAX_OPEN_FDS; fd++) {
            if (!FS.streams[fd]) {
              return fd;
            }
          }
          throw new FS.ErrnoError(33);
        }, getStreamChecked(fd) {
          var stream = FS.getStream(fd);
          if (!stream) {
            throw new FS.ErrnoError(8);
          }
          return stream;
        }, getStream: (fd) => FS.streams[fd], createStream(stream, fd = -1) {
          stream = Object.assign(new FS.FSStream(), stream);
          if (fd == -1) {
            fd = FS.nextfd();
          }
          stream.fd = fd;
          FS.streams[fd] = stream;
          return stream;
        }, closeStream(fd) {
          FS.streams[fd] = null;
        }, dupStream(origStream, fd = -1) {
          var stream = FS.createStream(origStream, fd);
          stream.stream_ops?.dup?.(stream);
          return stream;
        }, doSetAttr(stream, node, attr) {
          var setattr = stream?.stream_ops.setattr;
          var arg = setattr ? stream : node;
          setattr ??= node.node_ops.setattr;
          FS.checkOpExists(setattr, 63);
          try {
            setattr(arg, attr);
          } catch (e) {
            if (e instanceof RangeError) {
              throw new FS.ErrnoError(22);
            }
            throw e;
          }
        }, chrdev_stream_ops: { open(stream) {
          var device = FS.getDevice(stream.node.rdev);
          stream.stream_ops = device.stream_ops;
          stream.stream_ops.open?.(stream);
        }, llseek() {
          throw new FS.ErrnoError(70);
        } }, major: (dev) => dev >> 8, minor: (dev) => dev & 255, makedev: (ma, mi) => ma << 8 | mi, registerDevice(dev, ops) {
          FS.devices[dev] = { stream_ops: ops };
        }, getDevice: (dev) => FS.devices[dev], getMounts(mount) {
          var mounts = [];
          var check = [mount];
          while (check.length) {
            var m = check.pop();
            mounts.push(m);
            check.push(...m.mounts);
          }
          return mounts;
        }, syncfs(populate, callback) {
          if (typeof populate == "function") {
            callback = populate;
            populate = false;
          }
          FS.syncFSRequests++;
          if (FS.syncFSRequests > 1) {
            err(`warning: ${FS.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`);
          }
          var mounts = FS.getMounts(FS.root.mount);
          var completed = 0;
          function doCallback(errCode) {
            FS.syncFSRequests--;
            return callback(errCode);
          }
          function done(errCode) {
            if (errCode) {
              if (!done.errored) {
                done.errored = true;
                return doCallback(errCode);
              }
              return;
            }
            if (++completed >= mounts.length) {
              doCallback(null);
            }
          }
          for (var mount of mounts) {
            if (mount.type.syncfs) {
              mount.type.syncfs(mount, populate, done);
            } else {
              done(null);
            }
          }
        }, mount(type, opts, mountpoint) {
          var root = mountpoint === "/";
          var pseudo = !mountpoint;
          var node;
          if (root && FS.root) {
            throw new FS.ErrnoError(10);
          } else if (!root && !pseudo) {
            var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
            mountpoint = lookup.path;
            node = lookup.node;
            if (FS.isMountpoint(node)) {
              throw new FS.ErrnoError(10);
            }
            if (!FS.isDir(node.mode)) {
              throw new FS.ErrnoError(54);
            }
          }
          var mount = { type, opts, mountpoint, mounts: [] };
          var mountRoot = type.mount(mount);
          mountRoot.mount = mount;
          mount.root = mountRoot;
          if (root) {
            FS.root = mountRoot;
          } else if (node) {
            node.mounted = mount;
            if (node.mount) {
              node.mount.mounts.push(mount);
            }
          }
          return mountRoot;
        }, unmount(mountpoint) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
          if (!FS.isMountpoint(lookup.node)) {
            throw new FS.ErrnoError(28);
          }
          var node = lookup.node;
          var mount = node.mounted;
          var mounts = FS.getMounts(mount);
          for (var [hash, current] of Object.entries(FS.nameTable)) {
            while (current) {
              var next = current.name_next;
              if (mounts.includes(current.mount)) {
                FS.destroyNode(current);
              }
              current = next;
            }
          }
          node.mounted = null;
          var idx = node.mount.mounts.indexOf(mount);
          node.mount.mounts.splice(idx, 1);
        }, lookup(parent, name) {
          return parent.node_ops.lookup(parent, name);
        }, mknod(path, mode, dev) {
          var lookup = FS.lookupPath(path, { parent: true });
          var parent = lookup.node;
          var name = PATH.basename(path);
          if (!name) {
            throw new FS.ErrnoError(28);
          }
          if (name === "." || name === "..") {
            throw new FS.ErrnoError(20);
          }
          var errCode = FS.mayCreate(parent, name);
          if (errCode) {
            throw new FS.ErrnoError(errCode);
          }
          if (!parent.node_ops.mknod) {
            throw new FS.ErrnoError(63);
          }
          return parent.node_ops.mknod(parent, name, mode, dev);
        }, statfs(path) {
          return FS.statfsNode(FS.lookupPath(path, { follow: true }).node);
        }, statfsStream(stream) {
          return FS.statfsNode(stream.node);
        }, statfsNode(node) {
          var rtn = { bsize: 4096, frsize: 4096, blocks: 1e6, bfree: 5e5, bavail: 5e5, files: FS.nextInode, ffree: FS.nextInode - 1, fsid: 42, flags: 2, namelen: 255 };
          if (node.node_ops.statfs) {
            Object.assign(rtn, node.node_ops.statfs(node.mount.opts.root));
          }
          return rtn;
        }, create(path, mode = 438) {
          mode &= 4095;
          mode |= 32768;
          return FS.mknod(path, mode, 0);
        }, mkdir(path, mode = 511) {
          mode &= 511 | 512;
          mode |= 16384;
          return FS.mknod(path, mode, 0);
        }, mkdirTree(path, mode) {
          var dirs = path.split("/");
          var d = "";
          for (var dir of dirs) {
            if (!dir) continue;
            if (d || PATH.isAbs(path)) d += "/";
            d += dir;
            try {
              FS.mkdir(d, mode);
            } catch (e) {
              if (e.errno != 20) throw e;
            }
          }
        }, mkdev(path, mode, dev) {
          if (typeof dev == "undefined") {
            dev = mode;
            mode = 438;
          }
          mode |= 8192;
          return FS.mknod(path, mode, dev);
        }, symlink(oldpath, newpath) {
          if (!PATH_FS.resolve(oldpath)) {
            throw new FS.ErrnoError(44);
          }
          var lookup = FS.lookupPath(newpath, { parent: true });
          var parent = lookup.node;
          if (!parent) {
            throw new FS.ErrnoError(44);
          }
          var newname = PATH.basename(newpath);
          var errCode = FS.mayCreate(parent, newname);
          if (errCode) {
            throw new FS.ErrnoError(errCode);
          }
          if (!parent.node_ops.symlink) {
            throw new FS.ErrnoError(63);
          }
          return parent.node_ops.symlink(parent, newname, oldpath);
        }, link(oldpath, newpath, flags) {
          var lookup = FS.lookupPath(newpath, { parent: true });
          var parent = lookup.node;
          if (!parent) {
            throw new FS.ErrnoError(44);
          }
          var newname = PATH.basename(newpath);
          var errCode = FS.mayCreate(parent, newname);
          if (errCode) {
            throw new FS.ErrnoError(errCode);
          }
          if (!parent.node_ops.link) {
            throw new FS.ErrnoError(34);
          }
          return parent.node_ops.link(parent, newname, oldpath, flags);
        }, rename(old_path, new_path) {
          var old_dirname = PATH.dirname(old_path);
          var new_dirname = PATH.dirname(new_path);
          var old_name = PATH.basename(old_path);
          var new_name = PATH.basename(new_path);
          var lookup, old_dir, new_dir;
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
          if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
          if (old_dir.mount !== new_dir.mount) {
            throw new FS.ErrnoError(75);
          }
          var old_node = FS.lookupNode(old_dir, old_name);
          var relative = PATH_FS.relative(old_path, new_dirname);
          if (relative.charAt(0) !== ".") {
            throw new FS.ErrnoError(28);
          }
          relative = PATH_FS.relative(new_path, old_dirname);
          if (relative.charAt(0) !== ".") {
            throw new FS.ErrnoError(55);
          }
          var new_node;
          try {
            new_node = FS.lookupNode(new_dir, new_name);
          } catch (e) {
          }
          if (old_node === new_node) {
            return;
          }
          var isdir = FS.isDir(old_node.mode);
          var errCode = FS.mayDelete(old_dir, old_name, isdir);
          if (errCode) {
            throw new FS.ErrnoError(errCode);
          }
          errCode = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
          if (errCode) {
            throw new FS.ErrnoError(errCode);
          }
          if (!old_dir.node_ops.rename) {
            throw new FS.ErrnoError(63);
          }
          if (FS.isMountpoint(old_node) || new_node && FS.isMountpoint(new_node)) {
            throw new FS.ErrnoError(10);
          }
          if (new_dir !== old_dir) {
            errCode = FS.nodePermissions(old_dir, "w");
            if (errCode) {
              throw new FS.ErrnoError(errCode);
            }
          }
          FS.hashRemoveNode(old_node);
          try {
            old_dir.node_ops.rename(old_node, new_dir, new_name);
            old_node.parent = new_dir;
          } catch (e) {
            throw e;
          } finally {
            FS.hashAddNode(old_node);
          }
        }, rmdir(path) {
          var lookup = FS.lookupPath(path, { parent: true });
          var parent = lookup.node;
          var name = PATH.basename(path);
          var node = FS.lookupNode(parent, name);
          var errCode = FS.mayDelete(parent, name, true);
          if (errCode) {
            throw new FS.ErrnoError(errCode);
          }
          if (!parent.node_ops.rmdir) {
            throw new FS.ErrnoError(63);
          }
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10);
          }
          parent.node_ops.rmdir(parent, name);
          FS.destroyNode(node);
        }, readdir(path) {
          var lookup = FS.lookupPath(path, { follow: true });
          var node = lookup.node;
          var readdir = FS.checkOpExists(node.node_ops.readdir, 54);
          return readdir(node);
        }, unlink(path) {
          var lookup = FS.lookupPath(path, { parent: true });
          var parent = lookup.node;
          if (!parent) {
            throw new FS.ErrnoError(44);
          }
          var name = PATH.basename(path);
          var node = FS.lookupNode(parent, name);
          var errCode = FS.mayDelete(parent, name, false);
          if (errCode) {
            throw new FS.ErrnoError(errCode);
          }
          if (!parent.node_ops.unlink) {
            throw new FS.ErrnoError(63);
          }
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10);
          }
          parent.node_ops.unlink(parent, name);
          FS.destroyNode(node);
        }, readlink(path) {
          var lookup = FS.lookupPath(path);
          var link = lookup.node;
          if (!link) {
            throw new FS.ErrnoError(44);
          }
          if (!link.node_ops.readlink) {
            throw new FS.ErrnoError(28);
          }
          return link.node_ops.readlink(link);
        }, stat(path, dontFollow) {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          var node = lookup.node;
          var getattr = FS.checkOpExists(node.node_ops.getattr, 63);
          return getattr(node);
        }, fstat(fd) {
          var stream = FS.getStreamChecked(fd);
          var node = stream.node;
          var getattr = stream.stream_ops.getattr;
          var arg = getattr ? stream : node;
          getattr ??= node.node_ops.getattr;
          FS.checkOpExists(getattr, 63);
          return getattr(arg);
        }, lstat(path) {
          return FS.stat(path, true);
        }, doChmod(stream, node, mode, dontFollow) {
          FS.doSetAttr(stream, node, { mode: mode & 4095 | node.mode & ~4095, ctime: Date.now(), dontFollow });
        }, chmod(path, mode, dontFollow) {
          var node;
          if (typeof path == "string") {
            var lookup = FS.lookupPath(path, { follow: !dontFollow });
            node = lookup.node;
          } else {
            node = path;
          }
          FS.doChmod(null, node, mode, dontFollow);
        }, lchmod(path, mode) {
          FS.chmod(path, mode, true);
        }, fchmod(fd, mode) {
          var stream = FS.getStreamChecked(fd);
          FS.doChmod(stream, stream.node, mode, false);
        }, doChown(stream, node, dontFollow) {
          FS.doSetAttr(stream, node, { timestamp: Date.now(), dontFollow });
        }, chown(path, uid, gid, dontFollow) {
          var node;
          if (typeof path == "string") {
            var lookup = FS.lookupPath(path, { follow: !dontFollow });
            node = lookup.node;
          } else {
            node = path;
          }
          FS.doChown(null, node, dontFollow);
        }, lchown(path, uid, gid) {
          FS.chown(path, uid, gid, true);
        }, fchown(fd, uid, gid) {
          var stream = FS.getStreamChecked(fd);
          FS.doChown(stream, stream.node, false);
        }, doTruncate(stream, node, len) {
          if (FS.isDir(node.mode)) {
            throw new FS.ErrnoError(31);
          }
          if (!FS.isFile(node.mode)) {
            throw new FS.ErrnoError(28);
          }
          var errCode = FS.nodePermissions(node, "w");
          if (errCode) {
            throw new FS.ErrnoError(errCode);
          }
          FS.doSetAttr(stream, node, { size: len, timestamp: Date.now() });
        }, truncate(path, len) {
          if (len < 0) {
            throw new FS.ErrnoError(28);
          }
          var node;
          if (typeof path == "string") {
            var lookup = FS.lookupPath(path, { follow: true });
            node = lookup.node;
          } else {
            node = path;
          }
          FS.doTruncate(null, node, len);
        }, ftruncate(fd, len) {
          var stream = FS.getStreamChecked(fd);
          if (len < 0 || (stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(28);
          }
          FS.doTruncate(stream, stream.node, len);
        }, utime(path, atime, mtime, dontFollow) {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          FS.doSetAttr(null, lookup.node, { atime, mtime, dontFollow });
        }, open(path, flags, mode = 438) {
          if (path === "") {
            throw new FS.ErrnoError(44);
          }
          flags = FS_modeStringToFlags(flags);
          if (flags & 64) {
            mode = mode & 4095 | 32768;
          } else {
            mode = 0;
          }
          var node;
          var isDirPath;
          if (typeof path == "object") {
            node = path;
          } else {
            isDirPath = path.endsWith("/");
            var lookup = FS.lookupPath(path, { follow: !(flags & 131072), noent_okay: true });
            node = lookup.node;
            path = lookup.path;
          }
          var created = false;
          if (flags & 64) {
            if (node) {
              if (flags & 128) {
                throw new FS.ErrnoError(20);
              }
            } else if (isDirPath) {
              throw new FS.ErrnoError(31);
            } else {
              node = FS.mknod(path, mode | 511, 0);
              created = true;
            }
          }
          if (!node) {
            throw new FS.ErrnoError(44);
          }
          if (FS.isChrdev(node.mode)) {
            flags &= ~512;
          }
          if (flags & 65536 && !FS.isDir(node.mode)) {
            throw new FS.ErrnoError(54);
          }
          if (!created) {
            var errCode = FS.mayOpen(node, flags);
            if (errCode) {
              throw new FS.ErrnoError(errCode);
            }
          }
          if (flags & 512 && !created) {
            FS.truncate(node, 0);
          }
          flags &= ~(128 | 512 | 131072);
          var stream = FS.createStream({ node, path: FS.getPath(node), flags, seekable: true, position: 0, stream_ops: node.stream_ops, ungotten: [], error: false });
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
          if (created) {
            FS.chmod(node, mode & 511);
          }
          return stream;
        }, close(stream) {
          if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8);
          }
          if (stream.getdents) stream.getdents = null;
          stream.node?.notifyListeners(32);
          try {
            if (stream.stream_ops.close) {
              stream.stream_ops.close(stream);
            }
          } catch (e) {
            throw e;
          } finally {
            FS.closeStream(stream.fd);
          }
          stream.fd = null;
        }, isClosed(stream) {
          return stream.fd === null;
        }, llseek(stream, offset, whence) {
          if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8);
          }
          if (!stream.seekable || !stream.stream_ops.llseek) {
            throw new FS.ErrnoError(70);
          }
          if (whence != 0 && whence != 1 && whence != 2) {
            throw new FS.ErrnoError(28);
          }
          stream.position = stream.stream_ops.llseek(stream, offset, whence);
          stream.ungotten = [];
          return stream.position;
        }, read(stream, buffer, offset, length, position) {
          if (length < 0 || position < 0) {
            throw new FS.ErrnoError(28);
          }
          if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8);
          }
          if ((stream.flags & 2097155) === 1) {
            throw new FS.ErrnoError(8);
          }
          if (FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(31);
          }
          if (!stream.stream_ops.read) {
            throw new FS.ErrnoError(28);
          }
          var seeking = typeof position != "undefined";
          if (!seeking) {
            position = stream.position;
          } else if (!stream.seekable) {
            throw new FS.ErrnoError(70);
          }
          var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
          if (!seeking) stream.position += bytesRead;
          return bytesRead;
        }, write(stream, buffer, offset, length, position, canOwn) {
          if (length < 0 || position < 0) {
            throw new FS.ErrnoError(28);
          }
          if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8);
          }
          if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(8);
          }
          if (FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(31);
          }
          if (!stream.stream_ops.write) {
            throw new FS.ErrnoError(28);
          }
          if (stream.seekable && stream.flags & 1024) {
            FS.llseek(stream, 0, 2);
          }
          var seeking = typeof position != "undefined";
          if (!seeking) {
            position = stream.position;
          } else if (!stream.seekable) {
            throw new FS.ErrnoError(70);
          }
          var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
          if (!seeking) stream.position += bytesWritten;
          return bytesWritten;
        }, mmap(stream, length, position, prot, flags) {
          if ((prot & 2) !== 0 && (flags & 2) === 0 && (stream.flags & 2097155) !== 2) {
            throw new FS.ErrnoError(2);
          }
          if ((stream.flags & 2097155) === 1) {
            throw new FS.ErrnoError(2);
          }
          if (!stream.stream_ops.mmap) {
            throw new FS.ErrnoError(43);
          }
          if (!length) {
            throw new FS.ErrnoError(28);
          }
          return stream.stream_ops.mmap(stream, length, position, prot, flags);
        }, msync(stream, buffer, offset, length, mmapFlags) {
          if (!stream.stream_ops.msync) {
            return 0;
          }
          return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
        }, ioctl(stream, cmd, arg) {
          if (!stream.stream_ops.ioctl) {
            throw new FS.ErrnoError(59);
          }
          return stream.stream_ops.ioctl(stream, cmd, arg);
        }, readFile(path, opts = {}) {
          opts.flags = opts.flags ?? 0;
          opts.encoding = opts.encoding ?? "binary";
          if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
            abort(`Invalid encoding type "${opts.encoding}"`);
          }
          var stream = FS.open(path, opts.flags);
          var stat = FS.stat(path);
          var length = stat.size;
          var buf = new Uint8Array(length);
          FS.read(stream, buf, 0, length, 0);
          if (opts.encoding === "utf8") {
            buf = UTF8ArrayToString(buf);
          }
          FS.close(stream);
          return buf;
        }, writeFile(path, data, opts = {}) {
          opts.flags = opts.flags ?? 577;
          var stream = FS.open(path, opts.flags, opts.mode);
          data = FS_fileDataToTypedArray(data);
          FS.write(stream, data, 0, data.byteLength, void 0, opts.canOwn);
          FS.close(stream);
        }, cwd: () => FS.currentPath, chdir(path) {
          var lookup = FS.lookupPath(path, { follow: true });
          if (lookup.node === null) {
            throw new FS.ErrnoError(44);
          }
          if (!FS.isDir(lookup.node.mode)) {
            throw new FS.ErrnoError(54);
          }
          var errCode = FS.nodePermissions(lookup.node, "x");
          if (errCode) {
            throw new FS.ErrnoError(errCode);
          }
          FS.currentPath = lookup.path;
        }, createDefaultDirectories() {
          FS.mkdir("/tmp");
          FS.mkdir("/home");
          FS.mkdir("/home/web_user");
        }, createDefaultDevices() {
          FS.mkdir("/dev");
          FS.registerDevice(FS.makedev(1, 3), { read: () => 0, write: (stream, buffer, offset, length, pos) => length, llseek: () => 0 });
          FS.mkdev("/dev/null", FS.makedev(1, 3));
          TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
          TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
          FS.mkdev("/dev/tty", FS.makedev(5, 0));
          FS.mkdev("/dev/tty1", FS.makedev(6, 0));
          var randomBuffer = new Uint8Array(1024), randomLeft = 0;
          var randomByte = () => {
            if (randomLeft === 0) {
              randomFill(randomBuffer);
              randomLeft = randomBuffer.byteLength;
            }
            return randomBuffer[--randomLeft];
          };
          FS.createDevice("/dev", "random", randomByte);
          FS.createDevice("/dev", "urandom", randomByte);
          FS.mkdir("/dev/shm");
          FS.mkdir("/dev/shm/tmp");
        }, createSpecialDirectories() {
          FS.mkdir("/proc");
          var proc_self = FS.mkdir("/proc/self");
          FS.mkdir("/proc/self/fd");
          FS.mount({ mount() {
            var node = FS.createNode(proc_self, "fd", 16895, 73);
            node.stream_ops = { llseek: MEMFS.stream_ops.llseek };
            node.node_ops = { lookup(parent, name) {
              var fd = +name;
              var stream = FS.getStreamChecked(fd);
              var ret = { parent: null, mount: { mountpoint: "fake" }, node_ops: { readlink: () => stream.path }, id: fd + 1 };
              ret.parent = ret;
              return ret;
            }, readdir() {
              return Array.from(FS.streams.entries()).filter(([k, v]) => v).map(([k, v]) => k.toString());
            } };
            return node;
          } }, {}, "/proc/self/fd");
        }, createStandardStreams(input, output, error) {
          if (input) {
            FS.createDevice("/dev", "stdin", input);
          } else {
            FS.symlink("/dev/tty", "/dev/stdin");
          }
          if (output) {
            FS.createDevice("/dev", "stdout", null, output);
          } else {
            FS.symlink("/dev/tty", "/dev/stdout");
          }
          if (error) {
            FS.createDevice("/dev", "stderr", null, error);
          } else {
            FS.symlink("/dev/tty1", "/dev/stderr");
          }
          var stdin = FS.open("/dev/stdin", 0);
          var stdout = FS.open("/dev/stdout", 1);
          var stderr = FS.open("/dev/stderr", 1);
        }, staticInit() {
          FS.nameTable = new Array(4096);
          FS.mount(MEMFS, {}, "/");
          FS.createDefaultDirectories();
          FS.createDefaultDevices();
          FS.createSpecialDirectories();
          FS.filesystems = { MEMFS };
        }, init(input, output, error) {
          FS.initialized = true;
          input ??= Module["stdin"];
          output ??= Module["stdout"];
          error ??= Module["stderr"];
          FS.createStandardStreams(input, output, error);
        }, quit() {
          FS.initialized = false;
          for (var stream of FS.streams) {
            if (stream) {
              FS.close(stream);
            }
          }
        }, findObject(path, dontResolveLastLink) {
          var ret = FS.analyzePath(path, dontResolveLastLink);
          if (!ret.exists) {
            return null;
          }
          return ret.object;
        }, analyzePath(path, dontResolveLastLink) {
          try {
            var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
            path = lookup.path;
          } catch (e) {
          }
          var ret = { isRoot: false, exists: false, error: 0, name: null, path: null, object: null, parentExists: false, parentPath: null, parentObject: null };
          try {
            var lookup = FS.lookupPath(path, { parent: true });
            ret.parentExists = true;
            ret.parentPath = lookup.path;
            ret.parentObject = lookup.node;
            ret.name = PATH.basename(path);
            lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
            ret.exists = true;
            ret.path = lookup.path;
            ret.object = lookup.node;
            ret.name = lookup.node.name;
            ret.isRoot = lookup.path === "/";
          } catch (e) {
            ret.error = e.errno;
          }
          return ret;
        }, createPath(parent, path, canRead, canWrite) {
          parent = typeof parent == "string" ? parent : FS.getPath(parent);
          var parts = path.split("/").reverse();
          while (parts.length) {
            var part = parts.pop();
            if (!part) continue;
            var current = PATH.join2(parent, part);
            try {
              FS.mkdir(current);
            } catch (e) {
              if (e.errno != 20) throw e;
            }
            parent = current;
          }
          return current;
        }, createFile(parent, name, properties, canRead, canWrite) {
          var path = PATH.join2(typeof parent == "string" ? parent : FS.getPath(parent), name);
          var mode = FS_getMode(canRead, canWrite);
          return FS.create(path, mode);
        }, createDataFile(parent, name, data, canRead, canWrite, canOwn) {
          var path = name;
          if (parent) {
            parent = typeof parent == "string" ? parent : FS.getPath(parent);
            path = name ? PATH.join2(parent, name) : parent;
          }
          var mode = FS_getMode(canRead, canWrite);
          var node = FS.create(path, mode);
          if (data) {
            data = FS_fileDataToTypedArray(data);
            FS.chmod(node, mode | 146);
            var stream = FS.open(node, 577);
            FS.write(stream, data, 0, data.length, 0, canOwn);
            FS.close(stream);
            FS.chmod(node, mode);
          }
        }, createDevice(parent, name, input, output) {
          var path = PATH.join2(typeof parent == "string" ? parent : FS.getPath(parent), name);
          var mode = FS_getMode(!!input, !!output);
          FS.createDevice.major ??= 64;
          var dev = FS.makedev(FS.createDevice.major++, 0);
          FS.registerDevice(dev, { open(stream) {
            stream.seekable = false;
          }, close(stream) {
            if (output?.buffer?.length) {
              output(10);
            }
          }, read(stream, buffer, offset, length, pos) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(29);
              }
              if (result === void 0 && bytesRead === 0) {
                throw new FS.ErrnoError(6);
              }
              if (result === null || result === void 0) break;
              bytesRead++;
              buffer[offset + i] = result;
            }
            if (bytesRead) {
              stream.node.atime = Date.now();
            }
            return bytesRead;
          }, write(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset + i]);
              } catch (e) {
                throw new FS.ErrnoError(29);
              }
            }
            if (length) {
              stream.node.mtime = stream.node.ctime = Date.now();
            }
            return i;
          } });
          return FS.mkdev(path, mode, dev);
        }, forceLoadFile(obj) {
          if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
          if (globalThis.XMLHttpRequest) {
            abort("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
          } else {
            try {
              obj.contents = readBinary(obj.url);
            } catch (e) {
              throw new FS.ErrnoError(29);
            }
          }
        }, createLazyFile(parent, name, url, canRead, canWrite) {
          class LazyUint8Array {
            lengthKnown = false;
            chunks = [];
            get(idx) {
              if (idx > this.length - 1 || idx < 0) {
                return void 0;
              }
              var chunkOffset = idx % this.chunkSize;
              var chunkNum = idx / this.chunkSize | 0;
              return this.getter(chunkNum)[chunkOffset];
            }
            setDataGetter(getter) {
              this.getter = getter;
            }
            cacheLength() {
              var xhr = new XMLHttpRequest();
              xhr.open("HEAD", url, false);
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) abort("Couldn't load " + url + ". Status: " + xhr.status);
              var datalength = Number(xhr.getResponseHeader("Content-length"));
              var header;
              var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
              var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
              var chunkSize = 1024 * 1024;
              if (!hasByteServing) chunkSize = datalength;
              var doXHR = (from, to) => {
                if (from > to) abort(`invalid range (${from}, ${to}) or no bytes requested!`);
                if (to > datalength - 1) abort(`only ${datalength} bytes available! programmer error!`);
                var xhr2 = new XMLHttpRequest();
                xhr2.open("GET", url, false);
                if (datalength !== chunkSize) xhr2.setRequestHeader("Range", "bytes=" + from + "-" + to);
                xhr2.responseType = "arraybuffer";
                if (xhr2.overrideMimeType) {
                  xhr2.overrideMimeType("text/plain; charset=x-user-defined");
                }
                xhr2.send(null);
                if (!(xhr2.status >= 200 && xhr2.status < 300 || xhr2.status === 304)) abort("Couldn't load " + url + ". Status: " + xhr2.status);
                if (xhr2.response !== void 0) {
                  return new Uint8Array(xhr2.response || []);
                }
                return intArrayFromString(xhr2.responseText ?? "", true);
              };
              var lazyArray2 = this;
              lazyArray2.setDataGetter((chunkNum) => {
                var start = chunkNum * chunkSize;
                var end = (chunkNum + 1) * chunkSize - 1;
                end = Math.min(end, datalength - 1);
                if (typeof lazyArray2.chunks[chunkNum] == "undefined") {
                  lazyArray2.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof lazyArray2.chunks[chunkNum] == "undefined") abort("doXHR failed!");
                return lazyArray2.chunks[chunkNum];
              });
              if (usesGzip || !datalength) {
                chunkSize = datalength = 1;
                datalength = this.getter(0).length;
                chunkSize = datalength;
                out("LazyFiles on gzip forces download of the whole file when length is accessed");
              }
              this._length = datalength;
              this._chunkSize = chunkSize;
              this.lengthKnown = true;
            }
            get length() {
              if (!this.lengthKnown) {
                this.cacheLength();
              }
              return this._length;
            }
            get chunkSize() {
              if (!this.lengthKnown) {
                this.cacheLength();
              }
              return this._chunkSize;
            }
          }
          if (globalThis.XMLHttpRequest) {
            if (!ENVIRONMENT_IS_WORKER) abort("Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc");
            var lazyArray = new LazyUint8Array();
            var properties = { isDevice: false, contents: lazyArray };
          } else {
            var properties = { isDevice: false, url };
          }
          var node = FS.createFile(parent, name, properties, canRead, canWrite);
          if (properties.contents) {
            node.contents = properties.contents;
          } else if (properties.url) {
            node.contents = null;
            node.url = properties.url;
          }
          Object.defineProperties(node, { usedBytes: { get: function() {
            return this.contents.length;
          } } });
          var stream_ops = {};
          for (const [key, fn] of Object.entries(node.stream_ops)) {
            stream_ops[key] = (...args) => {
              FS.forceLoadFile(node);
              return fn(...args);
            };
          }
          function writeChunks(stream, buffer, offset, length, position) {
            var contents = stream.node.contents;
            if (position >= contents.length) return 0;
            var size = Math.min(contents.length - position, length);
            if (contents.slice) {
              for (var i = 0; i < size; i++) {
                buffer[offset + i] = contents[position + i];
              }
            } else {
              for (var i = 0; i < size; i++) {
                buffer[offset + i] = contents.get(position + i);
              }
            }
            return size;
          }
          stream_ops.read = (stream, buffer, offset, length, position) => {
            FS.forceLoadFile(node);
            return writeChunks(stream, buffer, offset, length, position);
          };
          stream_ops.mmap = (stream, length, position, prot, flags) => {
            FS.forceLoadFile(node);
            var ptr = mmapAlloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(48);
            }
            writeChunks(stream, HEAP8, ptr, length, position);
            return { ptr, allocated: true };
          };
          node.stream_ops = stream_ops;
          return node;
        } };
        var UTF8ToString = (ptr, maxBytesToRead, ignoreNul) => ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead, ignoreNul) : "";
        var SYSCALLS = { currentUmask: 18, calculateAt(dirfd, path, allowEmpty) {
          if (PATH.isAbs(path)) {
            return path;
          }
          var dir;
          if (dirfd === -100) {
            dir = FS.cwd();
          } else {
            var dirstream = SYSCALLS.getStreamFromFD(dirfd);
            dir = dirstream.path;
          }
          if (path.length == 0) {
            if (!allowEmpty) {
              throw new FS.ErrnoError(44);
            }
            return dir;
          }
          return dir + "/" + path;
        }, writeStat(buf, stat) {
          HEAPU32[buf >> 2] = stat.dev;
          HEAPU32[buf + 4 >> 2] = stat.mode;
          HEAPU32[buf + 8 >> 2] = stat.nlink;
          HEAPU32[buf + 12 >> 2] = stat.uid;
          HEAPU32[buf + 16 >> 2] = stat.gid;
          HEAPU32[buf + 20 >> 2] = stat.rdev;
          HEAP64[buf + 24 >> 3] = BigInt(stat.size);
          HEAP32[buf + 32 >> 2] = 4096;
          HEAP32[buf + 36 >> 2] = stat.blocks;
          var atime = stat.atime.getTime();
          var mtime = stat.mtime.getTime();
          var ctime = stat.ctime.getTime();
          HEAP64[buf + 40 >> 3] = BigInt(Math.floor(atime / 1e3));
          HEAPU32[buf + 48 >> 2] = atime % 1e3 * 1e3 * 1e3;
          HEAP64[buf + 56 >> 3] = BigInt(Math.floor(mtime / 1e3));
          HEAPU32[buf + 64 >> 2] = mtime % 1e3 * 1e3 * 1e3;
          HEAP64[buf + 72 >> 3] = BigInt(Math.floor(ctime / 1e3));
          HEAPU32[buf + 80 >> 2] = ctime % 1e3 * 1e3 * 1e3;
          HEAP64[buf + 88 >> 3] = BigInt(stat.ino);
          return 0;
        }, writeStatFs(buf, stats) {
          HEAPU32[buf + 4 >> 2] = stats.bsize;
          HEAPU32[buf + 60 >> 2] = stats.bsize;
          HEAP64[buf + 8 >> 3] = BigInt(stats.blocks);
          HEAP64[buf + 16 >> 3] = BigInt(stats.bfree);
          HEAP64[buf + 24 >> 3] = BigInt(stats.bavail);
          HEAP64[buf + 32 >> 3] = BigInt(stats.files);
          HEAP64[buf + 40 >> 3] = BigInt(stats.ffree);
          HEAPU32[buf + 48 >> 2] = stats.fsid;
          HEAPU32[buf + 64 >> 2] = stats.flags;
          HEAPU32[buf + 56 >> 2] = stats.namelen;
        }, doMsync(addr, stream, len, flags, offset) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(43);
          }
          if (flags & 2) {
            return 0;
          }
          var buffer = HEAPU8.subarray(addr, addr + len);
          FS.msync(stream, buffer, offset, len, flags);
        }, getStreamFromFD(fd) {
          var stream = FS.getStreamChecked(fd);
          return stream;
        }, varargs: void 0, getStr(ptr) {
          var ret = UTF8ToString(ptr);
          return ret;
        } };
        function ___syscall_fcntl64(fd, cmd, varargs) {
          SYSCALLS.varargs = varargs;
          try {
            var stream = SYSCALLS.getStreamFromFD(fd);
            switch (cmd) {
              case 0: {
                var arg = syscallGetVarargI();
                if (arg < 0) {
                  return -28;
                }
                while (FS.streams[arg]) {
                  arg++;
                }
                var newStream;
                newStream = FS.dupStream(stream, arg);
                return newStream.fd;
              }
              case 1:
              case 2:
                return 0;
              case 3:
                return stream.flags;
              case 4: {
                var arg = syscallGetVarargI();
                var mask = 289792;
                stream.flags = stream.flags & ~mask | arg & mask;
                return 0;
              }
              case 12: {
                var arg = syscallGetVarargP();
                var offset = 0;
                HEAP16[arg + offset >> 1] = 2;
                return 0;
              }
              case 13:
              case 14:
                return 0;
            }
            return -28;
          } catch (e) {
            if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
            return -e.errno;
          }
        }
        function ___syscall_ioctl(fd, op, varargs) {
          SYSCALLS.varargs = varargs;
          try {
            var stream = SYSCALLS.getStreamFromFD(fd);
            switch (op) {
              case 21509: {
                if (!stream.tty) return -59;
                return 0;
              }
              case 21505: {
                if (!stream.tty) return -59;
                if (stream.tty.ops.ioctl_tcgets) {
                  var termios = stream.tty.ops.ioctl_tcgets(stream);
                  var argp = syscallGetVarargP();
                  HEAP32[argp >> 2] = termios.c_iflag || 0;
                  HEAP32[argp + 4 >> 2] = termios.c_oflag || 0;
                  HEAP32[argp + 8 >> 2] = termios.c_cflag || 0;
                  HEAP32[argp + 12 >> 2] = termios.c_lflag || 0;
                  for (var i = 0; i < 32; i++) {
                    HEAP8[argp + i + 17] = termios.c_cc[i] || 0;
                  }
                  return 0;
                }
                return 0;
              }
              case 21510:
              case 21511:
              case 21512: {
                if (!stream.tty) return -59;
                return 0;
              }
              case 21506:
              case 21507:
              case 21508: {
                if (!stream.tty) return -59;
                if (stream.tty.ops.ioctl_tcsets) {
                  var argp = syscallGetVarargP();
                  var c_iflag = HEAP32[argp >> 2];
                  var c_oflag = HEAP32[argp + 4 >> 2];
                  var c_cflag = HEAP32[argp + 8 >> 2];
                  var c_lflag = HEAP32[argp + 12 >> 2];
                  var c_cc = [];
                  for (var i = 0; i < 32; i++) {
                    c_cc.push(HEAP8[argp + i + 17]);
                  }
                  return stream.tty.ops.ioctl_tcsets(stream.tty, op, { c_iflag, c_oflag, c_cflag, c_lflag, c_cc });
                }
                return 0;
              }
              case 21519: {
                if (!stream.tty) return -59;
                var argp = syscallGetVarargP();
                HEAP32[argp >> 2] = 0;
                return 0;
              }
              case 21520: {
                if (!stream.tty) return -59;
                return -28;
              }
              case 21537:
              case 21531: {
                var argp = syscallGetVarargP();
                return FS.ioctl(stream, op, argp);
              }
              case 21523: {
                if (!stream.tty) return -59;
                if (stream.tty.ops.ioctl_tiocgwinsz) {
                  var winsize = stream.tty.ops.ioctl_tiocgwinsz(stream.tty);
                  var argp = syscallGetVarargP();
                  HEAP16[argp >> 1] = winsize[0];
                  HEAP16[argp + 2 >> 1] = winsize[1];
                }
                return 0;
              }
              case 21524: {
                if (!stream.tty) return -59;
                return 0;
              }
              case 21515: {
                if (!stream.tty) return -59;
                return 0;
              }
              default:
                return -28;
            }
          } catch (e) {
            if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
            return -e.errno;
          }
        }
        function ___syscall_openat(dirfd, path, flags, varargs) {
          SYSCALLS.varargs = varargs;
          try {
            path = SYSCALLS.getStr(path);
            path = SYSCALLS.calculateAt(dirfd, path);
            var mode = varargs ? syscallGetVarargI() : 0;
            if (flags & 64) {
              mode &= ~SYSCALLS.currentUmask;
            }
            return FS.open(path, flags, mode).fd;
          } catch (e) {
            if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
            return -e.errno;
          }
        }
        var getHeapMax = () => 2147483648;
        var alignMemory = (size, alignment) => Math.ceil(size / alignment) * alignment;
        var growMemory = (size) => {
          var oldHeapSize = wasmMemory.buffer.byteLength;
          var pages = (size - oldHeapSize + 65535) / 65536 | 0;
          try {
            wasmMemory.grow(pages);
            updateMemoryViews();
            return 1;
          } catch (e) {
          }
        };
        var _emscripten_resize_heap = (requestedSize) => {
          var oldSize = HEAPU8.length;
          requestedSize >>>= 0;
          var maxHeapSize = getHeapMax();
          if (requestedSize > maxHeapSize) {
            return false;
          }
          for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
            var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown);
            overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
            var newSize = Math.min(maxHeapSize, alignMemory(Math.max(requestedSize, overGrownHeapSize), 65536));
            var replacement = growMemory(newSize);
            if (replacement) {
              return true;
            }
          }
          return false;
        };
        var ENV = {};
        var getExecutableName = () => thisProgram;
        var getEnvStrings = () => {
          if (!getEnvStrings.strings) {
            var lang = (globalThis.navigator?.language ?? "C").replace("-", "_") + ".UTF-8";
            var env = { USER: "web_user", LOGNAME: "web_user", PATH: "/", PWD: "/", HOME: "/home/web_user", LANG: lang, _: getExecutableName() };
            for (var x in ENV) {
              if (ENV[x] === void 0) delete env[x];
              else env[x] = ENV[x];
            }
            var strings = [];
            for (var x in env) {
              strings.push(`${x}=${env[x]}`);
            }
            getEnvStrings.strings = strings;
          }
          return getEnvStrings.strings;
        };
        var stringToUTF8 = (str, outPtr, maxBytesToWrite) => stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
        var _environ_get = (__environ, environ_buf) => {
          var bufSize = 0;
          var envp = 0;
          for (var string of getEnvStrings()) {
            var ptr = environ_buf + bufSize;
            HEAPU32[__environ + envp >> 2] = ptr;
            bufSize += stringToUTF8(string, ptr, Infinity) + 1;
            envp += 4;
          }
          return 0;
        };
        var _environ_sizes_get = (penviron_count, penviron_buf_size) => {
          var strings = getEnvStrings();
          HEAPU32[penviron_count >> 2] = strings.length;
          var bufSize = 0;
          for (var string of strings) {
            bufSize += lengthBytesUTF8(string) + 1;
          }
          HEAPU32[penviron_buf_size >> 2] = bufSize;
          return 0;
        };
        function _fd_close(fd) {
          try {
            var stream = SYSCALLS.getStreamFromFD(fd);
            FS.close(stream);
            return 0;
          } catch (e) {
            if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
            return e.errno;
          }
        }
        var doReadv = (stream, iov, iovcnt, offset) => {
          var ret = 0;
          for (var i = 0; i < iovcnt; i++) {
            var ptr = HEAPU32[iov >> 2];
            var len = HEAPU32[iov + 4 >> 2];
            iov += 8;
            try {
              var curr = FS.read(stream, HEAP8, ptr, len, offset);
            } catch (e) {
              if (ret > 0 && e instanceof FS.ErrnoError && (e.errno == 6 || e.errno == 6)) {
                break;
              }
              throw e;
            }
            if (curr < 0) return -1;
            ret += curr;
            if (curr < len) break;
            if (typeof offset != "undefined") {
              offset += curr;
            }
          }
          return ret;
        };
        function _fd_read(fd, iov, iovcnt, pnum) {
          try {
            var stream = SYSCALLS.getStreamFromFD(fd);
            var num = doReadv(stream, iov, iovcnt);
            HEAPU32[pnum >> 2] = num;
            return 0;
          } catch (e) {
            if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
            return e.errno;
          }
        }
        var INT53_MAX = 9007199254740992;
        var INT53_MIN = -9007199254740992;
        var bigintToI53Checked = (num) => num < INT53_MIN || num > INT53_MAX ? NaN : Number(num);
        function _fd_seek(fd, offset, whence, newOffset) {
          offset = bigintToI53Checked(offset);
          try {
            if (isNaN(offset)) return 22;
            var stream = SYSCALLS.getStreamFromFD(fd);
            FS.llseek(stream, offset, whence);
            HEAP64[newOffset >> 3] = BigInt(stream.position);
            if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
            return 0;
          } catch (e) {
            if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
            return e.errno;
          }
        }
        var doWritev = (stream, iov, iovcnt, offset) => {
          if (iovcnt == 1) {
            return FS.write(stream, HEAP8, HEAPU32[iov >> 2], HEAPU32[iov + 4 >> 2], offset);
          }
          var total = 0;
          for (var i = 0, p = iov; i < iovcnt; i++, p += 8) {
            total += HEAPU32[p + 4 >> 2];
          }
          var view = new Uint8Array(total);
          var voff = 0;
          for (var i = 0; i < iovcnt; i++, iov += 8) {
            var ptr = HEAPU32[iov >> 2];
            var len = HEAPU32[iov + 4 >> 2];
            view.set(HEAPU8.subarray(ptr, ptr + len), voff);
            voff += len;
          }
          return FS.write(stream, view, 0, total, offset);
        };
        function _fd_write(fd, iov, iovcnt, pnum) {
          try {
            var stream = SYSCALLS.getStreamFromFD(fd);
            var num = doWritev(stream, iov, iovcnt);
            HEAPU32[pnum >> 2] = num;
            return 0;
          } catch (e) {
            if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
            return e.errno;
          }
        }
        var getCFunc = (ident) => {
          var func = Module["_" + ident];
          return func;
        };
        var writeArrayToMemory = (array, buffer) => {
          HEAP8.set(array, buffer);
        };
        var stackAlloc = (sz) => __emscripten_stack_alloc(sz);
        var stringToUTF8OnStack = (str) => {
          var size = lengthBytesUTF8(str) + 1;
          var ret = stackAlloc(size);
          stringToUTF8(str, ret, size);
          return ret;
        };
        var ccall = (ident, returnType, argTypes, args, opts) => {
          var toC = { string: (str) => {
            var ret2 = 0;
            if (str !== null && str !== void 0 && str !== 0) {
              ret2 = stringToUTF8OnStack(str);
            }
            return ret2;
          }, array: (arr) => {
            var ret2 = stackAlloc(arr.length);
            writeArrayToMemory(arr, ret2);
            return ret2;
          } };
          function convertReturnValue(ret2) {
            if (returnType === "string") {
              return UTF8ToString(ret2);
            }
            if (returnType === "boolean") return Boolean(ret2);
            return ret2;
          }
          var func = getCFunc(ident);
          var cArgs = [];
          var stack = 0;
          if (args) {
            for (var i = 0; i < args.length; i++) {
              var converter = toC[argTypes[i]];
              if (converter) {
                if (stack === 0) stack = stackSave();
                cArgs[i] = converter(args[i]);
              } else {
                cArgs[i] = args[i];
              }
            }
          }
          var ret = func(...cArgs);
          function onDone(ret2) {
            if (stack !== 0) stackRestore(stack);
            return convertReturnValue(ret2);
          }
          ret = onDone(ret);
          return ret;
        };
        var cwrap = (ident, returnType, argTypes, opts) => {
          var numericArgs = !argTypes || argTypes.every((type) => type === "number" || type === "boolean");
          var numericRet = returnType !== "string";
          if (numericRet && numericArgs && !opts) {
            return getCFunc(ident);
          }
          return (...args) => ccall(ident, returnType, argTypes, args, opts);
        };
        var stringToNewUTF8 = (str) => {
          var size = lengthBytesUTF8(str) + 1;
          var ret = _malloc(size);
          if (ret) stringToUTF8(str, ret, size);
          return ret;
        };
        var allocateUTF8 = (...args) => stringToNewUTF8(...args);
        var FS_createPath = (...args) => FS.createPath(...args);
        var FS_unlink = (...args) => FS.unlink(...args);
        var FS_createLazyFile = (...args) => FS.createLazyFile(...args);
        var FS_createDevice = (...args) => FS.createDevice(...args);
        FS.createPreloadedFile = FS_createPreloadedFile;
        FS.preloadFile = FS_preloadFile;
        FS.staticInit();
        {
          if (Module["noExitRuntime"]) noExitRuntime = Module["noExitRuntime"];
          if (Module["print"]) out = Module["print"];
          if (Module["printErr"]) err = Module["printErr"];
          if (Module["arguments"]) programArgs = Module["arguments"];
          if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
          var preInit = Module["preInit"];
          if (preInit) {
            if (typeof preInit == "function") Module["preInit"] = preInit = [preInit];
            while (preInit.length > 0) {
              preInit.shift()();
            }
          }
        }
        Module["addRunDependency"] = addRunDependency;
        Module["removeRunDependency"] = removeRunDependency;
        Module["ccall"] = ccall;
        Module["cwrap"] = cwrap;
        Module["setValue"] = setValue;
        Module["getValue"] = getValue;
        Module["UTF8ToString"] = UTF8ToString;
        Module["stringToUTF8"] = stringToUTF8;
        Module["lengthBytesUTF8"] = lengthBytesUTF8;
        Module["FS_preloadFile"] = FS_preloadFile;
        Module["FS_unlink"] = FS_unlink;
        Module["FS_createPath"] = FS_createPath;
        Module["FS_createDevice"] = FS_createDevice;
        Module["FS"] = FS;
        Module["FS_createDataFile"] = FS_createDataFile;
        Module["FS_createLazyFile"] = FS_createLazyFile;
        Module["allocateUTF8"] = allocateUTF8;
        var _free, _malloc, _swe_set_ephe_path_wrap, _swe_julday_wrap, _swe_revjul_wrap, _swe_calc_ut_wrap, _swe_get_planet_name_wrap, _swe_lun_eclipse_when_wrap, _swe_sol_eclipse_when_glob_wrap, _swe_houses_wrap, _swe_set_sid_mode_wrap, _swe_get_ayanamsa_ut_wrap, _swe_get_ayanamsa_ex_ut_wrap, _swe_close_wrap, _swe_version_wrap, __emscripten_stack_restore, __emscripten_stack_alloc, _emscripten_stack_get_current, memory, __indirect_function_table, wasmMemory;
        function assignWasmExports(wasmExports2) {
          _free = Module["_free"] = wasmExports2["m"];
          _malloc = Module["_malloc"] = wasmExports2["n"];
          _swe_set_ephe_path_wrap = Module["_swe_set_ephe_path_wrap"] = wasmExports2["o"];
          _swe_julday_wrap = Module["_swe_julday_wrap"] = wasmExports2["p"];
          _swe_revjul_wrap = Module["_swe_revjul_wrap"] = wasmExports2["q"];
          _swe_calc_ut_wrap = Module["_swe_calc_ut_wrap"] = wasmExports2["r"];
          _swe_get_planet_name_wrap = Module["_swe_get_planet_name_wrap"] = wasmExports2["s"];
          _swe_lun_eclipse_when_wrap = Module["_swe_lun_eclipse_when_wrap"] = wasmExports2["t"];
          _swe_sol_eclipse_when_glob_wrap = Module["_swe_sol_eclipse_when_glob_wrap"] = wasmExports2["u"];
          _swe_houses_wrap = Module["_swe_houses_wrap"] = wasmExports2["v"];
          _swe_set_sid_mode_wrap = Module["_swe_set_sid_mode_wrap"] = wasmExports2["w"];
          _swe_get_ayanamsa_ut_wrap = Module["_swe_get_ayanamsa_ut_wrap"] = wasmExports2["x"];
          _swe_get_ayanamsa_ex_ut_wrap = Module["_swe_get_ayanamsa_ex_ut_wrap"] = wasmExports2["y"];
          _swe_close_wrap = Module["_swe_close_wrap"] = wasmExports2["z"];
          _swe_version_wrap = Module["_swe_version_wrap"] = wasmExports2["A"];
          __emscripten_stack_restore = wasmExports2["B"];
          __emscripten_stack_alloc = wasmExports2["C"];
          _emscripten_stack_get_current = wasmExports2["D"];
          memory = wasmMemory = wasmExports2["k"];
          __indirect_function_table = wasmExports2["__indirect_function_table"];
        }
        var wasmImports = { c: ___syscall_fcntl64, i: ___syscall_ioctl, j: ___syscall_openat, d: _emscripten_resize_heap, f: _environ_get, g: _environ_sizes_get, a: _fd_close, h: _fd_read, e: _fd_seek, b: _fd_write };
        async function run() {
          preRun();
          if (runDependencies) {
            await resolveRunDependencies();
          }
          var setStatus = Module["setStatus"];
          if (setStatus) {
            setStatus("Running...");
            await new Promise((resolve) => setTimeout(resolve, 1));
            setTimeout(setStatus, 1, "");
          }
          if (ABORT) return;
          initRuntime();
          Module["onRuntimeInitialized"]?.();
          postRun();
        }
        var wasmExports;
        wasmExports = await createWasm();
        await run();
        ;
        return Module;
      };
    })();
    if (typeof exports === "object" && typeof module === "object") {
      module.exports = SwissEphModule;
      module.exports.default = SwissEphModule;
    } else if (typeof define === "function" && define["amd"]) define([], () => SwissEphModule);
    swisseph_default = SwissEphModule;
  }
});

// node_modules/@swisseph/browser/dist/swisseph-browser.js
var swisseph_browser_exports = {};
__export(swisseph_browser_exports, {
  Asteroid: () => Asteroid,
  AsteroidOffset: () => AsteroidOffset,
  CalculationFlag: () => CalculationFlag,
  CalculationFlags: () => CalculationFlags,
  CalendarType: () => CalendarType,
  CommonCalculationFlags: () => CommonCalculationFlags,
  CommonEclipseTypes: () => CommonEclipseTypes,
  DateTimeImpl: () => DateTimeImpl,
  EclipseType: () => EclipseType,
  EclipseTypeFlags: () => EclipseTypeFlags,
  FictitiousPlanet: () => FictitiousPlanet,
  HousePoint: () => HousePoint,
  HouseSystem: () => HouseSystem,
  LunarEclipseImpl: () => LunarEclipseImpl,
  LunarPoint: () => LunarPoint,
  NumberOfPlanets: () => NumberOfPlanets,
  Planet: () => Planet,
  PlanetaryMoonOffset: () => PlanetaryMoonOffset,
  RiseTransitFlag: () => RiseTransitFlag,
  SiderealMode: () => SiderealMode,
  SolarEclipseImpl: () => SolarEclipseImpl,
  SwissEphemeris: () => SwissEphemeris,
  default: () => swisseph_browser_default,
  normalizeEclipseTypes: () => normalizeEclipseTypes,
  normalizeFlags: () => normalizeFlags,
  swisseph: () => swisseph
});
function normalizeFlags(input) {
  if (typeof input === "number") {
    return input;
  }
  if (input instanceof CalculationFlags) {
    return input.toNumber();
  }
  if (Array.isArray(input)) {
    return CalculationFlags.from(...input).toNumber();
  }
  return input;
}
function normalizeEclipseTypes(input) {
  if (typeof input === "number") {
    return input;
  }
  if (input instanceof EclipseTypeFlags) {
    return input.toNumber();
  }
  if (Array.isArray(input)) {
    return EclipseTypeFlags.from(...input).toNumber();
  }
  return input;
}
var __defProp2, __name, CalendarType, Planet, LunarPoint, Asteroid, FictitiousPlanet, HouseSystem, HousePoint, CalculationFlag, CommonCalculationFlags, EclipseType, CommonEclipseTypes, SiderealMode, RiseTransitFlag, AsteroidOffset, PlanetaryMoonOffset, NumberOfPlanets, _a, LunarEclipseImpl, _a2, SolarEclipseImpl, _a3, DateTimeImpl, _a4, CalculationFlags, _a5, EclipseTypeFlags, _SwissEphemeris, SwissEphemeris, swisseph, swisseph_browser_default;
var init_swisseph_browser = __esm({
  "node_modules/@swisseph/browser/dist/swisseph-browser.js"() {
    __defProp2 = Object.defineProperty;
    __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
    CalendarType = /* @__PURE__ */ ((CalendarType2) => {
      CalendarType2[CalendarType2["Julian"] = 0] = "Julian";
      CalendarType2[CalendarType2["Gregorian"] = 1] = "Gregorian";
      return CalendarType2;
    })(CalendarType || {});
    Planet = /* @__PURE__ */ ((Planet22) => {
      Planet22[Planet22["Sun"] = 0] = "Sun";
      Planet22[Planet22["Moon"] = 1] = "Moon";
      Planet22[Planet22["Mercury"] = 2] = "Mercury";
      Planet22[Planet22["Venus"] = 3] = "Venus";
      Planet22[Planet22["Mars"] = 4] = "Mars";
      Planet22[Planet22["Jupiter"] = 5] = "Jupiter";
      Planet22[Planet22["Saturn"] = 6] = "Saturn";
      Planet22[Planet22["Uranus"] = 7] = "Uranus";
      Planet22[Planet22["Neptune"] = 8] = "Neptune";
      Planet22[Planet22["Pluto"] = 9] = "Pluto";
      Planet22[Planet22["Earth"] = 14] = "Earth";
      Planet22[Planet22["EclipticNutation"] = -1] = "EclipticNutation";
      Planet22[Planet22["FixedStar"] = -10] = "FixedStar";
      return Planet22;
    })(Planet || {});
    LunarPoint = /* @__PURE__ */ ((LunarPoint2) => {
      LunarPoint2[LunarPoint2["MeanNode"] = 10] = "MeanNode";
      LunarPoint2[LunarPoint2["TrueNode"] = 11] = "TrueNode";
      LunarPoint2[LunarPoint2["MeanApogee"] = 12] = "MeanApogee";
      LunarPoint2[LunarPoint2["OsculatingApogee"] = 13] = "OsculatingApogee";
      LunarPoint2[LunarPoint2["InterpolatedApogee"] = 21] = "InterpolatedApogee";
      LunarPoint2[LunarPoint2["InterpolatedPerigee"] = 22] = "InterpolatedPerigee";
      return LunarPoint2;
    })(LunarPoint || {});
    Asteroid = /* @__PURE__ */ ((Asteroid2) => {
      Asteroid2[Asteroid2["Chiron"] = 15] = "Chiron";
      Asteroid2[Asteroid2["Pholus"] = 16] = "Pholus";
      Asteroid2[Asteroid2["Ceres"] = 17] = "Ceres";
      Asteroid2[Asteroid2["Pallas"] = 18] = "Pallas";
      Asteroid2[Asteroid2["Juno"] = 19] = "Juno";
      Asteroid2[Asteroid2["Vesta"] = 20] = "Vesta";
      return Asteroid2;
    })(Asteroid || {});
    FictitiousPlanet = /* @__PURE__ */ ((FictitiousPlanet2) => {
      FictitiousPlanet2[FictitiousPlanet2["Cupido"] = 40] = "Cupido";
      FictitiousPlanet2[FictitiousPlanet2["Hades"] = 41] = "Hades";
      FictitiousPlanet2[FictitiousPlanet2["Zeus"] = 42] = "Zeus";
      FictitiousPlanet2[FictitiousPlanet2["Kronos"] = 43] = "Kronos";
      FictitiousPlanet2[FictitiousPlanet2["Apollon"] = 44] = "Apollon";
      FictitiousPlanet2[FictitiousPlanet2["Admetos"] = 45] = "Admetos";
      FictitiousPlanet2[FictitiousPlanet2["Vulkanus"] = 46] = "Vulkanus";
      FictitiousPlanet2[FictitiousPlanet2["Poseidon"] = 47] = "Poseidon";
      FictitiousPlanet2[FictitiousPlanet2["Isis"] = 48] = "Isis";
      FictitiousPlanet2[FictitiousPlanet2["Nibiru"] = 49] = "Nibiru";
      FictitiousPlanet2[FictitiousPlanet2["Harrington"] = 50] = "Harrington";
      FictitiousPlanet2[FictitiousPlanet2["NeptuneLeverrier"] = 51] = "NeptuneLeverrier";
      FictitiousPlanet2[FictitiousPlanet2["NeptuneAdams"] = 52] = "NeptuneAdams";
      FictitiousPlanet2[FictitiousPlanet2["PlutoLowell"] = 53] = "PlutoLowell";
      FictitiousPlanet2[FictitiousPlanet2["PlutoPickering"] = 54] = "PlutoPickering";
      FictitiousPlanet2[FictitiousPlanet2["Vulcan"] = 55] = "Vulcan";
      FictitiousPlanet2[FictitiousPlanet2["WhiteMoon"] = 56] = "WhiteMoon";
      FictitiousPlanet2[FictitiousPlanet2["Proserpina"] = 57] = "Proserpina";
      FictitiousPlanet2[FictitiousPlanet2["Waldemath"] = 58] = "Waldemath";
      return FictitiousPlanet2;
    })(FictitiousPlanet || {});
    HouseSystem = /* @__PURE__ */ ((HouseSystem2) => {
      HouseSystem2["Placidus"] = "P";
      HouseSystem2["Koch"] = "K";
      HouseSystem2["Porphyrius"] = "O";
      HouseSystem2["Regiomontanus"] = "R";
      HouseSystem2["Campanus"] = "C";
      HouseSystem2["Equal"] = "A";
      HouseSystem2["VehlowEqual"] = "V";
      HouseSystem2["WholeSign"] = "W";
      HouseSystem2["Meridian"] = "X";
      HouseSystem2["Azimuthal"] = "H";
      HouseSystem2["PolichPage"] = "T";
      HouseSystem2["Alcabitus"] = "B";
      HouseSystem2["Morinus"] = "M";
      return HouseSystem2;
    })(HouseSystem || {});
    HousePoint = /* @__PURE__ */ ((HousePoint2) => {
      HousePoint2[HousePoint2["Ascendant"] = 0] = "Ascendant";
      HousePoint2[HousePoint2["MC"] = 1] = "MC";
      HousePoint2[HousePoint2["ARMC"] = 2] = "ARMC";
      HousePoint2[HousePoint2["Vertex"] = 3] = "Vertex";
      HousePoint2[HousePoint2["EquatorialAscendant"] = 4] = "EquatorialAscendant";
      HousePoint2[HousePoint2["CoAscendant1"] = 5] = "CoAscendant1";
      HousePoint2[HousePoint2["CoAscendant2"] = 6] = "CoAscendant2";
      HousePoint2[HousePoint2["PolarAscendant"] = 7] = "PolarAscendant";
      return HousePoint2;
    })(HousePoint || {});
    CalculationFlag = /* @__PURE__ */ ((CalculationFlag2) => {
      CalculationFlag2[CalculationFlag2["JPLEphemeris"] = 1] = "JPLEphemeris";
      CalculationFlag2[CalculationFlag2["SwissEphemeris"] = 2] = "SwissEphemeris";
      CalculationFlag2[CalculationFlag2["MoshierEphemeris"] = 4] = "MoshierEphemeris";
      CalculationFlag2[CalculationFlag2["Heliocentric"] = 8] = "Heliocentric";
      CalculationFlag2[CalculationFlag2["TruePositions"] = 16] = "TruePositions";
      CalculationFlag2[CalculationFlag2["J2000"] = 32] = "J2000";
      CalculationFlag2[CalculationFlag2["NoNutation"] = 64] = "NoNutation";
      CalculationFlag2[CalculationFlag2["Speed3"] = 128] = "Speed3";
      CalculationFlag2[CalculationFlag2["Speed"] = 256] = "Speed";
      CalculationFlag2[CalculationFlag2["NoGravitationalDeflection"] = 512] = "NoGravitationalDeflection";
      CalculationFlag2[CalculationFlag2["NoAberration"] = 1024] = "NoAberration";
      CalculationFlag2[CalculationFlag2["Equatorial"] = 2048] = "Equatorial";
      CalculationFlag2[CalculationFlag2["XYZ"] = 4096] = "XYZ";
      CalculationFlag2[CalculationFlag2["Radians"] = 8192] = "Radians";
      CalculationFlag2[CalculationFlag2["Barycentric"] = 16384] = "Barycentric";
      CalculationFlag2[CalculationFlag2["Topocentric"] = 32768] = "Topocentric";
      CalculationFlag2[CalculationFlag2["Sidereal"] = 65536] = "Sidereal";
      CalculationFlag2[CalculationFlag2["ICRS"] = 131072] = "ICRS";
      CalculationFlag2[CalculationFlag2["DpsidepsIAU1980"] = 262144] = "DpsidepsIAU1980";
      CalculationFlag2[CalculationFlag2["JPLHorizons"] = 524288] = "JPLHorizons";
      CalculationFlag2[CalculationFlag2["JPLHorizonsApprox"] = 1048576] = "JPLHorizonsApprox";
      return CalculationFlag2;
    })(CalculationFlag || {});
    CommonCalculationFlags = {
      /** Astrometric positions (no aberration or gravitational deflection) */
      Astrometric: 1024 | 512,
      /** Default flags for Swiss Ephemeris with speed */
      DefaultSwissEphemeris: 2 | 256,
      /** Default flags for Moshier with speed */
      DefaultMoshier: 4 | 256
      /* Speed */
    };
    EclipseType = /* @__PURE__ */ ((EclipseType2) => {
      EclipseType2[EclipseType2["Central"] = 1] = "Central";
      EclipseType2[EclipseType2["NonCentral"] = 2] = "NonCentral";
      EclipseType2[EclipseType2["Total"] = 4] = "Total";
      EclipseType2[EclipseType2["Annular"] = 8] = "Annular";
      EclipseType2[EclipseType2["Partial"] = 16] = "Partial";
      EclipseType2[EclipseType2["AnnularTotal"] = 32] = "AnnularTotal";
      EclipseType2[EclipseType2["Penumbral"] = 64] = "Penumbral";
      return EclipseType2;
    })(EclipseType || {});
    CommonEclipseTypes = {
      /** All types of solar eclipses */
      AllSolar: 1 | 2 | 4 | 8 | 16 | 32,
      /** All types of lunar eclipses */
      AllLunar: 4 | 16 | 64
      /* Penumbral */
    };
    SiderealMode = /* @__PURE__ */ ((SiderealMode2) => {
      SiderealMode2[SiderealMode2["FaganBradley"] = 0] = "FaganBradley";
      SiderealMode2[SiderealMode2["Lahiri"] = 1] = "Lahiri";
      SiderealMode2[SiderealMode2["DeLuce"] = 2] = "DeLuce";
      SiderealMode2[SiderealMode2["Raman"] = 3] = "Raman";
      SiderealMode2[SiderealMode2["Ushashashi"] = 4] = "Ushashashi";
      SiderealMode2[SiderealMode2["Krishnamurti"] = 5] = "Krishnamurti";
      SiderealMode2[SiderealMode2["DjwhalKhul"] = 6] = "DjwhalKhul";
      SiderealMode2[SiderealMode2["Yukteshwar"] = 7] = "Yukteshwar";
      SiderealMode2[SiderealMode2["JNBhasin"] = 8] = "JNBhasin";
      SiderealMode2[SiderealMode2["BabylKugler1"] = 9] = "BabylKugler1";
      SiderealMode2[SiderealMode2["BabylKugler2"] = 10] = "BabylKugler2";
      SiderealMode2[SiderealMode2["BabylKugler3"] = 11] = "BabylKugler3";
      SiderealMode2[SiderealMode2["BabylHuber"] = 12] = "BabylHuber";
      SiderealMode2[SiderealMode2["BabylEtPSC"] = 13] = "BabylEtPSC";
      SiderealMode2[SiderealMode2["Aldebaran15Tau"] = 14] = "Aldebaran15Tau";
      SiderealMode2[SiderealMode2["Hipparchos"] = 15] = "Hipparchos";
      SiderealMode2[SiderealMode2["Sassanian"] = 16] = "Sassanian";
      SiderealMode2[SiderealMode2["GalacticCenter0Sag"] = 17] = "GalacticCenter0Sag";
      SiderealMode2[SiderealMode2["J2000"] = 18] = "J2000";
      SiderealMode2[SiderealMode2["J1900"] = 19] = "J1900";
      SiderealMode2[SiderealMode2["B1950"] = 20] = "B1950";
      SiderealMode2[SiderealMode2["SuryaSiddhanta"] = 21] = "SuryaSiddhanta";
      SiderealMode2[SiderealMode2["SuryaSiddhantaMeanSun"] = 22] = "SuryaSiddhantaMeanSun";
      SiderealMode2[SiderealMode2["Aryabhata"] = 23] = "Aryabhata";
      SiderealMode2[SiderealMode2["AryabhataMeanSun"] = 24] = "AryabhataMeanSun";
      SiderealMode2[SiderealMode2["SSRevati"] = 25] = "SSRevati";
      SiderealMode2[SiderealMode2["SSCitra"] = 26] = "SSCitra";
      SiderealMode2[SiderealMode2["TrueCitra"] = 27] = "TrueCitra";
      SiderealMode2[SiderealMode2["TrueRevati"] = 28] = "TrueRevati";
      SiderealMode2[SiderealMode2["TruePushya"] = 29] = "TruePushya";
      SiderealMode2[SiderealMode2["GalacticCenterGilBrand"] = 30] = "GalacticCenterGilBrand";
      SiderealMode2[SiderealMode2["GalacticEquatorIAU1958"] = 31] = "GalacticEquatorIAU1958";
      SiderealMode2[SiderealMode2["GalacticEquator"] = 32] = "GalacticEquator";
      SiderealMode2[SiderealMode2["GalacticEquatorMidMula"] = 33] = "GalacticEquatorMidMula";
      SiderealMode2[SiderealMode2["Skydram"] = 34] = "Skydram";
      SiderealMode2[SiderealMode2["TrueMula"] = 35] = "TrueMula";
      SiderealMode2[SiderealMode2["DhruvaGalCenterMulaWilhelm"] = 36] = "DhruvaGalCenterMulaWilhelm";
      SiderealMode2[SiderealMode2["Aryabhata522"] = 37] = "Aryabhata522";
      SiderealMode2[SiderealMode2["BabylBritton"] = 38] = "BabylBritton";
      SiderealMode2[SiderealMode2["UserDefined"] = 255] = "UserDefined";
      return SiderealMode2;
    })(SiderealMode || {});
    RiseTransitFlag = /* @__PURE__ */ ((RiseTransitFlag2) => {
      RiseTransitFlag2[RiseTransitFlag2["Rise"] = 1] = "Rise";
      RiseTransitFlag2[RiseTransitFlag2["Set"] = 2] = "Set";
      RiseTransitFlag2[RiseTransitFlag2["UpperTransit"] = 4] = "UpperTransit";
      RiseTransitFlag2[RiseTransitFlag2["LowerTransit"] = 8] = "LowerTransit";
      return RiseTransitFlag2;
    })(RiseTransitFlag || {});
    AsteroidOffset = 1e4;
    PlanetaryMoonOffset = 9e3;
    NumberOfPlanets = 23;
    LunarEclipseImpl = (_a = class {
      constructor(type, maximum, partialBegin, partialEnd, totalBegin, totalEnd, penumbralBegin, penumbralEnd) {
        this.type = type;
        this.maximum = maximum;
        this.partialBegin = partialBegin;
        this.partialEnd = partialEnd;
        this.totalBegin = totalBegin;
        this.totalEnd = totalEnd;
        this.penumbralBegin = penumbralBegin;
        this.penumbralEnd = penumbralEnd;
      }
      isTotal() {
        return (this.type & 4) !== 0;
      }
      isPartial() {
        return (this.type & 16) !== 0;
      }
      isPenumbralOnly() {
        return (this.type & 64) !== 0 && (this.type & (4 | 16)) === 0;
      }
      getTotalityDuration() {
        if (!this.isTotal() || this.totalBegin === 0 || this.totalEnd === 0) {
          return 0;
        }
        const duration = (this.totalEnd - this.totalBegin) * 24;
        return duration > 0 ? duration : 0;
      }
      getPartialDuration() {
        if (this.partialBegin === 0 || this.partialEnd === 0) {
          return 0;
        }
        const duration = (this.partialEnd - this.partialBegin) * 24;
        return duration > 0 ? duration : 0;
      }
      getTotalDuration() {
        if (this.penumbralBegin === 0 || this.penumbralEnd === 0) {
          return 0;
        }
        const duration = (this.penumbralEnd - this.penumbralBegin) * 24;
        return duration > 0 ? duration : 0;
      }
    }, __name(_a, "LunarEclipseImpl"), _a);
    SolarEclipseImpl = (_a2 = class {
      constructor(type, maximum, partialBegin, partialEnd, centralBegin, centralEnd, centerLineBegin, centerLineEnd) {
        this.type = type;
        this.maximum = maximum;
        this.partialBegin = partialBegin;
        this.partialEnd = partialEnd;
        this.centralBegin = centralBegin;
        this.centralEnd = centralEnd;
        this.centerLineBegin = centerLineBegin;
        this.centerLineEnd = centerLineEnd;
      }
      isTotal() {
        return (this.type & 4) !== 0;
      }
      isAnnular() {
        return (this.type & 8) !== 0;
      }
      isHybrid() {
        return (this.type & 32) !== 0;
      }
      isPartial() {
        return (this.type & 16) !== 0;
      }
      isCentral() {
        return (this.type & 1) !== 0;
      }
      isNonCentral() {
        return (this.type & 2) !== 0;
      }
    }, __name(_a2, "SolarEclipseImpl"), _a2);
    DateTimeImpl = (_a3 = class {
      constructor(year, month, day, hour, calendarType = 1) {
        this.year = year;
        this.month = month;
        this.day = day;
        this.hour = hour;
        this.calendarType = calendarType;
      }
      toISOString() {
        const hours = Math.floor(this.hour);
        const minutes = Math.floor((this.hour - hours) * 60);
        const seconds = Math.floor(((this.hour - hours) * 60 - minutes) * 60);
        const milliseconds = Math.floor((((this.hour - hours) * 60 - minutes) * 60 - seconds) * 1e3);
        const yearStr = Math.abs(this.year).toString().padStart(4, "0");
        const yearSign = this.year < 0 ? "-" : "";
        const monthStr = this.month.toString().padStart(2, "0");
        const dayStr = this.day.toString().padStart(2, "0");
        const hoursStr = hours.toString().padStart(2, "0");
        const minutesStr = minutes.toString().padStart(2, "0");
        const secondsStr = seconds.toString().padStart(2, "0");
        const msStr = milliseconds.toString().padStart(3, "0");
        return `${yearSign}${yearStr}-${monthStr}-${dayStr}T${hoursStr}:${minutesStr}:${secondsStr}.${msStr}Z`;
      }
      toString() {
        const calType = this.calendarType === 1 ? "Gregorian" : "Julian";
        const yearStr = this.year < 0 ? `${Math.abs(this.year)} BCE` : this.year.toString();
        return `${yearStr}-${this.month.toString().padStart(2, "0")}-${this.day.toString().padStart(2, "0")} ${this.hour.toFixed(6)} hours (${calType})`;
      }
    }, __name(_a3, "DateTimeImpl"), _a3);
    CalculationFlags = (_a4 = class {
      constructor(initialFlags) {
        this.flags = 0;
        if (initialFlags !== void 0) {
          this.add(initialFlags);
        }
      }
      /**
       * Add one or more flags to the current set
       * @param flag - Single flag or array of flags to add
       * @returns this (for method chaining)
       */
      add(flag) {
        if (Array.isArray(flag)) {
          flag.forEach((f) => this.flags |= f);
        } else {
          this.flags |= flag;
        }
        return this;
      }
      /**
       * Remove one or more flags from the current set
       * @param flag - Single flag or array of flags to remove
       * @returns this (for method chaining)
       */
      remove(flag) {
        if (Array.isArray(flag)) {
          flag.forEach((f) => this.flags &= ~f);
        } else {
          this.flags &= ~flag;
        }
        return this;
      }
      /**
       * Check if a specific flag is set
       * @param flag - Flag to check
       * @returns true if the flag is set
       */
      has(flag) {
        return (this.flags & flag) === flag;
      }
      /**
       * Convert to raw number for passing to C library
       * @returns The numeric representation of all combined flags
       */
      toNumber() {
        return this.flags;
      }
      /**
       * Create a new CalculationFlags instance from one or more flags
       * @param flags - Flags to combine
       * @returns New CalculationFlags instance
       */
      static from(...flags) {
        return new _a4(flags);
      }
      /**
       * Common preset: Swiss Ephemeris with speed calculation
       */
      static get swissEphemerisWithSpeed() {
        return _a4.from(
          2,
          256
          /* Speed */
        );
      }
      /**
       * Common preset: Moshier ephemeris with speed calculation
       */
      static get moshierWithSpeed() {
        return _a4.from(
          4,
          256
          /* Speed */
        );
      }
      /**
       * Common preset: Astrometric positions (no aberration or light deflection)
       */
      static get astrometric() {
        return _a4.from(
          2,
          1024,
          512
          /* NoGravitationalDeflection */
        );
      }
      /**
       * Common preset: Heliocentric positions
       */
      static get heliocentric() {
        return _a4.from(
          2,
          8
          /* Heliocentric */
        );
      }
      /**
       * Common preset: Topocentric positions
       */
      static get topocentric() {
        return _a4.from(
          2,
          32768
          /* Topocentric */
        );
      }
      /**
       * Common preset: Equatorial coordinates (RA/Dec)
       */
      static get equatorial() {
        return _a4.from(
          2,
          2048,
          256
          /* Speed */
        );
      }
    }, __name(_a4, "_CalculationFlags"), _a4);
    EclipseTypeFlags = (_a5 = class {
      constructor(initialFlags) {
        this.flags = 0;
        if (initialFlags !== void 0) {
          this.add(initialFlags);
        }
      }
      /**
       * Add one or more eclipse types to the filter
       * @param flag - Single type or array of types to add
       * @returns this (for method chaining)
       */
      add(flag) {
        if (Array.isArray(flag)) {
          flag.forEach((f) => this.flags |= f);
        } else {
          this.flags |= flag;
        }
        return this;
      }
      /**
       * Check if a specific eclipse type is in the filter
       * @param flag - Eclipse type to check
       * @returns true if the type is included
       */
      has(flag) {
        return (this.flags & flag) === flag;
      }
      /**
       * Convert to raw number for passing to C library
       * @returns The numeric representation of all combined types
       */
      toNumber() {
        return this.flags;
      }
      /**
       * Create a new EclipseTypeFlags instance from one or more types
       * @param flags - Eclipse types to combine
       * @returns New EclipseTypeFlags instance
       */
      static from(...flags) {
        return new _a5(flags);
      }
      /**
       * Preset: All solar eclipse types
       */
      static get allSolar() {
        return new _a5([
          1,
          2,
          4,
          8,
          16,
          32
          /* AnnularTotal */
        ]);
      }
      /**
       * Preset: All lunar eclipse types
       */
      static get allLunar() {
        return new _a5([
          4,
          16,
          64
          /* Penumbral */
        ]);
      }
      /**
       * Preset: Only total eclipses
       */
      static get totalOnly() {
        return _a5.from(
          4
          /* Total */
        );
      }
      /**
       * Preset: Total and partial eclipses (no penumbral)
       */
      static get totalAndPartial() {
        return _a5.from(
          4,
          16
          /* Partial */
        );
      }
    }, __name(_a5, "_EclipseTypeFlags"), _a5);
    __name(normalizeFlags, "normalizeFlags");
    __name(normalizeEclipseTypes, "normalizeEclipseTypes");
    _SwissEphemeris = class _SwissEphemeris2 {
      constructor() {
        this.module = null;
        this.ready = false;
      }
      /**
       * Initialize the WebAssembly module
       *
       * This must be called before using any other methods.
       * The WASM file is automatically loaded from the same directory as the JS bundle.
       *
       * @param wasmPath - Optional custom path to swisseph.wasm file (for advanced use cases)
       *
       * @example
       * const swe = new SwissEphemeris();
       * await swe.init();
       * console.log(swe.version());
       */
      async init(wasmPath) {
        if (this.ready) return;
        const SwissEphModuleImport = await Promise.resolve().then(() => (init_swisseph(), swisseph_exports));
        let SwissEphModuleFactory;
        if (typeof SwissEphModuleImport.default === "function") {
          SwissEphModuleFactory = SwissEphModuleImport.default;
        } else if (typeof SwissEphModuleImport === "function") {
          SwissEphModuleFactory = SwissEphModuleImport;
        } else if (SwissEphModuleImport.default) {
          SwissEphModuleFactory = SwissEphModuleImport.default;
        } else {
          SwissEphModuleFactory = SwissEphModuleImport.SwissEphModule || SwissEphModuleImport;
        }
        if (typeof SwissEphModuleFactory !== "function") {
          throw new Error("Failed to load WASM module: SwissEphModule factory function not found");
        }
        let resolvedWasmPath = wasmPath;
        if (!resolvedWasmPath) {
          try {
            resolvedWasmPath = new URL("./swisseph.wasm", import.meta.url).href;
          } catch (e) {
            resolvedWasmPath = "swisseph.wasm";
          }
        }
        this.module = await SwissEphModuleFactory({
          locateFile: /* @__PURE__ */ __name((path, prefix) => {
            if (path === "swisseph.wasm") {
              return resolvedWasmPath;
            }
            return prefix ? prefix + path : path;
          }, "locateFile")
        });
        this._wrapFunctions();
        this.ready = true;
        console.log("Swiss Ephemeris WASM initialized:", this.version());
      }
      /**
       * Wrap C functions for easier calling
       */
      _wrapFunctions() {
        const m = this.module;
        this._julday = m.cwrap(
          "swe_julday_wrap",
          "number",
          ["number", "number", "number", "number", "number"]
        );
        this._getPlanetName = m.cwrap(
          "swe_get_planet_name_wrap",
          "string",
          ["number"]
        );
        this._setSiderealMode = m.cwrap(
          "swe_set_sid_mode_wrap",
          null,
          ["number", "number", "number"]
        );
        this._getAyanamsa = m.cwrap(
          "swe_get_ayanamsa_ut_wrap",
          "number",
          ["number"]
        );
        this._close = m.cwrap("swe_close_wrap", null, []);
        this._version = m.cwrap("swe_version_wrap", "string", []);
      }
      /**
       * Check if the module is ready for use
       * @throws Error if not initialized
       */
      _checkReady() {
        if (!this.ready) {
          throw new Error(
            "SwissEphemeris not initialized. Call await swe.init() first."
          );
        }
      }
      /**
       * Get Swiss Ephemeris version string
       */
      version() {
        this._checkReady();
        return this._version();
      }
      /**
       * Set ephemeris file path
       *
       * Note: This is typically not used in the browser version as we use
       * the built-in Moshier ephemeris.
       *
       * @param path - Path to ephemeris files
       */
      setEphemerisPath(path) {
        this._checkReady();
        const m = this.module;
        const pathPtr = m.allocateUTF8(path || "");
        m.ccall("swe_set_ephe_path_wrap", null, ["number"], [pathPtr]);
        m._free(pathPtr);
      }
      /**
       * Load standard Swiss Ephemeris data files from jsDelivr CDN
       *
       * Simple one-line method to download standard ephemeris files (~2MB).
       * After loading, you can use CalculationFlag.SwissEphemeris for maximum precision.
       *
       * @example
       * // Simple: Load all standard files
       * await swe.loadStandardEphemeris();
       *
       * // Then use Swiss Ephemeris for calculations
       * const sun = swe.calculatePosition(jd, Planet.Sun, CalculationFlag.SwissEphemeris);
       */
      async loadStandardEphemeris() {
        const CDN_BASE = "https://cdn.jsdelivr.net/gh/aloistr/swisseph/ephe";
        await this.loadEphemerisFiles([
          { name: "sepl_18.se1", url: `${CDN_BASE}/sepl_18.se1` },
          { name: "semo_18.se1", url: `${CDN_BASE}/semo_18.se1` },
          { name: "seas_18.se1", url: `${CDN_BASE}/seas_18.se1` }
        ]);
      }
      /**
       * Load Swiss Ephemeris data files from URLs
       *
       * Downloads ephemeris files and writes them to the virtual filesystem.
       * Use this for maximum precision calculations or custom file sources.
       *
       * @param files - Array of files to download with name and URL
       *
       * @example
       * // Load from custom CDN or server
       * await swe.loadEphemerisFiles([
       *   {
       *     name: 'sepl_18.se1',
       *     url: 'https://your-cdn.com/ephemeris/sepl_18.se1'
       *   },
       *   {
       *     name: 'semo_18.se1',
       *     url: 'https://your-cdn.com/ephemeris/semo_18.se1'
       *   }
       * ]);
       *
       * // Then use Swiss Ephemeris
       * const sun = swe.calculatePosition(jd, Planet.Sun, CalculationFlag.SwissEphemeris);
       */
      async loadEphemerisFiles(files) {
        this._checkReady();
        const m = this.module;
        try {
          m.FS.mkdir("/ephemeris");
        } catch (e) {
        }
        for (const file of files) {
          const response = await fetch(file.url);
          if (!response.ok) {
            throw new Error(`Failed to download ${file.name}: ${response.statusText}`);
          }
          const arrayBuffer = await response.arrayBuffer();
          const data = new Uint8Array(arrayBuffer);
          m.FS.writeFile(`/ephemeris/${file.name}`, data);
        }
        this.setEphemerisPath("/ephemeris");
      }
      /**
       * Calculate Julian day number from calendar date
       *
       * @param year - Year (negative for BCE)
       * @param month - Month (1-12)
       * @param day - Day (1-31)
       * @param hour - Hour as decimal (0.0-23.999...)
       * @param calendarType - Calendar system (default: Gregorian)
       * @returns Julian day number
       *
       * @example
       * const jd = swe.julianDay(2007, 3, 3);
       * console.log(jd); // 2454162.5
       */
      julianDay(year, month, day, hour = 0, calendarType = CalendarType.Gregorian) {
        this._checkReady();
        if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day) || !Number.isFinite(hour)) {
          throw new TypeError(
            `julianDay requires finite numbers. Received: year=${year}, month=${month}, day=${day}, hour=${hour}`
          );
        }
        return this._julday(year, month, day, hour, calendarType);
      }
      /**
       * Calculate Julian day number from a JavaScript Date object
       *
       * Convenience function that converts a JavaScript Date to Julian day number.
       * The Date is interpreted as UTC.
       *
       * @param date - JavaScript Date object (interpreted as UTC)
       * @param calendarType - Calendar system (default: Gregorian)
       * @returns Julian day number
       *
       * @example
       * // From Date object
       * const date = new Date('1990-05-15T14:30:00Z');
       * const jd = swe.dateToJulianDay(date);
       *
       * // From timestamp
       * const now = new Date();
       * const jdNow = swe.dateToJulianDay(now);
       *
       * // Equivalent to swe.julianDay(1990, 5, 15, 14.5)
       * const jd2 = swe.dateToJulianDay(new Date(Date.UTC(1990, 4, 15, 14, 30)));
       */
      dateToJulianDay(date, calendarType = CalendarType.Gregorian) {
        this._checkReady();
        if (!(date instanceof Date)) {
          throw new TypeError("dateToJulianDay expects a Date object");
        }
        const year = date.getUTCFullYear();
        const month = date.getUTCMonth() + 1;
        const day = date.getUTCDate();
        const hours = date.getUTCHours();
        const minutes = date.getUTCMinutes();
        const seconds = date.getUTCSeconds();
        const milliseconds = date.getUTCMilliseconds();
        if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hours)) {
          throw new TypeError(
            `Invalid Date object provided to dateToJulianDay. Date.toString() returned: "${date.toString()}". Please ensure the date is valid (e.g., avoid new Date("invalid")).`
          );
        }
        const decimalHours = hours + minutes / 60 + seconds / 3600 + milliseconds / 36e5;
        return this.julianDay(year, month, day, decimalHours, calendarType);
      }
      /**
       * Convert Julian day number to calendar date
       *
       * @param jd - Julian day number
       * @param calendarType - Calendar system (default: Gregorian)
       * @returns DateTime object
       *
       * @example
       * const date = swe.julianDayToDate(2454162.5);
       * console.log(date.toString());
       */
      julianDayToDate(jd, calendarType = CalendarType.Gregorian) {
        this._checkReady();
        const m = this.module;
        const yearPtr = m._malloc(4);
        const monthPtr = m._malloc(4);
        const dayPtr = m._malloc(4);
        const hourPtr = m._malloc(8);
        m.ccall(
          "swe_revjul_wrap",
          null,
          ["number", "number", "number", "number", "number", "number"],
          [jd, calendarType, yearPtr, monthPtr, dayPtr, hourPtr]
        );
        const year = m.getValue(yearPtr, "i32");
        const month = m.getValue(monthPtr, "i32");
        const day = m.getValue(dayPtr, "i32");
        const hour = m.getValue(hourPtr, "double");
        m._free(yearPtr);
        m._free(monthPtr);
        m._free(dayPtr);
        m._free(hourPtr);
        return new DateTimeImpl(year, month, day, hour, calendarType);
      }
      /**
       * Calculate planetary positions
       *
       * Note: Browser version uses Moshier ephemeris by default.
       *
       * @param julianDay - Julian day number in Universal Time
       * @param body - Celestial body to calculate
       * @param flags - Calculation flags (default: Moshier with speed)
       * @returns PlanetaryPosition object
       *
       * @example
       * const sun = swe.calculatePosition(jd, Planet.Sun);
       * console.log(`Sun: ${sun.longitude}°, ${sun.latitude}°`);
       *
       * const moon = swe.calculatePosition(
       *   jd,
       *   Planet.Moon,
       *   CalculationFlag.MoshierEphemeris | CalculationFlag.Speed
       * );
       */
      calculatePosition(julianDay, body, flags = CommonCalculationFlags.DefaultMoshier) {
        this._checkReady();
        const normalizedFlags = normalizeFlags(flags);
        const m = this.module;
        const xxPtr = m._malloc(6 * 8);
        const serrPtr = m._malloc(256);
        const retflag = m.ccall(
          "swe_calc_ut_wrap",
          "number",
          ["number", "number", "number", "number", "number"],
          [julianDay, body, normalizedFlags, xxPtr, serrPtr]
        );
        if (retflag < 0) {
          const error = m.UTF8ToString(serrPtr);
          m._free(xxPtr);
          m._free(serrPtr);
          throw new Error(error);
        }
        const xx = [];
        for (let i = 0; i < 6; i++) {
          xx[i] = m.getValue(xxPtr + i * 8, "double");
        }
        m._free(xxPtr);
        m._free(serrPtr);
        return {
          longitude: xx[0],
          latitude: xx[1],
          distance: xx[2],
          longitudeSpeed: xx[3],
          latitudeSpeed: xx[4],
          distanceSpeed: xx[5],
          flags: retflag
        };
      }
      /**
       * Get celestial body name
       *
       * @param body - Celestial body identifier
       * @returns Name as a string
       *
       * @example
       * const name = swe.getCelestialBodyName(Planet.Mars);
       * console.log(name); // "Mars"
       */
      getCelestialBodyName(body) {
        this._checkReady();
        return this._getPlanetName(body);
      }
      /** Set the ayanamsa system used for sidereal calculations. */
      setSiderealMode(siderealMode, t0 = 0, ayanT0 = 0) {
        this._checkReady();
        this._setSiderealMode(siderealMode, t0, ayanT0);
      }
      /** Get the ayanamsa for a Julian Day in Universal Time. */
      getAyanamsa(julianDay) {
        this._checkReady();
        return this._getAyanamsa(julianDay);
      }
      /** Get the ayanamsa using explicit calculation flags. */
      getAyanamsaExUt(julianDay, flags = CalculationFlag.SwissEphemeris) {
        this._checkReady();
        const normalizedFlags = normalizeFlags(flags);
        const m = this.module;
        const ayanamsaPtr = m._malloc(8);
        const serrPtr = m._malloc(256);
        try {
          const retflag = m.ccall(
            "swe_get_ayanamsa_ex_ut_wrap",
            "number",
            ["number", "number", "number", "number"],
            [julianDay, normalizedFlags, ayanamsaPtr, serrPtr]
          );
          if (retflag < 0) {
            const error = m.UTF8ToString(serrPtr);
            throw new Error(error || "Failed to calculate ayanamsa");
          }
          return m.getValue(ayanamsaPtr, "double");
        } finally {
          m._free(ayanamsaPtr);
          m._free(serrPtr);
        }
      }
      /**
       * Find next lunar eclipse
       *
       * @param startJulianDay - Julian day to start search from
       * @param flags - Calculation flags (default: Moshier)
       * @param eclipseType - Filter by eclipse type (0 = all types)
       * @param backward - Search backward in time if true
       * @returns LunarEclipse object
       *
       * @example
       * const eclipse = swe.findNextLunarEclipse(jd);
       * console.log(`Is total: ${eclipse.isTotal()}`);
       * console.log(`Duration: ${eclipse.getTotalityDuration()} hours`);
       */
      findNextLunarEclipse(startJulianDay, flags = CalculationFlag.MoshierEphemeris, eclipseType = 0, backward = false) {
        this._checkReady();
        const normalizedFlags = normalizeFlags(flags);
        const normalizedEclipseType = normalizeEclipseTypes(eclipseType);
        const m = this.module;
        const tretPtr = m._malloc(10 * 8);
        const serrPtr = m._malloc(256);
        const retflag = m.ccall(
          "swe_lun_eclipse_when_wrap",
          "number",
          ["number", "number", "number", "number", "number", "number"],
          [startJulianDay, normalizedFlags, normalizedEclipseType, tretPtr, backward ? 1 : 0, serrPtr]
        );
        if (retflag < 0) {
          const error = m.UTF8ToString(serrPtr);
          m._free(tretPtr);
          m._free(serrPtr);
          throw new Error(error);
        }
        const tret = [];
        for (let i = 0; i < 10; i++) {
          tret[i] = m.getValue(tretPtr + i * 8, "double");
        }
        m._free(tretPtr);
        m._free(serrPtr);
        return new LunarEclipseImpl(
          retflag,
          tret[0],
          tret[1],
          tret[2],
          tret[3],
          tret[4],
          tret[5],
          tret[6]
        );
      }
      /**
       * Find next solar eclipse globally
       *
       * @param startJulianDay - Julian day to start search from
       * @param flags - Calculation flags (default: Moshier)
       * @param eclipseType - Filter by eclipse type (0 = all types)
       * @param backward - Search backward in time if true
       * @returns SolarEclipse object
       *
       * @example
       * const eclipse = swe.findNextSolarEclipse(jd);
       * console.log(`Is total: ${eclipse.isTotal()}`);
       * console.log(`Is central: ${eclipse.isCentral()}`);
       */
      findNextSolarEclipse(startJulianDay, flags = CalculationFlag.MoshierEphemeris, eclipseType = 0, backward = false) {
        this._checkReady();
        const normalizedFlags = normalizeFlags(flags);
        const normalizedEclipseType = normalizeEclipseTypes(eclipseType);
        const m = this.module;
        const tretPtr = m._malloc(10 * 8);
        const serrPtr = m._malloc(256);
        const retflag = m.ccall(
          "swe_sol_eclipse_when_glob_wrap",
          "number",
          ["number", "number", "number", "number", "number", "number"],
          [startJulianDay, normalizedFlags, normalizedEclipseType, tretPtr, backward ? 1 : 0, serrPtr]
        );
        if (retflag < 0) {
          const error = m.UTF8ToString(serrPtr);
          m._free(tretPtr);
          m._free(serrPtr);
          throw new Error(error);
        }
        const tret = [];
        for (let i = 0; i < 10; i++) {
          tret[i] = m.getValue(tretPtr + i * 8, "double");
        }
        m._free(tretPtr);
        m._free(serrPtr);
        return new SolarEclipseImpl(
          retflag,
          tret[0],
          tret[1],
          tret[2],
          tret[3],
          tret[4],
          tret[5],
          tret[6]
        );
      }
      /**
       * Calculate house cusps and angles
       *
       * @param julianDay - Julian day number in Universal Time
       * @param latitude - Geographic latitude
       * @param longitude - Geographic longitude
       * @param houseSystem - House system (default: Placidus)
       * @returns HouseData object
       *
       * @example
       * const houses = swe.calculateHouses(jd, 40.7128, -74.0060);
       * console.log(`Ascendant: ${houses.ascendant}°`);
       * console.log(`MC: ${houses.mc}°`);
       */
      calculateHouses(julianDay, latitude, longitude, houseSystem = HouseSystem.Placidus) {
        this._checkReady();
        const m = this.module;
        const cuspsPtr = m._malloc(13 * 8);
        const ascmcPtr = m._malloc(10 * 8);
        const hsysCode = houseSystem.charCodeAt(0);
        m.ccall(
          "swe_houses_wrap",
          "number",
          ["number", "number", "number", "number", "number", "number"],
          [julianDay, latitude, longitude, hsysCode, cuspsPtr, ascmcPtr]
        );
        const cusps = [];
        for (let i = 0; i < 13; i++) {
          cusps[i] = m.getValue(cuspsPtr + i * 8, "double");
        }
        const ascmc = [];
        for (let i = 0; i < 10; i++) {
          ascmc[i] = m.getValue(ascmcPtr + i * 8, "double");
        }
        m._free(cuspsPtr);
        m._free(ascmcPtr);
        return {
          cusps,
          ascendant: ascmc[HousePoint.Ascendant],
          mc: ascmc[HousePoint.MC],
          armc: ascmc[HousePoint.ARMC],
          vertex: ascmc[HousePoint.Vertex],
          equatorialAscendant: ascmc[HousePoint.EquatorialAscendant],
          coAscendant1: ascmc[HousePoint.CoAscendant1],
          coAscendant2: ascmc[HousePoint.CoAscendant2],
          polarAscendant: ascmc[HousePoint.PolarAscendant],
          houseSystem
        };
      }
      /**
       * Close Swiss Ephemeris and free resources
       */
      close() {
        if (this.ready) {
          this._close();
        }
      }
    };
    __name(_SwissEphemeris, "SwissEphemeris");
    SwissEphemeris = _SwissEphemeris;
    swisseph = new SwissEphemeris();
    swisseph_browser_default = SwissEphemeris;
    if (typeof window !== "undefined") {
      window.SwissEphemeris = SwissEphemeris;
      window.swisseph = swisseph;
    }
  }
});

// src/types.ts
var PanchangError = class extends Error {
  constructor(code, detail) {
    super(detail);
    this.code = code;
    this.name = "PanchangError";
  }
};
var ChartError = class extends Error {
  constructor(code, detail) {
    super(detail);
    this.code = code;
    this.name = "ChartError";
  }
};

// src/constants/planets.ts
var DASHA_SEQUENCE = [
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury"
];
var DASHA_YEARS = {
  Ketu: 7,
  Venus: 20,
  Sun: 6,
  Moon: 10,
  Mars: 7,
  Rahu: 18,
  Jupiter: 16,
  Saturn: 19,
  Mercury: 17
};
var DASHA_TOTAL_YEARS = 120;
var NAKSHATRA_LORD_CYCLE = [
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury"
];
var PLANET_ORDER = [
  { name: "Sun", abbr: "Su" },
  { name: "Moon", abbr: "Mo" },
  { name: "Mars", abbr: "Ma" },
  { name: "Mercury", abbr: "Me" },
  { name: "Jupiter", abbr: "Ju" },
  { name: "Venus", abbr: "Ve" },
  { name: "Saturn", abbr: "Sa" },
  { name: "Rahu", abbr: "Ra" },
  { name: "Ketu", abbr: "Ke" },
  { name: "Uranus", abbr: "Ur" },
  { name: "Neptune", abbr: "Ne" },
  { name: "Pluto", abbr: "Pl" }
];
var COMBUST_PLANETS = /* @__PURE__ */ new Set([
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn"
]);
var COMBUST_ORB = 5;
var AYANAMSA_MAP = {
  lahiri: { mode: 1 /* LAHIRI */, label: "N.C. Lahiri (Chitrapaksha)" },
  kp_new: { mode: 5 /* KRISHNAMURTI */, label: "K.P. New (Krishnamurti)" },
  kp_old: { mode: 5 /* KRISHNAMURTI */, label: "K.P. Old (Krishnamurti)" },
  raman: { mode: 3 /* RAMAN */, label: "B.V. Raman" },
  kp_khullar: {
    mode: 27 /* TRUE_CITRA */,
    label: "K.P. Khullar (True Chitrapaksha)"
  },
  sayan: { mode: null, label: "Sayana (Tropical)" },
  manoj: { mode: 28 /* TRUE_REVATI */, label: "Manoj (Lahiri ICRC)" }
};
var BAV_RULES = {
  Sun: {
    Sun: [1, 2, 4, 7, 8, 9, 10, 11],
    Moon: [3, 6, 10, 11],
    Mars: [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury: [3, 5, 6, 9, 10, 11, 12],
    Jupiter: [5, 6, 9, 11],
    Venus: [6, 7, 12],
    Saturn: [1, 2, 4, 7, 8, 9, 10, 11],
    Asc: [3, 4, 6, 10, 11, 12]
  },
  Moon: {
    Sun: [3, 6, 7, 8, 10, 11],
    Moon: [3, 6, 7, 8, 10, 11],
    Mars: [2, 3, 5, 6, 9, 10, 11],
    Mercury: [1, 3, 4, 5, 7, 8, 10, 11],
    Jupiter: [1, 4, 7, 8, 10, 11, 12],
    Venus: [3, 4, 5, 7, 9, 10, 11],
    Saturn: [3, 5, 6, 11],
    Asc: [3, 6, 10, 11]
  },
  Mars: {
    Sun: [3, 5, 6, 10, 11],
    Moon: [3, 6, 11],
    Mars: [1, 2, 4, 7, 8, 10, 11],
    Mercury: [3, 5, 6, 11],
    Jupiter: [6, 10, 11, 12],
    Venus: [6, 8, 11, 12],
    Saturn: [1, 4, 7, 8, 9, 10, 11],
    Asc: [1, 3, 6, 10, 11]
  },
  Mercury: {
    Sun: [5, 6, 9, 11, 12],
    Moon: [2, 4, 6, 8, 10, 11],
    Mars: [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury: [1, 3, 5, 6, 9, 10, 11, 12],
    Jupiter: [6, 8, 11, 12],
    Venus: [1, 2, 3, 4, 5, 8, 9, 11],
    Saturn: [1, 2, 4, 7, 8, 9, 10, 11],
    Asc: [1, 2, 4, 6, 8, 10, 11]
  },
  Jupiter: {
    Sun: [1, 2, 3, 4, 7, 8, 9, 10, 11],
    Moon: [2, 5, 7, 9, 11],
    Mars: [1, 2, 4, 7, 8, 10, 11],
    Mercury: [1, 2, 4, 5, 6, 9, 10, 11],
    Jupiter: [1, 2, 3, 4, 7, 8, 10, 11],
    Venus: [2, 5, 6, 9, 10, 11],
    Saturn: [3, 5, 6, 12],
    Asc: [1, 2, 4, 5, 6, 7, 9, 10, 11]
  },
  Venus: {
    Sun: [8, 11, 12],
    Moon: [1, 2, 3, 4, 5, 8, 9, 11, 12],
    Mars: [3, 5, 6, 9, 11, 12],
    Mercury: [3, 5, 6, 9, 11],
    Jupiter: [5, 8, 9, 10, 11],
    Venus: [1, 2, 3, 4, 5, 8, 9, 10, 11],
    Saturn: [3, 4, 5, 8, 9, 10, 11],
    Asc: [1, 2, 3, 4, 5, 8, 9, 11]
  },
  Saturn: {
    Sun: [1, 2, 4, 7, 8, 10, 11],
    Moon: [3, 6, 11],
    Mars: [3, 5, 6, 10, 11, 12],
    Mercury: [6, 8, 9, 10, 11, 12],
    Jupiter: [5, 6, 11, 12],
    Venus: [6, 11, 12],
    Saturn: [3, 5, 6, 11],
    Asc: [1, 3, 4, 6, 10, 11]
  }
};
var BAV_CONTRIBUTORS = [
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
  "Asc"
];
var EXALTATION = {
  Sun: { sign: 1, degree: 10 },
  // Aries 10°
  Moon: { sign: 2, degree: 3 },
  // Taurus 3°
  Mars: { sign: 10, degree: 28 },
  // Capricorn 28°
  Mercury: { sign: 6, degree: 15 },
  // Virgo 15°
  Jupiter: { sign: 4, degree: 5 },
  // Cancer 5°
  Venus: { sign: 12, degree: 27 },
  // Pisces 27°
  Saturn: { sign: 7, degree: 20 },
  // Libra 20°
  Rahu: { sign: 2, degree: 0 },
  // Taurus (various traditions)
  Ketu: { sign: 8, degree: 0 }
  // Scorpio
};
var DEBILITATION = {
  Sun: { sign: 7, degree: 10 },
  Moon: { sign: 8, degree: 3 },
  Mars: { sign: 4, degree: 28 },
  Mercury: { sign: 12, degree: 15 },
  Jupiter: { sign: 10, degree: 5 },
  Venus: { sign: 6, degree: 27 },
  Saturn: { sign: 1, degree: 20 },
  Rahu: { sign: 8, degree: 0 },
  Ketu: { sign: 2, degree: 0 }
};
var OWN_SIGNS = {
  Sun: [5],
  Moon: [4],
  Mars: [1, 8],
  Mercury: [3, 6],
  Jupiter: [9, 12],
  Venus: [2, 7],
  Saturn: [10, 11]
};
var MOOLATRIKONA = {
  Sun: { sign: 5, start: 0, end: 20 },
  Moon: { sign: 2, start: 4, end: 30 },
  Mars: { sign: 1, start: 0, end: 12 },
  Mercury: { sign: 6, start: 16, end: 20 },
  Jupiter: { sign: 9, start: 0, end: 10 },
  Venus: { sign: 7, start: 0, end: 15 },
  Saturn: { sign: 11, start: 0, end: 20 }
};
var DIGBALA_SIGNS = {
  Sun: 10,
  // Capricorn (MC)
  Moon: 4,
  // Cancer (IC)
  Mars: 10,
  // Capricorn
  Mercury: 1,
  // Aries (ASC)
  Jupiter: 1,
  // Aries
  Venus: 4,
  // Cancer
  Saturn: 7
  // Libra (DSC)
};
var PUSHKARA_BHAGA = {
  1: [21],
  2: [14],
  3: [7],
  4: [12],
  5: [18],
  6: [8],
  7: [20],
  8: [24],
  9: [16],
  10: [19],
  11: [28],
  12: [9]
};
var PUSHKARA_NAVAMSA_SIGNS = /* @__PURE__ */ new Set([1, 2, 4, 5, 7, 8, 10, 11]);
var MRITYU_BHAGA = {
  Sun: {
    1: 20,
    2: 9,
    3: 12,
    4: 6,
    5: 8,
    6: 24,
    7: 16,
    8: 17,
    9: 22,
    10: 2,
    11: 3,
    12: 23
  },
  Moon: {
    1: 26,
    2: 12,
    3: 13,
    4: 25,
    5: 24,
    6: 11,
    7: 26,
    8: 14,
    9: 13,
    10: 25,
    11: 5,
    12: 12
  },
  Mars: {
    1: 18,
    2: 28,
    3: 16,
    4: 14,
    5: 16,
    6: 27,
    7: 28,
    8: 18,
    9: 16,
    10: 14,
    11: 13,
    12: 21
  },
  Mercury: {
    1: 15,
    2: 14,
    3: 8,
    4: 13,
    5: 16,
    6: 18,
    7: 7,
    8: 20,
    9: 17,
    10: 22,
    11: 5,
    12: 2
  },
  Jupiter: {
    1: 5,
    2: 11,
    3: 29,
    4: 29,
    5: 10,
    6: 15,
    7: 15,
    8: 9,
    9: 16,
    10: 14,
    11: 19,
    12: 15
  },
  Venus: {
    1: 9,
    2: 24,
    3: 11,
    4: 15,
    5: 11,
    6: 8,
    7: 10,
    8: 4,
    9: 22,
    10: 12,
    11: 18,
    12: 27
  },
  Saturn: {
    1: 14,
    2: 16,
    3: 19,
    4: 2,
    5: 7,
    6: 25,
    7: 24,
    8: 22,
    9: 5,
    10: 3,
    11: 26,
    12: 20
  }
};
var GANDANTA_JUNCTIONS = [
  { sign: 1, edge: "start", orb: 3.2 },
  // Aries start
  { sign: 4, edge: "end", orb: 3.2 },
  // Cancer end
  { sign: 5, edge: "start", orb: 3.2 },
  // Leo start
  { sign: 8, edge: "end", orb: 3.2 },
  // Scorpio end
  { sign: 9, edge: "start", orb: 3.2 },
  // Sagittarius start
  { sign: 12, edge: "end", orb: 3.2 }
  // Pisces end
];

// src/ephemeris/types.ts
var SE = {
  SUN: 0,
  MOON: 1,
  MERCURY: 2,
  VENUS: 3,
  MARS: 4,
  JUPITER: 5,
  SATURN: 6,
  URANUS: 7,
  NEPTUNE: 8,
  PLUTO: 9,
  MEAN_NODE: 10,
  // Rahu
  FLG_SWIEPH: 2,
  FLG_SPEED: 256,
  FLG_SIDEREAL: 65536,
  CALC_RISE: 1,
  CALC_SET: 2,
  GREG_CAL: 1
};
function ayanamsaToSiderealMode(ayanamsa) {
  const config = AYANAMSA_MAP[ayanamsa];
  if (!config) throw new Error(`Unknown ayanamsa: ${ayanamsa}`);
  return config.mode;
}

// src/ephemeris/browser.ts
var dynamicImport = null;
function fallbackImport(specifier) {
  if (!dynamicImport) {
    dynamicImport = new Function("s", "return import(s)");
  }
  return dynamicImport(specifier);
}
async function defaultModuleLoader() {
  try {
    return await Promise.resolve().then(() => (init_swisseph_browser(), swisseph_browser_exports));
  } catch {
    if (typeof process !== "undefined" && process.env?.VITEST) {
      return Promise.resolve().then(() => (init_swisseph_browser(), swisseph_browser_exports));
    }
    return fallbackImport("@swisseph/browser");
  }
}
var EARTH_RADIUS_KM = 6378.137;
var EARTH_RADIUS_M = 6378140;
var AU_KM = 1495978707e-1;
var ALT0_SUN = -0.8333;
var ALT0_MOON = -0.5667 - 0.2583;
function norm360(x) {
  return (x % 360 + 360) % 360;
}
function horizonDip(altitudeM) {
  if (!(altitudeM > 0)) return 0;
  return Math.acos(EARTH_RADIUS_M / (EARTH_RADIUS_M + altitudeM)) * 180 / Math.PI;
}
var fetchShimInstalled = false;
async function installNodeFetchShim() {
  if (fetchShimInstalled) return;
  if (typeof process === "undefined" || !process.versions?.node) return;
  const [{ readFile }, { fileURLToPath }] = await Promise.all([
    import("node:fs/promises"),
    import("node:url")
  ]);
  fetchShimInstalled = true;
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    if (typeof input === "string" && input.startsWith("file:")) {
      const bytes = await readFile(fileURLToPath(input));
      return new Response(new Uint8Array(bytes), {
        headers: { "Content-Type": "application/wasm" }
      });
    }
    return realFetch(input, init);
  };
}
function calculateAltitude(swe, t, body, lon, lat) {
  const flags = 2048 | 256;
  const pos = swe.calculatePosition(t, body, flags);
  const ra = pos.longitude * (Math.PI / 180);
  const dec = pos.latitude * (Math.PI / 180);
  const distAU = pos.distance;
  const phi = lat * (Math.PI / 180);
  const gmstDeg = (280.46061837 + 360.98564736629 * (t - 2451545)) % 360;
  const h = ((gmstDeg + lon) * (Math.PI / 180) - ra + Math.PI * 4) % (2 * Math.PI);
  let sinAlt = Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(h);
  sinAlt = Math.max(-1, Math.min(1, sinAlt));
  let alt = Math.asin(sinAlt);
  const parallax = Math.asin(EARTH_RADIUS_KM / (distAU * AU_KM));
  alt -= parallax * Math.cos(alt);
  return alt * (180 / Math.PI);
}
function computeTransit(swe, jd, body, geopos, which) {
  const [lon, lat] = geopos;
  const alt0 = (body === SE.MOON ? ALT0_MOON : ALT0_SUN) - horizonDip(geopos[2]);
  const wantRise = which === SE.CALC_RISE;
  const win = 1.7;
  const step = 0.02;
  let prev = jd;
  let prevF = calculateAltitude(swe, prev, body, lon, lat) - alt0;
  for (let t = jd + step; t <= jd + win; t += step) {
    const f = calculateAltitude(swe, t, body, lon, lat) - alt0;
    if (prevF !== 0 && Math.sign(prevF) !== Math.sign(f) && f > prevF === wantRise) {
      let lo = prev;
      let hi = t;
      for (let i = 0; i < 60; i++) {
        const mid = (lo + hi) / 2;
        if (calculateAltitude(swe, mid, body, lon, lat) - alt0 > 0 === f > 0) {
          hi = mid;
        } else {
          lo = mid;
        }
      }
      return (lo + hi) / 2;
    }
    prev = t;
    prevF = f;
  }
  return null;
}
var BrowserEphemeris = class {
  _swe;
  _initialized = false;
  _initPromise = null;
  _loader;
  constructor(loader = defaultModuleLoader) {
    this._loader = loader;
  }
  init(options) {
    if (this._initialized) return Promise.resolve();
    if (!this._initPromise) {
      this._initPromise = this._init(options).then(() => {
        this._initialized = true;
      }).finally(() => {
        this._initPromise = null;
      });
    }
    return this._initPromise;
  }
  async _init(options) {
    await installNodeFetchShim();
    const mod = await this._loader("@swisseph/browser");
    this._swe = new mod.SwissEphemeris();
    await this._swe.init();
    this.setAyanamsa(options?.ayanamsa ?? "lahiri");
  }
  get initialized() {
    return this._initialized;
  }
  setAyanamsa(ayanamsa) {
    if (!this._swe) return;
    const mode = ayanamsaToSiderealMode(ayanamsa);
    if (mode !== null) {
      this._swe.setSiderealMode(mode, 0, 0);
    }
  }
  /** Returns the swisseph sidereal flag (0 for tropical/sayan). */
  getSiderealFlag(ayanamsa = "lahiri") {
    return ayanamsa === "sayan" ? 0 : SE.FLG_SIDEREAL;
  }
  /** Julian Day (Gregorian calendar). */
  julday(year, month, day, hour) {
    return this._swe.julianDay(year, month, day, hour);
  }
  /** Julian Day → [year, month, day, hour]. */
  revjul(jd) {
    const d = this._swe.julianDayToDate(jd, 1);
    return [d.year, d.month, d.day, d.hour];
  }
  /**
   * Calculate a planet's position at a given JD.
   * @param flags  Defaults to SWIEPH | SPEED | SIDEREAL for sidereal calcs.
   */
  calcUt(jd, planet, flags) {
    const f = flags ?? SE.FLG_SWIEPH | SE.FLG_SPEED | SE.FLG_SIDEREAL;
    const p = this._swe.calculatePosition(jd, planet, f);
    return {
      lon: p.longitude,
      lat: p.latitude,
      dist: p.distance,
      speed: p.longitudeSpeed
    };
  }
  /**
   * Calculate house cusps and ascendant using the given house system.
   * Default: Whole Sign ('W').
   * The browser engine computes tropical houses; when sidereal flags are set,
   * the ayanamsa is subtracted from cusps / ascendant / mc.
   */
  housesEx(jd, lat, lon, hsys = "W", flags) {
    const f = flags ?? SE.FLG_SIDEREAL;
    const r = this._swe.calculateHouses(jd, lat, lon, hsys);
    const cusps = new Array(13).fill(0);
    for (let i = 1; i <= 12; i++) cusps[i] = r.cusps[i] ?? 0;
    let ascendant = r.ascendant;
    let mc = r.mc;
    if (f & SE.FLG_SIDEREAL) {
      const ay = this._swe.getAyanamsaExUt(jd, SE.FLG_SWIEPH | SE.FLG_SIDEREAL);
      for (let i = 1; i <= 12; i++) cusps[i] = norm360(cusps[i] - ay);
      ascendant = norm360(ascendant - ay);
      mc = norm360(mc - ay);
    }
    return { cusps, ascendant, mc };
  }
  /**
   * Find rise or set time.
   * @param which  SE.CALC_RISE or SE.CALC_SET
   * @param geopos [longitude, latitude, altitude_m]
   */
  riseTrans(jd, body, geopos, which) {
    try {
      return computeTransit(this._swe, jd, body, geopos, which);
    } catch {
      return null;
    }
  }
  /** Get current ayanamsa value (degrees) at a given JD. */
  getAyanamsaUt(jd) {
    return this._swe.getAyanamsa(jd);
  }
  /** Solar eclipse search (global). */
  solEclipseWhenGlob(jd, flags = SE.FLG_SWIEPH) {
    try {
      return this._swe.findNextSolarEclipse(jd, flags);
    } catch {
      return null;
    }
  }
  /** Lunar eclipse search. */
  lunEclipseWhen(jd, flags = SE.FLG_SWIEPH) {
    try {
      return this._swe.findNextLunarEclipse(jd, flags);
    } catch {
      return null;
    }
  }
  /** ISO weekday: 1=Mon..7=Sun (closed form, verified vs swe_day_of_week). */
  isoWeekday(jd) {
    return Math.floor(jd + 0.5) % 7 + 1;
  }
};

// src/ephemeris/index.ts
var EphemerisService = class _EphemerisService {
  static _instance;
  _ephe;
  _initialized = false;
  _initPromise = null;
  constructor() {
    this._ephe = new BrowserEphemeris();
  }
  static getInstance() {
    if (!_EphemerisService._instance) {
      _EphemerisService._instance = new _EphemerisService();
    }
    return _EphemerisService._instance;
  }
  /** Reset singleton (for testing). */
  static destroy() {
    _EphemerisService._instance = void 0;
  }
  /**
   * Initialize the ephemeris service (loads the @swisseph/browser WASM engine).
   * Concurrent init() calls share the same in-flight initialization; a failure
   * clears it so a later init() attempt can retry.
   * @param options.ayanamsa Default ayanamsa (defaults to 'lahiri').
   */
  init(options = {}) {
    if (this._initialized) return Promise.resolve();
    if (!this._initPromise) {
      this._initPromise = Promise.resolve(
        this._ephe.init({ ayanamsa: options.ayanamsa })
      ).then(() => {
        this._initialized = true;
      }).finally(() => {
        this._initPromise = null;
      });
    }
    return this._initPromise;
  }
  get initialized() {
    return this._initialized;
  }
  setAyanamsa(ayanamsa) {
    this._ephe.setAyanamsa(ayanamsa);
  }
  /** Returns the swisseph sidereal flag (0 for tropical/sayan). */
  getSiderealFlag(ayanamsa = "lahiri") {
    return ayanamsa === "sayan" ? 0 : SE.FLG_SIDEREAL;
  }
  /** Julian Day (Gregorian calendar). */
  julday(year, month, day, hour) {
    return this._ephe.julday(year, month, day, hour);
  }
  /** Julian Day → [year, month, day, hour]. */
  revjul(jd) {
    return this._ephe.revjul(jd);
  }
  /**
   * Calculate a planet's position at a given JD.
   * @param flags  Defaults to SWIEPH | SPEED | SIDEREAL for sidereal calcs.
   */
  calcUt(jd, planet, flags) {
    return this._ephe.calcUt(jd, planet, flags);
  }
  /**
   * Calculate house cusps and ascendant using the given house system.
   * Default: Whole Sign ('W').
   */
  housesEx(jd, lat, lon, hsys = "W", flags) {
    return this._ephe.housesEx(jd, lat, lon, hsys, flags);
  }
  /**
   * Find rise or set time.
   * @param which  SE.CALC_RISE or SE.CALC_SET
   * @param geopos [longitude, latitude, altitude_m]
   */
  riseTrans(jd, body, geopos, which) {
    return this._ephe.riseTrans(jd, body, geopos, which);
  }
  /** Get current ayanamsa value (degrees) at a given JD. */
  getAyanamsaUt(jd) {
    return this._ephe.getAyanamsaUt(jd);
  }
  /** Solar eclipse search (global). */
  solEclipseWhenGlob(jd, flags = SE.FLG_SWIEPH) {
    return this._ephe.solEclipseWhenGlob(jd, flags);
  }
  /** Lunar eclipse search. */
  lunEclipseWhen(jd, flags = SE.FLG_SWIEPH) {
    return this._ephe.lunEclipseWhen(jd, flags);
  }
  /** Day of week — ISO weekday: 1=Mon..7=Sun */
  isoWeekday(jd) {
    return this._ephe.isoWeekday(jd);
  }
};

// src/locales/en.ts
var locale = {
  code: "en",
  label: "English",
  nakshatras: [
    "Ashwini",
    "Bharani",
    "Krittika",
    "Rohini",
    "Mrigashira",
    "Ardra",
    "Punarvasu",
    "Pushya",
    "Ashlesha",
    "Magha",
    "Purva Phalguni",
    "Uttara Phalguni",
    "Hasta",
    "Chitra",
    "Swati",
    "Vishakha",
    "Anuradha",
    "Jyeshtha",
    "Mula",
    "Purva Ashadha",
    "Uttara Ashadha",
    "Shravana",
    "Dhanishta",
    "Shatabhisha",
    "Purva Bhadrapada",
    "Uttara Bhadrapada",
    "Revati"
  ],
  tithis: [
    "",
    "Pratipada",
    "Dwitiya",
    "Tritiya",
    "Chaturthi",
    "Panchami",
    "Shashthi",
    "Saptami",
    "Ashtami",
    "Navami",
    "Dashami",
    "Ekadashi",
    "Dwadashi",
    "Trayodashi",
    "Chaturdashi",
    "Purnima",
    "Pratipada",
    "Dwitiya",
    "Tritiya",
    "Chaturthi",
    "Panchami",
    "Shashthi",
    "Saptami",
    "Ashtami",
    "Navami",
    "Dashami",
    "Ekadashi",
    "Dwadashi",
    "Trayodashi",
    "Amavasya"
  ],
  rashis: [
    "Mesha",
    "Vrishabha",
    "Mithuna",
    "Karka",
    "Simha",
    "Kanya",
    "Tula",
    "Vrishchika",
    "Dhanu",
    "Makara",
    "Kumbha",
    "Meena"
  ],
  signs: [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces"
  ],
  yogas: [
    "Vishkumbha",
    "Priti",
    "Ayushman",
    "Saubhagya",
    "Shobhana",
    "Atiganda",
    "Sukarma",
    "Dhriti",
    "Shula",
    "Ganda",
    "Vriddhi",
    "Dhruva",
    "Vyaghata",
    "Harshana",
    "Vajra",
    "Siddhi",
    "Vyatipata",
    "Variyana",
    "Parigha",
    "Shiva",
    "Siddha",
    "Sadhya",
    "Shubha",
    "Shukla",
    "Brahma",
    "Indra",
    "Vaidhriti"
  ],
  movableKaranas: [
    "Bava",
    "Balava",
    "Kaulava",
    "Taitila",
    "Gara",
    "Vanija",
    "Vishti"
  ],
  signLords: [
    "Mars",
    "Venus",
    "Mercury",
    "Moon",
    "Sun",
    "Mercury",
    "Venus",
    "Mars",
    "Jupiter",
    "Saturn",
    "Saturn",
    "Jupiter"
  ],
  nakshatraLords: [
    "Ketu",
    "Venus",
    "Sun",
    "Moon",
    "Mars",
    "Rahu",
    "Jupiter",
    "Saturn",
    "Mercury"
  ],
  varas: [
    "",
    "Somavara",
    "Mangalavara",
    "Budhavara",
    "Guruvara",
    "Shukravara",
    "Shanivara",
    "Ravivara"
  ],
  varaEnglish: [
    "",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ],
  samvatsaras: [
    "Prabhava",
    "Vibhava",
    "Shukla",
    "Pramoda",
    "Prajapati",
    "Angira",
    "Srimukha",
    "Bhava",
    "Yuva",
    "Dhata",
    "Ishvara",
    "Bahudhanya",
    "Pramathi",
    "Vikrama",
    "Vrisha",
    "Chitrabhanu",
    "Subhanu",
    "Tarana",
    "Parthiva",
    "Vyaya",
    "Sarvajit",
    "Sarvadhari",
    "Virodhi",
    "Vikriti",
    "Khara",
    "Nandana",
    "Vijaya",
    "Jaya",
    "Manmatha",
    "Durmukha",
    "Hevilambi",
    "Vilambi",
    "Vikari",
    "Sharvari",
    "Plava",
    "Shubhakrit",
    "Shobhakrit",
    "Krodhi",
    "Vishvavasu",
    "Parabhava",
    "Plavanga",
    "Keelaka",
    "Saumya",
    "Sadharana",
    "Virodhikrit",
    "Paridhavi",
    "Pramadi",
    "Ananda",
    "Rakshasa",
    "Nala",
    "Pingala",
    "Kalayukta",
    "Siddharthi",
    "Raudra",
    "Durmati",
    "Dundubhi",
    "Rudhirodgari",
    "Raktakshi",
    "Krodhana",
    "Akshaya"
  ],
  chandraMasa: [
    "Chaitra",
    "Vaishakha",
    "Jyeshtha",
    "Ashadha",
    "Shravana",
    "Bhadrapada",
    "Ashwin",
    "Kartika",
    "Margashirsha",
    "Pausha",
    "Magha",
    "Phalguna"
  ],
  vargaNames: {
    1: "Rashi",
    2: "Hora",
    3: "Drekkana",
    4: "Chaturthamsa",
    7: "Saptamsa",
    9: "Navamsa",
    10: "Dashamsa",
    11: "Rudramsa",
    12: "Dvadashamsa",
    16: "Shodashamsa",
    20: "Vimshamsa",
    24: "Chaturvimshamsa",
    27: "Nakshatramsa (Bhamsa)",
    30: "Trimshamsa",
    40: "Khavedamsa",
    45: "Akshavedamsa",
    60: "Shashtyamsa"
  },
  vargaSubtitles: {
    1: "Physical Self / Body",
    2: "Wealth",
    3: "Siblings / Courage",
    4: "Fortunes / Home",
    7: "Children",
    9: "Spouse / Dharma",
    10: "Career / Achievement",
    11: "Gains / Income",
    12: "Parents",
    16: "Vehicles / Comforts",
    20: "Spiritual Progress",
    24: "Education / Learning",
    27: "Strengths / Weaknesses",
    30: "Misfortunes",
    40: "Maternal Legacy",
    45: "Paternal Legacy",
    60: "Past-Life Karma"
  },
  gowriNames: [
    "Soram",
    "Uthi",
    "Visham",
    "Amridha",
    "Rogam",
    "Labam",
    "Dhanam",
    "Sugam"
  ],
  karakaTitles: ["AK", "AmK", "BK", "MK", "PK", "GK", "DK"],
  kalsarpaTypes: [
    "Anant",
    "Kulik",
    "Vasuki",
    "Shankhpal",
    "Padma",
    "Mahapadma",
    "Takshak",
    "Karkotak",
    "Shankhachood",
    "Ghatak",
    "Vishaktak",
    "Sheshnag"
  ],
  drikRitu: [
    "Vasant (Spring)",
    "Grishma (Summer)",
    "Grishma (Summer)",
    "Varsha (Monsoon)",
    "Varsha (Monsoon)",
    "Sharad (Autumn)",
    "Sharad (Autumn)",
    "Hemant (Pre-Winter)",
    "Hemant (Pre-Winter)",
    "Shishir (Winter)",
    "Shishir (Winter)",
    "Vasant (Spring)"
  ],
  vedicRitu: [
    "Vasant",
    "Grishma",
    "Grishma",
    "Varsha",
    "Varsha",
    "Sharad",
    "Sharad",
    "Hemant",
    "Hemant",
    "Shishir",
    "Shishir",
    "Vasant"
  ],
  directions: [
    "East",
    "South-East",
    "South",
    "South-West",
    "West",
    "North-West",
    "North",
    "North-East"
  ],
  nirayanaMonths: [
    "Vaishakha",
    "Jyeshtha",
    "Ashadha",
    "Shravana",
    "Bhadrapada",
    "Ashwin",
    "Kartika",
    "Margashirsha",
    "Pausha",
    "Magha",
    "Phalguna",
    "Chaitra"
  ],
  shakaMonths: [
    "Chaitra",
    "Vaishakha",
    "Jyeshtha",
    "Ashadha",
    "Shravana",
    "Bhadrapada",
    "Ashwin",
    "Kartika",
    "Margashirsha",
    "Pausha",
    "Magha",
    "Phalguna"
  ]
};
var en_default = locale;

// src/locales/hi.ts
var locale2 = {
  code: "hi",
  label: "\u0939\u093F\u0928\u094D\u0926\u0940",
  nakshatras: [
    "\u0905\u0936\u094D\u0935\u093F\u0928\u0940",
    "\u092D\u0930\u0923\u0940",
    "\u0915\u0943\u0924\u094D\u0924\u093F\u0915\u093E",
    "\u0930\u094B\u0939\u093F\u0923\u0940",
    "\u092E\u0943\u0917\u0936\u093F\u0930\u093E",
    "\u0906\u0930\u094D\u0926\u094D\u0930\u093E",
    "\u092A\u0941\u0928\u0930\u094D\u0935\u0938\u0941",
    "\u092A\u0941\u0937\u094D\u092F",
    "\u0906\u0936\u094D\u0932\u0947\u0937\u093E",
    "\u092E\u0918\u093E",
    "\u092A\u0942\u0930\u094D\u0935 \u092B\u093E\u0932\u094D\u0917\u0941\u0928\u0940",
    "\u0909\u0924\u094D\u0924\u0930 \u092B\u093E\u0932\u094D\u0917\u0941\u0928\u0940",
    "\u0939\u0938\u094D\u0924",
    "\u091A\u093F\u0924\u094D\u0930\u093E",
    "\u0938\u094D\u0935\u093E\u0924\u093F",
    "\u0935\u093F\u0936\u093E\u0916\u093E",
    "\u0905\u0928\u0941\u0930\u093E\u0927\u093E",
    "\u091C\u094D\u092F\u0947\u0937\u094D\u0920\u093E",
    "\u092E\u0942\u0932",
    "\u092A\u0942\u0930\u094D\u0935\u093E\u0937\u093E\u0922\u093C\u093E",
    "\u0909\u0924\u094D\u0924\u0930\u093E\u0937\u093E\u0922\u093C\u093E",
    "\u0936\u094D\u0930\u0935\u0923",
    "\u0927\u0928\u093F\u0937\u094D\u0920\u093E",
    "\u0936\u0924\u092D\u093F\u0937\u093E",
    "\u092A\u0942\u0930\u094D\u0935 \u092D\u093E\u0926\u094D\u0930\u092A\u0926",
    "\u0909\u0924\u094D\u0924\u0930 \u092D\u093E\u0926\u094D\u0930\u092A\u0926",
    "\u0930\u0947\u0935\u0924\u0940"
  ],
  tithis: [
    "",
    "\u092A\u094D\u0930\u0924\u093F\u092A\u0926\u093E",
    "\u0926\u094D\u0935\u093F\u0924\u0940\u092F\u093E",
    "\u0924\u0943\u0924\u0940\u092F\u093E",
    "\u091A\u0924\u0941\u0930\u094D\u0925\u0940",
    "\u092A\u0902\u091A\u092E\u0940",
    "\u0937\u0937\u094D\u0920\u0940",
    "\u0938\u092A\u094D\u0924\u092E\u0940",
    "\u0905\u0937\u094D\u091F\u092E\u0940",
    "\u0928\u0935\u092E\u0940",
    "\u0926\u0936\u092E\u0940",
    "\u090F\u0915\u093E\u0926\u0936\u0940",
    "\u0926\u094D\u0935\u093E\u0926\u0936\u0940",
    "\u0924\u094D\u0930\u092F\u094B\u0926\u0936\u0940",
    "\u091A\u0924\u0941\u0930\u094D\u0926\u0936\u0940",
    "\u092A\u0942\u0930\u094D\u0923\u093F\u092E\u093E",
    "\u092A\u094D\u0930\u0924\u093F\u092A\u0926\u093E",
    "\u0926\u094D\u0935\u093F\u0924\u0940\u092F\u093E",
    "\u0924\u0943\u0924\u0940\u092F\u093E",
    "\u091A\u0924\u0941\u0930\u094D\u0925\u0940",
    "\u092A\u0902\u091A\u092E\u0940",
    "\u0937\u0937\u094D\u0920\u0940",
    "\u0938\u092A\u094D\u0924\u092E\u0940",
    "\u0905\u0937\u094D\u091F\u092E\u0940",
    "\u0928\u0935\u092E\u0940",
    "\u0926\u0936\u092E\u0940",
    "\u090F\u0915\u093E\u0926\u0936\u0940",
    "\u0926\u094D\u0935\u093E\u0926\u0936\u0940",
    "\u0924\u094D\u0930\u092F\u094B\u0926\u0936\u0940",
    "\u0905\u092E\u093E\u0935\u0938\u094D\u092F\u093E"
  ],
  rashis: [
    "\u092E\u0947\u0937",
    "\u0935\u0943\u0937\u092D",
    "\u092E\u093F\u0925\u0941\u0928",
    "\u0915\u0930\u094D\u0915",
    "\u0938\u093F\u0902\u0939",
    "\u0915\u0928\u094D\u092F\u093E",
    "\u0924\u0941\u0932\u093E",
    "\u0935\u0943\u0936\u094D\u091A\u093F\u0915",
    "\u0927\u0928\u0941",
    "\u092E\u0915\u0930",
    "\u0915\u0941\u0902\u092D",
    "\u092E\u0940\u0928"
  ],
  signs: [
    "\u092E\u0947\u0937",
    "\u0935\u0943\u0937\u092D",
    "\u092E\u093F\u0925\u0941\u0928",
    "\u0915\u0930\u094D\u0915",
    "\u0938\u093F\u0902\u0939",
    "\u0915\u0928\u094D\u092F\u093E",
    "\u0924\u0941\u0932\u093E",
    "\u0935\u0943\u0936\u094D\u091A\u093F\u0915",
    "\u0927\u0928\u0941",
    "\u092E\u0915\u0930",
    "\u0915\u0941\u0902\u092D",
    "\u092E\u0940\u0928"
  ],
  yogas: [
    "\u0935\u093F\u0937\u094D\u0915\u0941\u092E\u094D\u092D",
    "\u092A\u094D\u0930\u0940\u0924\u093F",
    "\u0906\u092F\u0941\u0937\u094D\u092E\u093E\u0928",
    "\u0938\u094C\u092D\u093E\u0917\u094D\u092F",
    "\u0936\u094B\u092D\u0928",
    "\u0905\u0924\u093F\u0917\u0923\u094D\u0921",
    "\u0938\u0941\u0915\u0930\u094D\u092E\u093E",
    "\u0927\u0943\u0924\u093F",
    "\u0936\u0942\u0932",
    "\u0917\u0923\u094D\u0921",
    "\u0935\u0943\u0926\u094D\u0927\u093F",
    "\u0927\u094D\u0930\u0941\u0935",
    "\u0935\u094D\u092F\u093E\u0918\u093E\u0924",
    "\u0939\u0930\u094D\u0937\u0923",
    "\u0935\u091C\u094D\u0930",
    "\u0938\u093F\u0926\u094D\u0927\u093F",
    "\u0935\u094D\u092F\u0924\u0940\u092A\u093E\u0924",
    "\u0935\u0930\u0940\u092F\u093E\u0928",
    "\u092A\u0930\u093F\u0918",
    "\u0936\u093F\u0935",
    "\u0938\u093F\u0926\u094D\u0927",
    "\u0938\u093E\u0927\u094D\u092F",
    "\u0936\u0941\u092D",
    "\u0936\u0941\u0915\u094D\u0932",
    "\u092C\u094D\u0930\u0939\u094D\u092E",
    "\u0907\u0928\u094D\u0926\u094D\u0930",
    "\u0935\u0948\u0927\u0943\u0924\u093F"
  ],
  movableKaranas: ["\u092C\u0935", "\u092C\u093E\u0932\u0935", "\u0915\u094C\u0932\u0935", "\u0924\u0948\u0924\u093F\u0932", "\u0917\u0930", "\u0935\u0923\u093F\u091C", "\u0935\u093F\u0937\u094D\u091F\u093F"],
  signLords: [
    "\u092E\u0902\u0917\u0932",
    "\u0936\u0941\u0915\u094D\u0930",
    "\u092C\u0941\u0927",
    "\u091A\u0902\u0926\u094D\u0930",
    "\u0938\u0942\u0930\u094D\u092F",
    "\u092C\u0941\u0927",
    "\u0936\u0941\u0915\u094D\u0930",
    "\u092E\u0902\u0917\u0932",
    "\u0917\u0941\u0930\u0941",
    "\u0936\u0928\u093F",
    "\u0936\u0928\u093F",
    "\u0917\u0941\u0930\u0941"
  ],
  nakshatraLords: [
    "\u0915\u0947\u0924\u0941",
    "\u0936\u0941\u0915\u094D\u0930",
    "\u0938\u0942\u0930\u094D\u092F",
    "\u091A\u0902\u0926\u094D\u0930",
    "\u092E\u0902\u0917\u0932",
    "\u0930\u093E\u0939\u0941",
    "\u0917\u0941\u0930\u0941",
    "\u0936\u0928\u093F",
    "\u092C\u0941\u0927"
  ],
  varas: [
    "",
    "\u0938\u094B\u092E\u0935\u093E\u0930",
    "\u092E\u0902\u0917\u0932\u0935\u093E\u0930",
    "\u092C\u0941\u0927\u0935\u093E\u0930",
    "\u0917\u0941\u0930\u0941\u0935\u093E\u0930",
    "\u0936\u0941\u0915\u094D\u0930\u0935\u093E\u0930",
    "\u0936\u0928\u093F\u0935\u093E\u0930",
    "\u0930\u0935\u093F\u0935\u093E\u0930"
  ],
  varaEnglish: [
    "",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ],
  samvatsaras: [
    "\u092A\u094D\u0930\u092D\u0935",
    "\u0935\u093F\u092D\u0935",
    "\u0936\u0941\u0915\u094D\u0932",
    "\u092A\u094D\u0930\u092E\u094B\u0926",
    "\u092A\u094D\u0930\u091C\u093E\u092A\u0924\u093F",
    "\u0906\u0902\u0917\u093F\u0930",
    "\u0936\u094D\u0930\u0940\u092E\u0941\u0916",
    "\u092D\u093E\u0935",
    "\u092F\u0941\u0935\u093E",
    "\u0927\u093E\u0924\u093E",
    "\u0908\u0936\u094D\u0935\u0930",
    "\u092C\u0939\u0941\u0927\u093E\u0928\u094D\u092F",
    "\u092A\u094D\u0930\u092E\u093E\u0925\u0940",
    "\u0935\u093F\u0915\u094D\u0930\u092E",
    "\u0935\u0943\u0937",
    "\u091A\u093F\u0924\u094D\u0930\u092D\u093E\u0928\u0941",
    "\u0938\u094D\u0935\u092D\u093E\u0928\u0941",
    "\u0924\u093E\u0930\u0923",
    "\u092A\u093E\u0930\u094D\u0925\u093F\u0935",
    "\u0935\u094D\u092F\u092F",
    "\u0938\u0930\u094D\u0935\u091C\u093F\u0924\u094D",
    "\u0938\u0930\u094D\u0935\u0927\u093E\u0930\u0940",
    "\u0935\u093F\u0930\u094B\u0927\u0940",
    "\u0935\u093F\u0915\u0943\u0924\u093F",
    "\u0916\u0930",
    "\u0928\u0902\u0926\u0928",
    "\u0935\u093F\u091C\u092F",
    "\u091C\u092F",
    "\u092E\u0928\u094D\u092E\u0925",
    "\u0926\u0941\u0930\u094D\u092E\u0941\u0916",
    "\u0939\u0947\u0935\u093F\u0932\u092E\u094D\u092C\u093F",
    "\u0935\u093F\u0932\u092E\u094D\u092C\u093F",
    "\u0935\u093F\u0915\u093E\u0930\u0940",
    "\u0936\u093E\u0930\u094D\u0935\u0930\u0940",
    "\u092A\u094D\u0932\u0935",
    "\u0936\u0941\u092D\u0915\u0943\u0924",
    "\u0936\u094B\u092D\u0915\u0943\u0924",
    "\u0915\u094D\u0930\u094B\u0927\u0940",
    "\u0935\u093F\u0936\u094D\u0935\u093E\u0935\u0938\u0941",
    "\u092A\u0930\u093E\u092D\u0935",
    "\u092A\u094D\u0932\u0935\u0902\u0917",
    "\u0915\u0940\u0932\u0915",
    "\u0938\u094C\u092E\u094D\u092F",
    "\u0938\u093E\u0927\u093E\u0930\u0923",
    "\u0935\u093F\u0930\u094B\u0927\u093F\u0915\u0943\u0924",
    "\u092A\u0930\u093F\u0927\u093E\u0935\u0940",
    "\u092A\u094D\u0930\u092E\u093E\u0926\u0940",
    "\u0906\u0928\u0902\u0926",
    "\u0930\u093E\u0915\u094D\u0937\u0938",
    "\u0928\u0932",
    "\u092A\u093F\u0902\u0917\u0932",
    "\u0915\u0932\u092F\u0941\u0915\u094D\u0924",
    "\u0938\u093F\u0926\u094D\u0927\u093E\u0930\u094D\u0925\u0940",
    "\u0930\u094C\u0926\u094D\u0930",
    "\u0926\u0941\u0930\u094D\u092E\u0924\u093F",
    "\u0926\u0941\u0902\u0926\u0941\u092D\u093F",
    "\u0930\u0941\u0927\u093F\u0930\u094B\u0926\u094D\u0917\u093E\u0930\u0940",
    "\u0930\u0915\u094D\u0924\u093E\u0915\u094D\u0937\u0940",
    "\u0915\u094D\u0930\u094B\u0927\u0928",
    "\u0905\u0915\u094D\u0937\u092F"
  ],
  chandraMasa: [
    "\u091A\u0948\u0924\u094D\u0930",
    "\u0935\u0948\u0936\u093E\u0916",
    "\u091C\u094D\u092F\u0947\u0937\u094D\u0920",
    "\u0906\u0937\u093E\u0922\u093C",
    "\u0936\u094D\u0930\u093E\u0935\u0923",
    "\u092D\u093E\u0926\u094D\u0930\u092A\u0926",
    "\u0906\u0936\u094D\u0935\u093F\u0928",
    "\u0915\u093E\u0930\u094D\u0924\u093F\u0915",
    "\u092E\u093E\u0930\u094D\u0917\u0936\u0940\u0930\u094D\u0937",
    "\u092A\u094C\u0937",
    "\u092E\u093E\u0918",
    "\u092B\u093E\u0932\u094D\u0917\u0941\u0928"
  ],
  vargaNames: {
    1: "\u0930\u093E\u0936\u093F",
    2: "\u0939\u094B\u0930\u093E",
    3: "\u0926\u094D\u0930\u0947\u0937\u094D\u0915\u093E\u0923",
    4: "\u091A\u0924\u0941\u0930\u094D\u0925\u093E\u0902\u0936",
    7: "\u0938\u092A\u094D\u0924\u092E\u093E\u0902\u0936",
    9: "\u0928\u0935\u092E\u093E\u0902\u0936",
    10: "\u0926\u0936\u092E\u093E\u0902\u0936",
    11: "\u0930\u0941\u0926\u094D\u0930\u093E\u0902\u0936",
    12: "\u0926\u094D\u0935\u093E\u0926\u0936\u093E\u0902\u0936",
    16: "\u0937\u094B\u0921\u0936\u093E\u0902\u0936",
    20: "\u0935\u093F\u0902\u0936\u093E\u0902\u0936",
    24: "\u091A\u0924\u0941\u0930\u094D\u0935\u093F\u0902\u0936\u093E\u0902\u0936",
    27: "\u0928\u0915\u094D\u0937\u0924\u094D\u0930\u093E\u0902\u0936 (\u092D\u093E\u0902\u0936)",
    30: "\u0924\u094D\u0930\u093F\u0902\u0936\u093E\u0902\u0936",
    40: "\u0916\u0935\u0947\u0926\u093E\u0902\u0936",
    45: "\u0905\u0915\u094D\u0937\u0935\u0947\u0926\u093E\u0902\u0936",
    60: "\u0937\u0937\u094D\u091F\u094D\u092F\u093E\u0902\u0936"
  },
  vargaSubtitles: {
    1: "\u0936\u0930\u0940\u0930",
    2: "\u0927\u0928",
    3: "\u0938\u093E\u0939\u0938 / \u092D\u093E\u0908-\u092C\u0939\u0928",
    4: "\u092D\u093E\u0917\u094D\u092F / \u0917\u0943\u0939",
    7: "\u0938\u0902\u0924\u093E\u0928",
    9: "\u091C\u0940\u0935\u0928\u0938\u093E\u0925\u0940 / \u0927\u0930\u094D\u092E",
    10: "\u0915\u0948\u0930\u093F\u092F\u0930 / \u0909\u092A\u0932\u092C\u094D\u0927\u093F",
    11: "\u0932\u093E\u092D / \u0906\u092F",
    12: "\u092E\u093E\u0924\u093E-\u092A\u093F\u0924\u093E",
    16: "\u0935\u093E\u0939\u0928 / \u0938\u0941\u0916",
    20: "\u0906\u0927\u094D\u092F\u093E\u0924\u094D\u092E\u093F\u0915 \u092A\u094D\u0930\u0917\u0924\u093F",
    24: "\u0936\u093F\u0915\u094D\u0937\u093E / \u091C\u094D\u091E\u093E\u0928",
    27: "\u0936\u0915\u094D\u0924\u093F / \u0926\u0941\u0930\u094D\u092C\u0932\u0924\u093E",
    30: "\u0905\u0936\u0941\u092D / \u092C\u093E\u0927\u093E",
    40: "\u092E\u093E\u0924\u0943 \u092A\u0915\u094D\u0937",
    45: "\u092A\u093F\u0924\u0943 \u092A\u0915\u094D\u0937",
    60: "\u092A\u0942\u0930\u094D\u0935\u091C\u0928\u094D\u092E \u0915\u093E \u0915\u0930\u094D\u092E"
  },
  gowriNames: [
    "\u0938\u094B\u0930\u092E\u094D",
    "\u0909\u0925\u093F",
    "\u0935\u093F\u0937\u092E\u094D",
    "\u0905\u092E\u0943\u0924",
    "\u0930\u094B\u0917\u092E\u094D",
    "\u0932\u093E\u092D\u092E\u094D",
    "\u0927\u0928\u092E\u094D",
    "\u0938\u0941\u0917\u092E\u094D"
  ],
  karakaTitles: ["AK", "AmK", "BK", "MK", "PK", "GK", "DK"],
  kalsarpaTypes: [
    "\u0905\u0928\u0902\u0924",
    "\u0915\u0941\u0932\u093F\u0915",
    "\u0935\u093E\u0938\u0941\u0915\u0940",
    "\u0936\u0902\u0916\u092A\u093E\u0932",
    "\u092A\u0926\u094D\u092E",
    "\u092E\u0939\u093E\u092A\u0926\u094D\u092E",
    "\u0924\u0915\u094D\u0937\u0915",
    "\u0915\u0930\u094D\u0915\u094B\u091F\u0915",
    "\u0936\u0902\u0916\u091A\u0942\u0921\u093C",
    "\u0918\u093E\u0924\u0915",
    "\u0935\u093F\u0937\u0915\u094D\u0924\u0915",
    "\u0936\u0947\u0937\u0928\u093E\u0917"
  ],
  drikRitu: [
    "\u0935\u0938\u0902\u0924",
    "\u0917\u094D\u0930\u0940\u0937\u094D\u092E",
    "\u0917\u094D\u0930\u0940\u0937\u094D\u092E",
    "\u0935\u0930\u094D\u0937\u093E",
    "\u0935\u0930\u094D\u0937\u093E",
    "\u0936\u0930\u0926",
    "\u0936\u0930\u0926",
    "\u0939\u0947\u092E\u0902\u0924",
    "\u0939\u0947\u092E\u0902\u0924",
    "\u0936\u093F\u0936\u093F\u0930",
    "\u0936\u093F\u0936\u093F\u0930",
    "\u0935\u0938\u0902\u0924"
  ],
  vedicRitu: [
    "\u0935\u0938\u0902\u0924",
    "\u0917\u094D\u0930\u0940\u0937\u094D\u092E",
    "\u0917\u094D\u0930\u0940\u0937\u094D\u092E",
    "\u0935\u0930\u094D\u0937\u093E",
    "\u0935\u0930\u094D\u0937\u093E",
    "\u0936\u0930\u0926",
    "\u0936\u0930\u0926",
    "\u0939\u0947\u092E\u0902\u0924",
    "\u0939\u0947\u092E\u0902\u0924",
    "\u0936\u093F\u0936\u093F\u0930",
    "\u0936\u093F\u0936\u093F\u0930",
    "\u0935\u0938\u0902\u0924"
  ],
  directions: [
    "\u092A\u0942\u0930\u094D\u0935",
    "\u0905\u0917\u094D\u0928\u093F",
    "\u0926\u0915\u094D\u0937\u093F\u0923",
    "\u0928\u0948\u090B\u0924\u094D\u092F",
    "\u092A\u0936\u094D\u091A\u093F\u092E",
    "\u0935\u093E\u092F\u0935\u094D\u092F",
    "\u0909\u0924\u094D\u0924\u0930",
    "\u0908\u0936\u093E\u0928"
  ],
  nirayanaMonths: [
    "\u0935\u0948\u0936\u093E\u0916",
    "\u091C\u094D\u092F\u0947\u0937\u094D\u0920",
    "\u0906\u0937\u093E\u0922\u093C",
    "\u0936\u094D\u0930\u093E\u0935\u0923",
    "\u092D\u093E\u0926\u094D\u0930\u092A\u0926",
    "\u0906\u0936\u094D\u0935\u093F\u0928",
    "\u0915\u093E\u0930\u094D\u0924\u093F\u0915",
    "\u092E\u093E\u0930\u094D\u0917\u0936\u0940\u0930\u094D\u0937",
    "\u092A\u094C\u0937",
    "\u092E\u093E\u0918",
    "\u092B\u093E\u0932\u094D\u0917\u0941\u0928",
    "\u091A\u0948\u0924\u094D\u0930"
  ],
  shakaMonths: [
    "\u091A\u0948\u0924\u094D\u0930",
    "\u0935\u0948\u0936\u093E\u0916",
    "\u091C\u094D\u092F\u0947\u0937\u094D\u0920",
    "\u0906\u0937\u093E\u0922\u093C",
    "\u0936\u094D\u0930\u093E\u0935\u0923",
    "\u092D\u093E\u0926\u094D\u0930\u092A\u0926",
    "\u0906\u0936\u094D\u0935\u093F\u0928",
    "\u0915\u093E\u0930\u094D\u0924\u093F\u0915",
    "\u092E\u093E\u0930\u094D\u0917\u0936\u0940\u0930\u094D\u0937",
    "\u092A\u094C\u0937",
    "\u092E\u093E\u0918",
    "\u092B\u093E\u0932\u094D\u0917\u0941\u0928"
  ]
};
var hi_default = locale2;

// src/locales/ta.ts
var locale3 = {
  code: "ta",
  label: "\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD",
  nakshatras: [
    "\u0B85\u0BB8\u0BCD\u0BB5\u0BBF\u0BA9\u0BBF",
    "\u0BAA\u0BB0\u0BA3\u0BBF",
    "\u0B95\u0BBE\u0BB0\u0BCD\u0BA4\u0BCD\u0BA4\u0BBF\u0B95\u0BC8",
    "\u0BB0\u0BCB\u0B95\u0BBF\u0BA3\u0BBF",
    "\u0BAE\u0BBF\u0BB0\u0BC1\u0B95\u0B9A\u0BC0\u0BB0\u0BBF\u0B9F\u0BAE\u0BCD",
    "\u0BA4\u0BBF\u0BB0\u0BC1\u0BB5\u0BBE\u0BA4\u0BBF\u0BB0\u0BC8",
    "\u0BAA\u0BC1\u0BA9\u0BB0\u0BCD\u0BAA\u0BC2\u0B9A\u0BAE\u0BCD",
    "\u0BAA\u0BC2\u0B9A\u0BAE\u0BCD",
    "\u0B86\u0BAF\u0BBF\u0BB2\u0BCD\u0BAF\u0BAE\u0BCD",
    "\u0BAE\u0B95\u0BAE\u0BCD",
    "\u0BAA\u0BC2\u0BB0\u0BAE\u0BCD",
    "\u0B89\u0BA4\u0BCD\u0BA4\u0BBF\u0BB0\u0BAE\u0BCD",
    "\u0BB9\u0BB8\u0BCD\u0BA4\u0BAE\u0BCD",
    "\u0B9A\u0BBF\u0BA4\u0BCD\u0BA4\u0BBF\u0BB0\u0BC8",
    "\u0B9A\u0BC1\u0BB5\u0BBE\u0BA4\u0BBF",
    "\u0BB5\u0BBF\u0B9A\u0BBE\u0B95\u0BAE\u0BCD",
    "\u0B85\u0BA9\u0BC1\u0BB7\u0BAE\u0BCD",
    "\u0B95\u0BC7\u0B9F\u0BCD\u0B9F\u0BC8",
    "\u0BAE\u0BC2\u0BB2\u0BAE\u0BCD",
    "\u0BAA\u0BC2\u0BB0\u0BBE\u0B9F\u0BAE\u0BCD",
    "\u0B89\u0BA4\u0BCD\u0BA4\u0BBF\u0BB0\u0BBE\u0B9F\u0BAE\u0BCD",
    "\u0BA4\u0BBF\u0BB0\u0BC1\u0BB5\u0BCB\u0BA3\u0BAE\u0BCD",
    "\u0B85\u0BB5\u0BBF\u0B9F\u0BCD\u0B9F\u0BAE\u0BCD",
    "\u0B9A\u0BA4\u0BAF\u0BAE\u0BCD",
    "\u0BAA\u0BC2\u0BB0\u0B9F\u0BCD\u0B9F\u0BBE\u0BA4\u0BBF",
    "\u0B89\u0BA4\u0BCD\u0BA4\u0BBF\u0BB0\u0B9F\u0BCD\u0B9F\u0BBE\u0BA4\u0BBF",
    "\u0BB0\u0BC7\u0BB5\u0BA4\u0BBF"
  ],
  tithis: [
    "",
    "\u0BAA\u0BBF\u0BB0\u0BA4\u0BAE\u0BC8",
    "\u0BA4\u0BC1\u0BB5\u0BBF\u0BA4\u0BBF\u0BAF\u0BC8",
    "\u0BA4\u0BBF\u0BB0\u0BC1\u0BA4\u0BBF\u0BAF\u0BC8",
    "\u0B9A\u0BA4\u0BC1\u0BB0\u0BCD\u0BA4\u0BCD\u0BA4\u0BBF",
    "\u0BAA\u0B9E\u0BCD\u0B9A\u0BAE\u0BBF",
    "\u0B9A\u0BB7\u0BCD\u0B9F\u0BBF",
    "\u0B9A\u0BAA\u0BCD\u0BA4\u0BAE\u0BBF",
    "\u0B85\u0BB7\u0BCD\u0B9F\u0BAE\u0BBF",
    "\u0BA8\u0BB5\u0BAE\u0BBF",
    "\u0BA4\u0B9A\u0BAE\u0BBF",
    "\u0B8F\u0B95\u0BBE\u0BA4\u0B9A\u0BBF",
    "\u0BA4\u0BC1\u0BB5\u0BBE\u0BA4\u0B9A\u0BBF",
    "\u0BA4\u0BBF\u0BB0\u0BAF\u0BCB\u0BA4\u0B9A\u0BBF",
    "\u0B9A\u0BA4\u0BC1\u0BB0\u0BCD\u0BA4\u0BCD\u0BA4\u0B9A\u0BBF",
    "\u0BAA\u0BCC\u0BB0\u0BCD\u0BA3\u0BAE\u0BBF",
    "\u0BAA\u0BBF\u0BB0\u0BA4\u0BAE\u0BC8",
    "\u0BA4\u0BC1\u0BB5\u0BBF\u0BA4\u0BBF\u0BAF\u0BC8",
    "\u0BA4\u0BBF\u0BB0\u0BC1\u0BA4\u0BBF\u0BAF\u0BC8",
    "\u0B9A\u0BA4\u0BC1\u0BB0\u0BCD\u0BA4\u0BCD\u0BA4\u0BBF",
    "\u0BAA\u0B9E\u0BCD\u0B9A\u0BAE\u0BBF",
    "\u0B9A\u0BB7\u0BCD\u0B9F\u0BBF",
    "\u0B9A\u0BAA\u0BCD\u0BA4\u0BAE\u0BBF",
    "\u0B85\u0BB7\u0BCD\u0B9F\u0BAE\u0BBF",
    "\u0BA8\u0BB5\u0BAE\u0BBF",
    "\u0BA4\u0B9A\u0BAE\u0BBF",
    "\u0B8F\u0B95\u0BBE\u0BA4\u0B9A\u0BBF",
    "\u0BA4\u0BC1\u0BB5\u0BBE\u0BA4\u0B9A\u0BBF",
    "\u0BA4\u0BBF\u0BB0\u0BAF\u0BCB\u0BA4\u0B9A\u0BBF",
    "\u0B85\u0BAE\u0BBE\u0BB5\u0BBE\u0B9A\u0BC8"
  ],
  rashis: [
    "\u0BAE\u0BC7\u0BB7\u0BAE\u0BCD",
    "\u0BB0\u0BBF\u0BB7\u0BAA\u0BAE\u0BCD",
    "\u0BAE\u0BBF\u0BA4\u0BC1\u0BA9\u0BAE\u0BCD",
    "\u0B95\u0B9F\u0B95\u0BAE\u0BCD",
    "\u0B9A\u0BBF\u0BAE\u0BCD\u0BAE\u0BAE\u0BCD",
    "\u0B95\u0BA9\u0BCD\u0BA9\u0BBF",
    "\u0BA4\u0BC1\u0BB2\u0BBE\u0BAE\u0BCD",
    "\u0BB5\u0BBF\u0BB0\u0BC1\u0B9A\u0BCD\u0B9A\u0BBF\u0B95\u0BAE\u0BCD",
    "\u0BA4\u0BA9\u0BC1\u0B9A\u0BC1",
    "\u0BAE\u0B95\u0BB0\u0BAE\u0BCD",
    "\u0B95\u0BC1\u0BAE\u0BCD\u0BAA\u0BAE\u0BCD",
    "\u0BAE\u0BC0\u0BA9\u0BAE\u0BCD"
  ],
  signs: [
    "\u0BAE\u0BC7\u0BB7\u0BAE\u0BCD",
    "\u0BB0\u0BBF\u0BB7\u0BAA\u0BAE\u0BCD",
    "\u0BAE\u0BBF\u0BA4\u0BC1\u0BA9\u0BAE\u0BCD",
    "\u0B95\u0B9F\u0B95\u0BAE\u0BCD",
    "\u0B9A\u0BBF\u0BAE\u0BCD\u0BAE\u0BAE\u0BCD",
    "\u0B95\u0BA9\u0BCD\u0BA9\u0BBF",
    "\u0BA4\u0BC1\u0BB2\u0BBE\u0BAE\u0BCD",
    "\u0BB5\u0BBF\u0BB0\u0BC1\u0B9A\u0BCD\u0B9A\u0BBF\u0B95\u0BAE\u0BCD",
    "\u0BA4\u0BA9\u0BC1\u0B9A\u0BC1",
    "\u0BAE\u0B95\u0BB0\u0BAE\u0BCD",
    "\u0B95\u0BC1\u0BAE\u0BCD\u0BAA\u0BAE\u0BCD",
    "\u0BAE\u0BC0\u0BA9\u0BAE\u0BCD"
  ],
  yogas: [
    "\u0BB5\u0BBF\u0BB7\u0BCD\u0B95\u0BC1\u0BAE\u0BCD\u0BAA\u0BAE\u0BCD",
    "\u0BAA\u0BCD\u0BB0\u0BC0\u0BA4\u0BBF",
    "\u0B86\u0BAF\u0BC1\u0BB7\u0BCD\u0BAE\u0BBE\u0BA9\u0BCD",
    "\u0B9A\u0BCC\u0BAA\u0BBE\u0B95\u0BCD\u0B95\u0BBF\u0BAF\u0BAE\u0BCD",
    "\u0B9A\u0BCB\u0BAA\u0BA9\u0BAE\u0BCD",
    "\u0B85\u0BA4\u0BBF\u0B95\u0BA3\u0BCD\u0B9F\u0BAE\u0BCD",
    "\u0B9A\u0BC1\u0B95\u0BB0\u0BCD\u0BAE\u0BAE\u0BCD",
    "\u0BA4\u0BCD\u0BB0\u0BC1\u0BA4\u0BBF",
    "\u0B9A\u0BC2\u0BB2\u0BAE\u0BCD",
    "\u0B95\u0BA3\u0BCD\u0B9F\u0BAE\u0BCD",
    "\u0BB5\u0BBF\u0BB0\u0BC1\u0BA4\u0BCD\u0BA4\u0BBF",
    "\u0BA4\u0BC1\u0BB0\u0BC1\u0BB5\u0BAE\u0BCD",
    "\u0BB5\u0BBF\u0BAF\u0BBE\u0B95\u0BBE\u0BA4\u0BAE\u0BCD",
    "\u0BB9\u0BB0\u0BCD\u0BB7\u0BA3\u0BAE\u0BCD",
    "\u0BB5\u0B9C\u0BCD\u0BB0\u0BAE\u0BCD",
    "\u0B9A\u0BBF\u0BA4\u0BCD\u0BA4\u0BBF",
    "\u0BB5\u0BBF\u0BAF\u0BA4\u0BBF\u0BAA\u0BBE\u0BA4\u0BAE\u0BCD",
    "\u0BB5\u0BB0\u0BBF\u0BAF\u0BBE\u0BA9\u0BCD",
    "\u0BAA\u0BB0\u0BBF\u0B95\u0BAE\u0BCD",
    "\u0B9A\u0BBF\u0BB5\u0BAE\u0BCD",
    "\u0B9A\u0BBF\u0BA4\u0BCD\u0BA4\u0BAE\u0BCD",
    "\u0B9A\u0BBE\u0BA4\u0BCD\u0BA4\u0BBF\u0BAF\u0BAE\u0BCD",
    "\u0B9A\u0BC1\u0BAA\u0BAE\u0BCD",
    "\u0B9A\u0BC1\u0B95\u0BCD\u0BB2\u0BAE\u0BCD",
    "\u0BAA\u0BBF\u0BB0\u0BAE\u0BCD\u0BAE\u0BAE\u0BCD",
    "\u0B87\u0BA8\u0BCD\u0BA4\u0BBF\u0BB0\u0BAE\u0BCD",
    "\u0BB5\u0BC8\u0BA4\u0BCD\u0BB0\u0BC1\u0BA4\u0BBF"
  ],
  movableKaranas: ["\u0BAA\u0BB5", "\u0BAA\u0BBE\u0BB2\u0BB5", "\u0B95\u0BCC\u0BB2\u0BB5", "\u0BA4\u0BC8\u0BA4\u0BBF\u0BB2", "\u0B95\u0BB0", "\u0BB5\u0BA3\u0BBF\u0B9C", "\u0BB5\u0BBF\u0BB7\u0BCD\u0B9F\u0BBF"],
  signLords: [
    "\u0B9A\u0BC6\u0BB5\u0BCD\u0BB5\u0BBE\u0BAF\u0BCD",
    "\u0B9A\u0BC1\u0B95\u0BCD\u0B95\u0BBF\u0BB0\u0BA9\u0BCD",
    "\u0BAA\u0BC1\u0BA4\u0BA9\u0BCD",
    "\u0B9A\u0BA8\u0BCD\u0BA4\u0BBF\u0BB0\u0BA9\u0BCD",
    "\u0B9A\u0BC2\u0BB0\u0BBF\u0BAF\u0BA9\u0BCD",
    "\u0BAA\u0BC1\u0BA4\u0BA9\u0BCD",
    "\u0B9A\u0BC1\u0B95\u0BCD\u0B95\u0BBF\u0BB0\u0BA9\u0BCD",
    "\u0B9A\u0BC6\u0BB5\u0BCD\u0BB5\u0BBE\u0BAF\u0BCD",
    "\u0B95\u0BC1\u0BB0\u0BC1",
    "\u0B9A\u0BA9\u0BBF",
    "\u0B9A\u0BA9\u0BBF",
    "\u0B95\u0BC1\u0BB0\u0BC1"
  ],
  nakshatraLords: [
    "\u0B95\u0BC7\u0BA4\u0BC1",
    "\u0B9A\u0BC1\u0B95\u0BCD\u0B95\u0BBF\u0BB0\u0BA9\u0BCD",
    "\u0B9A\u0BC2\u0BB0\u0BBF\u0BAF\u0BA9\u0BCD",
    "\u0B9A\u0BA8\u0BCD\u0BA4\u0BBF\u0BB0\u0BA9\u0BCD",
    "\u0B9A\u0BC6\u0BB5\u0BCD\u0BB5\u0BBE\u0BAF\u0BCD",
    "\u0BB0\u0BBE\u0B95\u0BC1",
    "\u0B95\u0BC1\u0BB0\u0BC1",
    "\u0B9A\u0BA9\u0BBF",
    "\u0BAA\u0BC1\u0BA4\u0BA9\u0BCD"
  ],
  varas: [
    "",
    "\u0B9A\u0BCB\u0BAE\u0BB5\u0BBE\u0BB0\u0BAE\u0BCD",
    "\u0BAE\u0B99\u0BCD\u0B95\u0BB3\u0BB5\u0BBE\u0BB0\u0BAE\u0BCD",
    "\u0BAA\u0BC1\u0BA4\u0BB5\u0BBE\u0BB0\u0BAE\u0BCD",
    "\u0B95\u0BC1\u0BB0\u0BC1\u0BB5\u0BBE\u0BB0\u0BAE\u0BCD",
    "\u0B9A\u0BC1\u0B95\u0BCD\u0B95\u0BBF\u0BB0\u0BB5\u0BBE\u0BB0\u0BAE\u0BCD",
    "\u0B9A\u0BA9\u0BBF\u0BB5\u0BBE\u0BB0\u0BAE\u0BCD",
    "\u0B9E\u0BBE\u0BAF\u0BBF\u0BB1\u0BCD\u0BB1\u0BC1\u0B95\u0BCD\u0B95\u0BBF\u0BB4\u0BAE\u0BC8"
  ],
  varaEnglish: [
    "",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ],
  samvatsaras: [
    "\u0BAA\u0BBF\u0BB0\u0BAA\u0BB5",
    "\u0BB5\u0BBF\u0BAA\u0BB5",
    "\u0B9A\u0BC1\u0B95\u0BCD\u0B95\u0BBF\u0BB2",
    "\u0BAA\u0BBF\u0BB0\u0BAE\u0BCB\u0BA4",
    "\u0BAA\u0BBF\u0BB0\u0B9A\u0BBE\u0BAA\u0BA4\u0BBF",
    "\u0B86\u0B99\u0BCD\u0B95\u0BBF\u0BB0",
    "\u0B9A\u0BBF\u0BB1\u0BC0\u0BAE\u0BC1\u0B95",
    "\u0BAA\u0BBE\u0BB5",
    "\u0BAF\u0BC1\u0BB5",
    "\u0BA4\u0BBE\u0BA4\u0BC1",
    "\u0B88\u0B9A\u0BC1\u0BB5\u0BB0",
    "\u0BAA\u0B95\u0BC1\u0BA4\u0BBE\u0BA9\u0BBF\u0BAF",
    "\u0BAA\u0BBF\u0BB0\u0BAE\u0BBE\u0BA4\u0BCD\u0BA4\u0BBF",
    "\u0BB5\u0BBF\u0B95\u0BCD\u0B95\u0BBF\u0BB0\u0BAE",
    "\u0BB5\u0BBF\u0BB0\u0BC1\u0B9A",
    "\u0B9A\u0BBF\u0BA4\u0BCD\u0BA4\u0BBF\u0BB0\u0BAA\u0BBE\u0BA9\u0BC1",
    "\u0B9A\u0BC1\u0BAA\u0BBE\u0BA9\u0BC1",
    "\u0BA4\u0BBE\u0BB0\u0BA3",
    "\u0BAA\u0BBE\u0BB0\u0BCD\u0BA4\u0BCD\u0BA4\u0BBF\u0BB5",
    "\u0BB5\u0BBF\u0BAF\u0BAF",
    "\u0B9A\u0BB0\u0BCD\u0BB5\u0B9A\u0BBF\u0BA4\u0BCD\u0BA4\u0BC1",
    "\u0B9A\u0BB0\u0BCD\u0BB5\u0BA4\u0BBE\u0BB0\u0BBF",
    "\u0BB5\u0BBF\u0BB0\u0BCB\u0BA4\u0BBF",
    "\u0BB5\u0BBF\u0B95\u0BBF\u0BB0\u0BC1\u0BA4\u0BBF",
    "\u0B95\u0BB0",
    "\u0BA8\u0BA8\u0BCD\u0BA4\u0BA9",
    "\u0BB5\u0BBF\u0B9A\u0BAF",
    "\u0B9A\u0BAF",
    "\u0BAE\u0BA9\u0BCD\u0BAE\u0BA4",
    "\u0BA4\u0BC1\u0BB0\u0BCD\u0BAE\u0BC1\u0B95",
    "\u0B8F\u0BAE\u0BB2\u0BAE\u0BCD\u0BAA",
    "\u0BB5\u0BBF\u0BB2\u0BAE\u0BCD\u0BAA",
    "\u0BB5\u0BBF\u0B95\u0BBE\u0BB0\u0BBF",
    "\u0B9A\u0BBE\u0BB0\u0BCD\u0BB5\u0BB0\u0BBF",
    "\u0BAA\u0BB2\u0BB5",
    "\u0B9A\u0BC1\u0BAA\u0B95\u0BBF\u0BB0\u0BC1\u0BA4\u0BC1",
    "\u0B9A\u0BCB\u0BAA\u0B95\u0BBF\u0BB0\u0BC1\u0BA4\u0BC1",
    "\u0B95\u0BBF\u0BB0\u0BCB\u0BA4\u0BBF",
    "\u0BB5\u0BBF\u0B9A\u0BC1\u0BB5\u0BBE\u0B9A\u0BC1",
    "\u0BAA\u0BB0\u0BBF\u0BAA\u0BB5",
    "\u0BAA\u0BBF\u0BB2\u0BB5\u0B99\u0BCD\u0B95",
    "\u0B95\u0BC0\u0BB2\u0B95",
    "\u0B9A\u0BCC\u0BAE\u0BBF\u0BAF",
    "\u0B9A\u0BBE\u0BA4\u0BBE\u0BB0\u0BA3",
    "\u0BB5\u0BBF\u0BB0\u0BCB\u0BA4\u0BBF\u0B95\u0BBF\u0BB0\u0BC1\u0BA4\u0BC1",
    "\u0BAA\u0BB0\u0BBF\u0BA4\u0BBE\u0BB5\u0BBF",
    "\u0BAA\u0BBF\u0BB0\u0BAE\u0BBE\u0BA4\u0BBF",
    "\u0B86\u0BA9\u0BA8\u0BCD\u0BA4",
    "\u0BB0\u0BBE\u0B9F\u0BCD\u0B9A\u0B9A",
    "\u0BA8\u0BB3",
    "\u0BAA\u0BBF\u0B99\u0BCD\u0B95\u0BB2",
    "\u0B95\u0BB2\u0BAF\u0BC1\u0B95\u0BCD\u0BA4",
    "\u0B9A\u0BBF\u0BA4\u0BCD\u0BA4\u0BBE\u0BB0\u0BCD\u0BA4\u0BCD\u0BA4\u0BBF",
    "\u0BB0\u0BCC\u0BA4\u0BCD\u0BB0",
    "\u0BA4\u0BC1\u0BB0\u0BCD\u0BAE\u0BA4\u0BBF",
    "\u0BA4\u0BC1\u0BA8\u0BCD\u0BA4\u0BC1\u0BAA\u0BBF",
    "\u0BB0\u0BC1\u0BA4\u0BBF\u0BB0\u0BCB\u0BA4\u0BCD\u0B95\u0BBE\u0BB0\u0BBF",
    "\u0BB0\u0B95\u0BCD\u0BA4\u0BBE\u0B95\u0BCD\u0BB7\u0BBF",
    "\u0B95\u0BCD\u0BB0\u0BCB\u0BA4\u0BA9",
    "\u0B85\u0B95\u0BCD\u0BB7\u0BAF"
  ],
  chandraMasa: [
    "\u0B9A\u0BBF\u0BA4\u0BCD\u0BA4\u0BBF\u0BB0\u0BC8",
    "\u0BB5\u0BC8\u0B95\u0BBE\u0B9A\u0BBF",
    "\u0B86\u0BA9\u0BBF",
    "\u0B86\u0B9F\u0BBF",
    "\u0B86\u0BB5\u0BA3\u0BBF",
    "\u0BAA\u0BC1\u0BB0\u0B9F\u0BCD\u0B9F\u0BBE\u0B9A\u0BBF",
    "\u0B90\u0BAA\u0BCD\u0BAA\u0B9A\u0BBF",
    "\u0B95\u0BBE\u0BB0\u0BCD\u0BA4\u0BCD\u0BA4\u0BBF\u0B95\u0BC8",
    "\u0BAE\u0BBE\u0BB0\u0BCD\u0B95\u0BB4\u0BBF",
    "\u0BA4\u0BC8",
    "\u0BAE\u0BBE\u0B9A\u0BBF",
    "\u0BAA\u0B99\u0BCD\u0B95\u0BC1\u0BA9\u0BBF"
  ],
  vargaNames: {
    1: "\u0BB0\u0BBE\u0B9A\u0BBF",
    2: "\u0BB9\u0BCB\u0BB0\u0BC8",
    3: "\u0BA4\u0BBF\u0BB0\u0BC7\u0B95\u0BCD\u0B95\u0BBE\u0BA3\u0BAE\u0BCD",
    4: "\u0B9A\u0BA4\u0BC1\u0BB0\u0BCD\u0BA4\u0BCD\u0BA4\u0BBE\u0BAE\u0BCD\u0B9A\u0BAE\u0BCD",
    7: "\u0B9A\u0BAA\u0BCD\u0BA4\u0BBE\u0BAE\u0BCD\u0B9A\u0BAE\u0BCD",
    9: "\u0BA8\u0BB5\u0BBE\u0BAE\u0BCD\u0B9A\u0BAE\u0BCD",
    10: "\u0BA4\u0B9A\u0BBE\u0BAE\u0BCD\u0B9A\u0BAE\u0BCD",
    11: "\u0BB0\u0BC1\u0BA4\u0BCD\u0BB0\u0BBE\u0BAE\u0BCD\u0B9A\u0BAE\u0BCD",
    12: "\u0BA4\u0BC1\u0BB5\u0BBE\u0BA4\u0B9A\u0BBE\u0BAE\u0BCD\u0B9A\u0BAE\u0BCD",
    16: "\u0B9A\u0BCB\u0B9F\u0B9A\u0BBE\u0BAE\u0BCD\u0B9A\u0BAE\u0BCD",
    20: "\u0BB5\u0BBF\u0BAE\u0BCD\u0B9A\u0BBE\u0BAE\u0BCD\u0B9A\u0BAE\u0BCD",
    24: "\u0B9A\u0BA4\u0BC1\u0BB0\u0BCD\u0BB5\u0BBF\u0BAE\u0BCD\u0B9A\u0BBE\u0BAE\u0BCD\u0B9A\u0BAE\u0BCD",
    27: "\u0BA8\u0B95\u0BCD\u0BB7\u0BA4\u0BCD\u0BB0\u0BBE\u0BAE\u0BCD\u0B9A\u0BAE\u0BCD (\u0BAA\u0BBE\u0BAE\u0BCD\u0B9A\u0BAE\u0BCD)",
    30: "\u0BA4\u0BBF\u0BB0\u0BBF\u0BAE\u0BCD\u0B9A\u0BBE\u0BAE\u0BCD\u0B9A\u0BAE\u0BCD",
    40: "\u0B95\u0BB5\u0BC7\u0BA4\u0BBE\u0BAE\u0BCD\u0B9A\u0BAE\u0BCD",
    45: "\u0B85\u0B95\u0BCD\u0BB7\u0BB5\u0BC7\u0BA4\u0BBE\u0BAE\u0BCD\u0B9A\u0BAE\u0BCD",
    60: "\u0BB7\u0BB7\u0BCD\u0B9F\u0BBF\u0BAF\u0BBE\u0BAE\u0BCD\u0B9A\u0BAE\u0BCD"
  },
  vargaSubtitles: {
    1: "\u0B89\u0B9F\u0BB2\u0BCD",
    2: "\u0B9A\u0BC6\u0BB2\u0BCD\u0BB5\u0BAE\u0BCD",
    3: "\u0BA4\u0BC8\u0BB0\u0BBF\u0BAF\u0BAE\u0BCD / \u0B9A\u0B95\u0BCB\u0BA4\u0BB0\u0BB0\u0BCD\u0B95\u0BB3\u0BCD",
    4: "\u0B85\u0BA4\u0BBF\u0BB0\u0BCD\u0BB7\u0BCD\u0B9F\u0BAE\u0BCD / \u0BB5\u0BC0\u0B9F\u0BC1",
    7: "\u0B95\u0BC1\u0BB4\u0BA8\u0BCD\u0BA4\u0BC8\u0B95\u0BB3\u0BCD",
    9: "\u0BAE\u0BA9\u0BC8\u0BB5\u0BBF / \u0BA4\u0BB0\u0BCD\u0BAE\u0BAE\u0BCD",
    10: "\u0BA4\u0BCA\u0BB4\u0BBF\u0BB2\u0BCD / \u0B89\u0BAF\u0BB0\u0BCD\u0BB5\u0BC1",
    11: "\u0BB2\u0BBE\u0BAA\u0BAE\u0BCD / \u0BB5\u0BB0\u0BC1\u0BB5\u0BBE\u0BAF\u0BCD",
    12: "\u0BAA\u0BC6\u0BB1\u0BCD\u0BB1\u0BCB\u0BB0\u0BCD",
    16: "\u0BB5\u0BBE\u0B95\u0BA9\u0BAE\u0BCD / \u0B9A\u0BC1\u0B95\u0B99\u0BCD\u0B95\u0BB3\u0BCD",
    20: "\u0B86\u0BA9\u0BCD\u0BAE\u0BC0\u0B95 \u0BAE\u0BC1\u0BA9\u0BCD\u0BA9\u0BC7\u0BB1\u0BCD\u0BB1\u0BAE\u0BCD",
    24: "\u0B95\u0BB2\u0BCD\u0BB5\u0BBF / \u0B85\u0BB1\u0BBF\u0BB5\u0BC1",
    27: "\u0BAA\u0BB2\u0BAE\u0BCD / \u0BAA\u0BB2\u0BB5\u0BC0\u0BA9\u0BAE\u0BCD",
    30: "\u0BA4\u0BC0\u0BAE\u0BC8 / \u0BA4\u0B9F\u0BC8\u0B95\u0BB3\u0BCD",
    40: "\u0BA4\u0BBE\u0BAF\u0BCD \u0BB5\u0BB4\u0BBF",
    45: "\u0BA4\u0BA8\u0BCD\u0BA4\u0BC8 \u0BB5\u0BB4\u0BBF",
    60: "\u0BAE\u0BC1\u0BA9\u0BCD\u0BB5\u0BBF\u0BA9\u0BC8 \u0B95\u0BB0\u0BCD\u0BAE\u0BBE"
  },
  gowriNames: [
    "\u0B9A\u0BCB\u0BB0\u0BAE\u0BCD",
    "\u0B89\u0BA4\u0BBF",
    "\u0BB5\u0BBF\u0BB7\u0BAE\u0BCD",
    "\u0B85\u0BAE\u0BBF\u0BB0\u0BCD\u0BA4\u0BC8",
    "\u0BB0\u0BCB\u0B95\u0BAE\u0BCD",
    "\u0BB2\u0BBE\u0BAA\u0BAE\u0BCD",
    "\u0BA4\u0BA9\u0BAE\u0BCD",
    "\u0B9A\u0BC1\u0B95\u0BAE\u0BCD"
  ],
  karakaTitles: ["AK", "AmK", "BK", "MK", "PK", "GK", "DK"],
  kalsarpaTypes: [
    "\u0B85\u0BA9\u0BA8\u0BCD\u0BA4",
    "\u0B95\u0BC1\u0BB2\u0BBF\u0B95",
    "\u0BB5\u0BBE\u0B9A\u0BC1\u0B95\u0BBF",
    "\u0B9A\u0B99\u0BCD\u0B95\u0BAA\u0BBE\u0BB2",
    "\u0BAA\u0BA4\u0BCD\u0BAE",
    "\u0BAE\u0B95\u0BBE\u0BAA\u0BA4\u0BCD\u0BAE",
    "\u0BA4\u0B95\u0BCD\u0B9A\u0B95",
    "\u0B95\u0BB0\u0BC1\u0B95\u0BCD\u0B95\u0BCB\u0B9F\u0B95",
    "\u0B9A\u0B99\u0BCD\u0B95\u0B9A\u0BC2\u0B9F",
    "\u0B95\u0BBE\u0BA4\u0B95",
    "\u0BB5\u0BBF\u0B9A\u0B95\u0BCD\u0BA4\u0B95",
    "\u0B9A\u0BC7\u0BB7\u0BA8\u0BBE\u0B95"
  ],
  drikRitu: [
    "\u0BB5\u0B9A\u0BA8\u0BCD\u0BA4",
    "\u0B95\u0BBF\u0BB0\u0BC0\u0BB7\u0BCD\u0BAE",
    "\u0B95\u0BBF\u0BB0\u0BC0\u0BB7\u0BCD\u0BAE",
    "\u0BB5\u0BB0\u0BCD\u0BB7",
    "\u0BB5\u0BB0\u0BCD\u0BB7",
    "\u0B9A\u0BB0\u0BA4\u0BCD",
    "\u0B9A\u0BB0\u0BA4\u0BCD",
    "\u0BB9\u0BC7\u0BAE\u0BA8\u0BCD\u0BA4",
    "\u0BB9\u0BC7\u0BAE\u0BA8\u0BCD\u0BA4",
    "\u0B9A\u0BBF\u0B9A\u0BBF\u0BB0",
    "\u0B9A\u0BBF\u0B9A\u0BBF\u0BB0",
    "\u0BB5\u0B9A\u0BA8\u0BCD\u0BA4"
  ],
  vedicRitu: [
    "\u0BB5\u0B9A\u0BA8\u0BCD\u0BA4",
    "\u0B95\u0BBF\u0BB0\u0BC0\u0BB7\u0BCD\u0BAE",
    "\u0B95\u0BBF\u0BB0\u0BC0\u0BB7\u0BCD\u0BAE",
    "\u0BB5\u0BB0\u0BCD\u0BB7",
    "\u0BB5\u0BB0\u0BCD\u0BB7",
    "\u0B9A\u0BB0\u0BA4\u0BCD",
    "\u0B9A\u0BB0\u0BA4\u0BCD",
    "\u0BB9\u0BC7\u0BAE\u0BA8\u0BCD\u0BA4",
    "\u0BB9\u0BC7\u0BAE\u0BA8\u0BCD\u0BA4",
    "\u0B9A\u0BBF\u0B9A\u0BBF\u0BB0",
    "\u0B9A\u0BBF\u0B9A\u0BBF\u0BB0",
    "\u0BB5\u0B9A\u0BA8\u0BCD\u0BA4"
  ],
  directions: [
    "\u0B95\u0BBF\u0BB4\u0B95\u0BCD\u0B95\u0BC1",
    "\u0BA4\u0BC6\u0BA9\u0BCD\u0B95\u0BBF\u0BB4\u0B95\u0BCD\u0B95\u0BC1",
    "\u0BA4\u0BC6\u0BB1\u0BCD\u0B95\u0BC1",
    "\u0BA4\u0BC6\u0BA9\u0BCD\u0BAE\u0BC7\u0BB1\u0BCD\u0B95\u0BC1",
    "\u0BAE\u0BC7\u0BB1\u0BCD\u0B95\u0BC1",
    "\u0BB5\u0B9F\u0BAE\u0BC7\u0BB1\u0BCD\u0B95\u0BC1",
    "\u0BB5\u0B9F\u0B95\u0BCD\u0B95\u0BC1",
    "\u0BB5\u0B9F\u0B95\u0BBF\u0BB4\u0B95\u0BCD\u0B95\u0BC1"
  ],
  nirayanaMonths: [
    "\u0BB5\u0BC8\u0B95\u0BBE\u0B9A\u0BBF",
    "\u0B86\u0BA9\u0BBF",
    "\u0B86\u0B9F\u0BBF",
    "\u0B86\u0BB5\u0BA3\u0BBF",
    "\u0BAA\u0BC1\u0BB0\u0B9F\u0BCD\u0B9F\u0BBE\u0B9A\u0BBF",
    "\u0B90\u0BAA\u0BCD\u0BAA\u0B9A\u0BBF",
    "\u0B95\u0BBE\u0BB0\u0BCD\u0BA4\u0BCD\u0BA4\u0BBF\u0B95\u0BC8",
    "\u0BAE\u0BBE\u0BB0\u0BCD\u0B95\u0BB4\u0BBF",
    "\u0BA4\u0BC8",
    "\u0BAE\u0BBE\u0B9A\u0BBF",
    "\u0BAA\u0B99\u0BCD\u0B95\u0BC1\u0BA9\u0BBF",
    "\u0B9A\u0BBF\u0BA4\u0BCD\u0BA4\u0BBF\u0BB0\u0BC8"
  ],
  shakaMonths: [
    "\u0B9A\u0BBF\u0BA4\u0BCD\u0BA4\u0BBF\u0BB0\u0BC8",
    "\u0BB5\u0BC8\u0B95\u0BBE\u0B9A\u0BBF",
    "\u0B86\u0BA9\u0BBF",
    "\u0B86\u0B9F\u0BBF",
    "\u0B86\u0BB5\u0BA3\u0BBF",
    "\u0BAA\u0BC1\u0BB0\u0B9F\u0BCD\u0B9F\u0BBE\u0B9A\u0BBF",
    "\u0B90\u0BAA\u0BCD\u0BAA\u0B9A\u0BBF",
    "\u0B95\u0BBE\u0BB0\u0BCD\u0BA4\u0BCD\u0BA4\u0BBF\u0B95\u0BC8",
    "\u0BAE\u0BBE\u0BB0\u0BCD\u0B95\u0BB4\u0BBF",
    "\u0BA4\u0BC8",
    "\u0BAE\u0BBE\u0B9A\u0BBF",
    "\u0BAA\u0B99\u0BCD\u0B95\u0BC1\u0BA9\u0BBF"
  ]
};
var ta_default = locale3;

// src/locales/index.ts
var TABLES = { en: en_default, hi: hi_default, ta: ta_default };
function getLocaleTable(locale4) {
  return TABLES[locale4];
}

// src/constants/panchang.ts
var NAK_SPAN = 360 / 27;
var RAHU_KAAL_SEGMENT = {
  1: 2,
  2: 7,
  3: 5,
  4: 6,
  5: 4,
  6: 3,
  7: 8
};
var YAMAGANDA_SEGMENT = {
  1: 4,
  2: 3,
  3: 2,
  4: 1,
  5: 7,
  6: 6,
  7: 5
};
var GULIKA_SEGMENT = {
  1: 6,
  2: 5,
  3: 4,
  4: 3,
  5: 2,
  6: 1,
  7: 7
};
var MOVABLE_KARANA_NAMES = [
  "Bava",
  "Balava",
  "Kaulava",
  "Taitila",
  "Gara",
  "Vanija",
  "Vishti"
];
function karanaName(halfIndex) {
  if (halfIndex === 0) return "Kimstughna";
  if (halfIndex >= 1 && halfIndex <= 56) {
    return MOVABLE_KARANA_NAMES[(halfIndex - 1) % 7];
  }
  if (halfIndex === 57) return "Shakuni";
  if (halfIndex === 58) return "Chatushpada";
  if (halfIndex === 59) return "Naga";
  return "Unknown";
}

// src/calculations/bisection.ts
function normDiff(diff) {
  diff = diff % 360;
  if (diff > 180) diff -= 360;
  if (diff <= -180) diff += 360;
  return diff;
}
function findAngleTime(lo, hi, targetDeg, angleFn) {
  const fLo = angleFn(lo);
  const fHi = angleFn(hi);
  const tg = (targetDeg % 360 + 360) % 360;
  if (Math.abs(normDiff(fLo - tg)) < 1e-10) return lo;
  if (Math.abs(normDiff(fHi - tg)) < 1e-10) return hi;
  const nLo = (fLo % 360 + 360) % 360;
  const nHi = (fHi % 360 + 360) % 360;
  const arcToTarget = (tg - nLo + 360) % 360;
  const arcToHi = nHi === nLo ? fHi > fLo + 1e-9 ? 360 : 0 : (nHi - nLo + 360) % 360;
  if (arcToHi < 1e-8) return null;
  if (arcToTarget > arcToHi) return null;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    const fMid = angleFn(mid);
    const diff = normDiff(tg - fMid);
    if (diff > 0) lo = mid;
    else hi = mid;
    if (hi - lo < 1e-10) break;
  }
  return (lo + hi) / 2;
}
function findAllCrossings(startJd, endJd, stepDeg, angleFn, currentAngle) {
  const results = [];
  const angle0 = currentAngle ?? angleFn(startJd);
  const norm0 = (angle0 % 360 + 360) % 360;
  const totalSteps = Math.round(360 / stepDeg);
  let curIdx = Math.floor(norm0 / stepDeg);
  let searchFrom = startJd;
  const sampleDelta = Math.max((endJd - startJd) / 100, 1e-4);
  const sampleAngle = angleFn(startJd + sampleDelta);
  const sampleAdv = (sampleAngle - angle0 + 360) % 360;
  const degPerJd = sampleAdv > 1e-6 ? sampleAdv / sampleDelta : 1;
  const jdPerStep = stepDeg / degPerJd;
  const subWindow = jdPerStep * 1.5;
  for (let iter = 0; iter < 400; iter++) {
    const nextIdx = (curIdx + 1) % totalSteps;
    const nextTarget = nextIdx * stepDeg;
    const searchEnd = Math.min(searchFrom + subWindow, endJd);
    const jd = findAngleTime(searchFrom, searchEnd, nextTarget, angleFn) ?? findAngleTime(searchFrom, endJd, nextTarget, angleFn);
    if (jd == null || jd > endJd) break;
    results.push({ jd, index: nextIdx });
    curIdx = nextIdx;
    searchFrom = jd + 1e-8;
  }
  return results;
}

// src/calculations/panchang.ts
function tithiIndex(sunLon, moonLon) {
  let diff = ((moonLon - sunLon) % 360 + 360) % 360;
  return Math.floor(diff / 12) + 1;
}
function nakshatraPada(lon) {
  const normLon = (lon % 360 + 360) % 360;
  const degInNak = normLon - Math.floor(normLon / NAK_SPAN) * NAK_SPAN;
  return Math.floor(degInNak / (NAK_SPAN / 4)) + 1;
}
function signIdFromLon(lon) {
  return Math.floor((lon % 360 + 360) % 360 / 30) + 1;
}
function degreeInSign(lon) {
  const n = (lon % 360 + 360) % 360;
  return n - Math.floor(n / 30) * 30;
}
function formatDms(deg) {
  const n = (deg % 360 + 360) % 360;
  const d = Math.floor(n);
  const mFull = (n - d) * 60;
  const m = Math.floor(mFull);
  let s = Math.round((mFull - m) * 60);
  if (s === 60) {
    s = 0;
  }
  return `${d.toString().padStart(2, "0")}\xB0 ${m.toString().padStart(2, "0")}' ${s.toString().padStart(2, "0")}"`;
}
function jdToIso(jd, ephe) {
  const [y, mo, d, hFrac] = ephe.revjul(jd);
  const h = Math.floor(hFrac);
  const mFull = (hFrac - h) * 60;
  const m = Math.floor(mFull);
  const sFull = (mFull - m) * 60;
  const s = Math.floor(sFull);
  const ms = Math.round((sFull - s) * 1e3);
  return `${y.toString().padStart(4, "0")}-${mo.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}T${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}Z`;
}
var SIDEREAL_FLAGS = () => SE.FLG_SWIEPH | SE.FLG_SPEED | SE.FLG_SIDEREAL;
function sunLonAt(jd, ephe) {
  return ephe.calcUt(jd, SE.SUN, SIDEREAL_FLAGS()).lon;
}
function moonLonAt(jd, ephe) {
  return ephe.calcUt(jd, SE.MOON, SIDEREAL_FLAGS()).lon;
}
function tithiAngle(jd, ephe) {
  const s = sunLonAt(jd, ephe);
  const m = moonLonAt(jd, ephe);
  return ((m - s) % 360 + 360) % 360;
}
function yogaAngle(jd, ephe) {
  const s = sunLonAt(jd, ephe);
  const m = moonLonAt(jd, ephe);
  return ((s + m) % 360 + 360) % 360;
}
function generateTithis(startJd, endJd, ephe, namesFn = (i) => `Tithi ${i}`) {
  const result = [];
  const angle0 = tithiAngle(startJd, ephe);
  const idx0 = Math.floor(angle0 / 12);
  let prev = startJd;
  let curSlot = idx0;
  const crossings = findAllCrossings(
    startJd,
    endJd,
    12,
    (jd) => tithiAngle(jd, ephe),
    angle0
  );
  const boundaries = crossings.map((c) => ({ jd: c.jd }));
  boundaries.push({ jd: endJd });
  for (const b of boundaries) {
    const tithiIdx = curSlot + 1;
    result.push({
      index: tithiIdx,
      name: namesFn(tithiIdx),
      starts_at: jdToIso(prev, ephe),
      ends_at: jdToIso(b.jd, ephe)
    });
    prev = b.jd;
    curSlot = (curSlot + 1) % 30;
  }
  return result;
}
function generateNakshatras(startJd, endJd, ephe, namesFn = (i) => `Nakshatra ${i}`) {
  const result = [];
  const moonAngle0 = moonLonAt(startJd, ephe);
  const idx0 = Math.floor((moonAngle0 % 360 + 360) % 360 / NAK_SPAN);
  const crossings = findAllCrossings(
    startJd,
    endJd,
    NAK_SPAN,
    (jd) => moonLonAt(jd, ephe),
    moonAngle0
  );
  let prev = startJd;
  let curIdx = idx0;
  const boundaries = crossings.map((c) => ({ jd: c.jd }));
  boundaries.push({ jd: endJd });
  for (const b of boundaries) {
    result.push({
      index: curIdx,
      name: namesFn(curIdx),
      starts_at: jdToIso(prev, ephe),
      ends_at: jdToIso(b.jd, ephe)
    });
    prev = b.jd;
    curIdx = (curIdx + 1) % 27;
  }
  return result;
}
function generateYogas(startJd, endJd, ephe, namesFn = (i) => `Yoga ${i}`) {
  const result = [];
  const angle0 = yogaAngle(startJd, ephe);
  const idx0 = Math.floor(angle0 / NAK_SPAN);
  const crossings = findAllCrossings(
    startJd,
    endJd,
    NAK_SPAN,
    (jd) => yogaAngle(jd, ephe),
    angle0
  );
  let prev = startJd;
  let curIdx = idx0;
  const boundaries = crossings.map((c) => ({ jd: c.jd }));
  boundaries.push({ jd: endJd });
  for (const b of boundaries) {
    result.push({
      index: curIdx,
      name: namesFn(curIdx),
      starts_at: jdToIso(prev, ephe),
      ends_at: jdToIso(b.jd, ephe)
    });
    prev = b.jd;
    curIdx = (curIdx + 1) % 27;
  }
  return result;
}
function generateKaranas(startJd, endJd, ephe) {
  const result = [];
  const angle0 = tithiAngle(startJd, ephe);
  const halfIdx0 = Math.floor(angle0 / 6);
  const crossings = findAllCrossings(
    startJd,
    endJd,
    6,
    (jd) => tithiAngle(jd, ephe),
    angle0
  );
  let prev = startJd;
  let curHalf = halfIdx0;
  const boundaries = crossings.map((c) => ({ jd: c.jd }));
  boundaries.push({ jd: endJd });
  for (const b of boundaries) {
    result.push({
      index: curHalf,
      name: karanaName(curHalf),
      starts_at: jdToIso(prev, ephe),
      ends_at: jdToIso(b.jd, ephe)
    });
    prev = b.jd;
    curHalf = (curHalf + 1) % 60;
  }
  return result;
}
function generateMoonSigns(startJd, endJd, ephe, namesFn = (i) => `Rashi ${i}`, rashiFn = (i) => `Rashi ${i}`) {
  const result = [];
  const moonAngle0 = moonLonAt(startJd, ephe);
  const signIdx0 = Math.floor((moonAngle0 % 360 + 360) % 360 / 30);
  const crossings = findAllCrossings(
    startJd,
    endJd,
    30,
    (jd) => moonLonAt(jd, ephe),
    moonAngle0
  );
  let prev = startJd;
  let curIdx = signIdx0;
  const boundaries = crossings.map((c) => ({ jd: c.jd }));
  boundaries.push({ jd: endJd });
  for (const b of boundaries) {
    const signId = curIdx + 1;
    result.push({
      index: signId,
      name: namesFn(curIdx),
      rashi: rashiFn(curIdx),
      ends_at: jdToIso(b.jd, ephe)
    });
    prev = b.jd;
    curIdx = (curIdx + 1) % 12;
  }
  return result;
}
function generateNakshatraPadas(startJd, endJd, ephe, namesFn = (i) => `Nakshatra ${i}`) {
  const result = [];
  const PADA_SPAN = NAK_SPAN / 4;
  const moonAngle0 = moonLonAt(startJd, ephe);
  const padaIdx0 = Math.floor((moonAngle0 % 360 + 360) % 360 / PADA_SPAN);
  const crossings = findAllCrossings(
    startJd,
    endJd,
    PADA_SPAN,
    (jd) => moonLonAt(jd, ephe),
    moonAngle0
  );
  let curPadaIdx = padaIdx0;
  const boundaries = crossings.map((c) => ({ jd: c.jd }));
  boundaries.push({ jd: endJd });
  for (const b of boundaries) {
    const nakIdx = Math.floor(curPadaIdx / 4);
    const pada = curPadaIdx % 4 + 1;
    result.push({
      index: nakIdx,
      name: namesFn(nakIdx),
      pada,
      ends_at: jdToIso(b.jd, ephe)
    });
    curPadaIdx = (curPadaIdx + 1) % 108;
  }
  return result;
}

// src/calculations/sunrise.ts
function computeSolarTimes(jdNoon, lat, lon, ephe) {
  const jdMidnight = jdNoon - 0.5;
  const geopos = [lon, lat, 0];
  const sunrise = ephe.riseTrans(jdMidnight, SE.SUN, geopos, SE.CALC_RISE);
  const sunset = sunrise != null ? ephe.riseTrans(sunrise, SE.SUN, geopos, SE.CALC_SET) : null;
  const nextSunrise = sunset != null ? ephe.riseTrans(sunset, SE.SUN, geopos, SE.CALC_RISE) : null;
  const moonrise = ephe.riseTrans(jdMidnight, SE.MOON, geopos, SE.CALC_RISE);
  const moonset = moonrise != null ? ephe.riseTrans(moonrise, SE.MOON, geopos, SE.CALC_SET) : null;
  return { sunrise, sunset, moonrise, moonset, nextSunrise };
}
function computeDaySegments(sunriseJd, sunsetJd, nextSunriseJd) {
  const dayDur = sunsetJd - sunriseJd;
  const nightDur = nextSunriseJd - sunsetJd;
  const daySeg = dayDur / 8;
  const nightSeg = nightDur / 8;
  const daySegments = Array.from(
    { length: 8 },
    (_, i) => [sunriseJd + i * daySeg, sunriseJd + (i + 1) * daySeg]
  );
  const nightSegments = Array.from(
    { length: 8 },
    (_, i) => [sunsetJd + i * nightSeg, sunsetJd + (i + 1) * nightSeg]
  );
  return {
    sunriseJd,
    sunsetJd,
    daySegments,
    nightSegments,
    dinamanHours: dayDur * 24,
    ratrimanHours: nightDur * 24
  };
}
function generateUdayaLagna(startJd, endJd, lat, lon, ephe, namesFn = (id) => `Sign ${id}`, rashiFn = (id) => `Rashi ${id}`) {
  const results = [];
  const ascLon = (jd) => {
    const h = ephe.housesEx(jd, lat, lon);
    return h.ascendant;
  };
  let cur = startJd;
  const asc0 = ascLon(startJd);
  let curSignId = signIdFromLon(asc0);
  for (let iter = 0; iter < 24; iter++) {
    const nextSignBoundary = curSignId * 30;
    const jd = findAngleTime(cur, endJd, nextSignBoundary, ascLon);
    if (jd == null || jd >= endJd) {
      const signId = curSignId;
      results.push({
        sign: namesFn(signId),
        rashi: rashiFn(signId),
        start: jdToIso(cur, ephe),
        end: jdToIso(endJd, ephe)
      });
      break;
    }
    results.push({
      sign: namesFn(curSignId),
      rashi: rashiFn(curSignId),
      start: jdToIso(cur, ephe),
      end: jdToIso(jd, ephe)
    });
    cur = jd + 1e-7;
    curSignId = curSignId % 12 + 1;
  }
  return results;
}

// src/constants/muhurta.ts
var VARJYAM_GHATIKAS = [
  50,
  24,
  30,
  40,
  14,
  21,
  30,
  20,
  32,
  30,
  20,
  18,
  21,
  20,
  14,
  14,
  10,
  14,
  56,
  24,
  20,
  10,
  10,
  18,
  16,
  24,
  30
];
var VARJYAM_DURATION_GHATIKAS = 1.6;
var AMRIT_OFFSET_GHATIKAS = 26.67;
var AMRIT_KALAM_DURATION_GHATIKAS = 1.6;
var SARVARTHA_SIDDHI = {
  1: /* @__PURE__ */ new Set([3, 4, 7, 17]),
  // Mon
  2: /* @__PURE__ */ new Set([0, 2, 8, 25]),
  // Tue
  3: /* @__PURE__ */ new Set([0, 2, 3, 4, 12, 16]),
  // Wed
  4: /* @__PURE__ */ new Set([0, 6, 7, 16, 26]),
  // Thu
  5: /* @__PURE__ */ new Set([0, 6, 16, 21, 26]),
  // Fri
  6: /* @__PURE__ */ new Set([3, 14, 21]),
  // Sat
  7: /* @__PURE__ */ new Set([0, 7, 10, 11, 12, 18, 20, 25])
  // Sun
};
var AMRITA_SIDDHI = {
  1: /* @__PURE__ */ new Set([4]),
  // Mon + Mrigashira
  2: /* @__PURE__ */ new Set([0]),
  // Tue + Ashwini
  3: /* @__PURE__ */ new Set([16]),
  // Wed + Anuradha
  4: /* @__PURE__ */ new Set([7]),
  // Thu + Pushya
  5: /* @__PURE__ */ new Set([26]),
  // Fri + Revati
  6: /* @__PURE__ */ new Set([3]),
  // Sat + Rohini
  7: /* @__PURE__ */ new Set([12])
  // Sun + Hasta
};
var DUR_MUHURTA = {
  1: [9, 12],
  // Mon
  2: [4],
  // Tue
  3: [8],
  // Wed (coincides with Abhijit — suppressed that day)
  4: [6],
  // Thu
  5: [4],
  // Fri
  6: [1, 2],
  // Sat
  7: [14]
  // Sun
};
var ABHIJIT_MUHURTA_INDEX = 8;
var GOWRI_DAY_START = {
  1: 3,
  2: 4,
  3: 5,
  4: 7,
  5: 2,
  6: 0,
  7: 1
};
var HORA_DAY_START = {
  1: 3,
  2: 6,
  3: 2,
  4: 5,
  5: 1,
  6: 4,
  7: 0
};
var HORA_CYCLE = [
  "Sun",
  "Venus",
  "Mercury",
  "Moon",
  "Saturn",
  "Jupiter",
  "Mars"
];
var AUSPICIOUS_HORAS = /* @__PURE__ */ new Set([
  "Jupiter",
  "Venus",
  "Mercury",
  "Moon"
]);
var AMRITADI_TABLE = [
  "SSMAASS",
  // 0  Ashwini
  "SSSSSSP",
  // 1  Bharani
  "MSAMSSS",
  // 2  Krittika
  "AASMMAS",
  // 3  Rohini
  "SSSMSSS",
  // 4  Mrigashira
  "SMSMSSS",
  // 5  Ardra
  "ASSASSS",
  // 6  Punarvasu
  "SSSSMSS",
  // 7  Pushya
  "SSSSMMS",
  // 8  Ashlesha
  "MSSAMAM",
  // 9  Magha
  "SSASSSS",
  // 10 Purva Phalguni
  "SAAMSMA",
  // 11 Uttara Phalguni
  "SSMSAMS",
  // 12 Hasta
  "PSSSSMS",
  // 13 Chitra
  "ASSASSS",
  // 14 Swati
  "MMSSSSM",
  // 15 Vishakha
  "SSSSSSM",
  // 16 Anuradha
  "SMSPMSM",
  // 17 Jyeshtha
  "SAMSASA",
  // 18 Mula
  "MSASPSS",
  // 19 Purva Ashadha
  "MPASSSA",
  // 20 Uttara Ashadha
  "ASSSMSA",
  // 21 Shravana
  "SSPSSSM",
  // 22 Dhanishta
  "SMSMSAS",
  // 23 Shatabhisha
  "MMASSMS",
  // 24 Purva Bhadrapada
  "SASSSSA",
  // 25 Uttara Bhadrapada
  "SSMSSPA"
  // 26 Revati
];
var NAKSHATRA_TYAJYAM_RATIO = [
  [5, 6],
  [2, 5],
  [1, 2],
  [2, 3],
  [7, 30],
  [7, 20],
  [1, 2],
  [1, 3],
  [8, 15],
  [1, 2],
  [1, 3],
  [3, 10],
  [11, 30],
  [14, 15],
  [7, 30],
  [7, 30],
  [1, 6],
  [7, 30],
  [1, 3],
  [2, 5],
  [1, 3],
  [1, 6],
  [1, 6],
  [3, 10],
  [4, 15],
  [2, 5],
  [1, 2]
];
var NAKSHATRA_TYAJYAM_DURATION_MIN = 96;
var TITHI_TYAJYAM_BASE = [
  [2, 5],
  [1, 5],
  [11, 12],
  [1, 12],
  [9, 10],
  [9, 10],
  [31, 60],
  [1, 3],
  [1, 12],
  [11, 20],
  [1, 60],
  [1, 4],
  [13, 30],
  [7, 60],
  [29, 60],
  [1, 10]
];
var TITHI_TYAJYAM_DURATION_MIN = 96;
var VARA_TYAJYAM_NAZHIGAI = {
  1: 42,
  2: 31,
  3: 42,
  4: 31,
  5: 21,
  6: 14,
  7: 32
};
var VARA_TYAJYAM_DURATION_MIN = 90;
var INAUSPICIOUS_KARANAS = /* @__PURE__ */ new Set(["Vishti", "Chatushpada", "Naga"]);
var LAGNA_DEFECT_POSITION = {
  Aries: "beginning",
  Taurus: "beginning",
  Virgo: "beginning",
  Sagittarius: "beginning",
  Gemini: "middle",
  Leo: "middle",
  Libra: "middle",
  Aquarius: "middle",
  Cancer: "end",
  Scorpio: "end",
  Capricorn: "end",
  Pisces: "end"
};
var LAGNA_DEFECT_RATIO = 0.1;
var GURU_ASTHAMANAM_ORB = 11;
var SUKRA_ASTHAMANAM_ORB_DIRECT = 10;
var SUKRA_ASTHAMANAM_ORB_RETRO = 8;

// src/calculations/muhurta.ts
var GHATIKAS_PER_DAY = 60;
function jdToWin(startJd, endJd, ephe) {
  return { start: jdToIso(startJd, ephe), end: jdToIso(endJd, ephe) };
}
function muhurtaWindows(sunriseJd, sunsetJd, nextSunriseJd) {
  const dayDur = sunsetJd - sunriseJd;
  const nightDur = nextSunriseJd - sunsetJd;
  const dayMuh = dayDur / 15;
  const nightMuh = nightDur / 15;
  const wins = [[0, 0]];
  for (let i = 0; i < 15; i++) {
    wins.push([sunriseJd + i * dayMuh, sunriseJd + (i + 1) * dayMuh]);
  }
  for (let i = 0; i < 15; i++) {
    wins.push([sunsetJd + i * nightMuh, sunsetJd + (i + 1) * nightMuh]);
  }
  return wins;
}
function brahmaMuhurta(sunriseJd, nextSunriseJd, ephe) {
  const prevSunriseJd = sunriseJd - (nextSunriseJd - sunriseJd);
  const wins = muhurtaWindows(
    prevSunriseJd,
    sunriseJd - (sunriseJd - prevSunriseJd) * (15 / 30),
    nextSunriseJd
  );
  const duration = 96 / (24 * 60);
  const start = sunriseJd - 2 * duration;
  const end = sunriseJd - duration;
  return jdToWin(start, end, ephe);
}
function pratahSandhya(sunriseJd, sunsetJd, nextSunriseJd, ephe) {
  const wins = muhurtaWindows(sunriseJd, sunsetJd, nextSunriseJd);
  return jdToWin(wins[1][0], wins[1][1], ephe);
}
function abhijitMuhurta(sunriseJd, sunsetJd, nextSunriseJd, weekday, ephe) {
  if (DUR_MUHURTA[weekday]?.includes(ABHIJIT_MUHURTA_INDEX)) return null;
  const wins = muhurtaWindows(sunriseJd, sunsetJd, nextSunriseJd);
  return jdToWin(
    wins[ABHIJIT_MUHURTA_INDEX][0],
    wins[ABHIJIT_MUHURTA_INDEX][1],
    ephe
  );
}
function vijayMuhurta(sunriseJd, sunsetJd, nextSunriseJd, ephe) {
  const wins = muhurtaWindows(sunriseJd, sunsetJd, nextSunriseJd);
  return jdToWin(wins[14][0], wins[14][1], ephe);
}
function godhuliMuhurta(sunsetJd, ephe) {
  const half = 24 / (24 * 60);
  return jdToWin(sunsetJd - half, sunsetJd + half, ephe);
}
function sayahnaSandhya(sunriseJd, sunsetJd, nextSunriseJd, ephe) {
  const wins = muhurtaWindows(sunriseJd, sunsetJd, nextSunriseJd);
  return jdToWin(wins[15][0], wins[15][1], ephe);
}
function nishitaMuhurta(sunriseJd, sunsetJd, nextSunriseJd, ephe) {
  const wins = muhurtaWindows(sunriseJd, sunsetJd, nextSunriseJd);
  return jdToWin(wins[23][0], wins[23][1], ephe);
}
function durMuhurtam(sunriseJd, sunsetJd, nextSunriseJd, weekday, ephe) {
  const indices = DUR_MUHURTA[weekday] ?? [];
  const wins = muhurtaWindows(sunriseJd, sunsetJd, nextSunriseJd);
  return indices.map((i) => jdToWin(wins[i][0], wins[i][1], ephe));
}
function rahuKalam(sunriseJd, sunsetJd, weekday, ephe) {
  const seg = RAHU_KAAL_SEGMENT[weekday];
  if (!seg) return null;
  const dayDur = sunsetJd - sunriseJd;
  const segDur = dayDur / 8;
  const start = sunriseJd + (seg - 1) * segDur;
  return jdToWin(start, start + segDur, ephe);
}
function yamaganda(sunriseJd, sunsetJd, weekday, ephe) {
  const seg = YAMAGANDA_SEGMENT[weekday];
  if (!seg) return null;
  const dayDur = sunsetJd - sunriseJd;
  const segDur = dayDur / 8;
  const start = sunriseJd + (seg - 1) * segDur;
  return jdToWin(start, start + segDur, ephe);
}
function gulikaKalam(sunriseJd, sunsetJd, weekday, ephe) {
  const seg = GULIKA_SEGMENT[weekday];
  if (!seg) return null;
  const dayDur = sunsetJd - sunriseJd;
  const segDur = dayDur / 8;
  const start = sunriseJd + (seg - 1) * segDur;
  return jdToWin(start, start + segDur, ephe);
}
function varjyamWindow(nakIdx, nakStartJd, nakEndJd, ephe) {
  const ghatikaOffset = VARJYAM_GHATIKAS[nakIdx];
  if (ghatikaOffset == null) return null;
  const nakDur = nakEndJd - nakStartJd;
  const ghatikaFrac = ghatikaOffset / GHATIKAS_PER_DAY;
  const durationFrac = VARJYAM_DURATION_GHATIKAS / GHATIKAS_PER_DAY;
  const start = nakStartJd + ghatikaFrac * nakDur;
  return jdToWin(start, start + durationFrac * nakDur, ephe);
}
function amritKalamWindow(nakIdx, nakStartJd, nakEndJd, ephe) {
  const ghatikaOffset = (VARJYAM_GHATIKAS[nakIdx] + AMRIT_OFFSET_GHATIKAS) % GHATIKAS_PER_DAY;
  const nakDur = nakEndJd - nakStartJd;
  const ghatikaFrac = ghatikaOffset / GHATIKAS_PER_DAY;
  const durationFrac = AMRIT_KALAM_DURATION_GHATIKAS / GHATIKAS_PER_DAY;
  const start = nakStartJd + ghatikaFrac * nakDur;
  return jdToWin(start, start + durationFrac * nakDur, ephe);
}
function sarvarthaSiddhiYoga(sunriseJd, sunsetJd, weekday, nakIdx, ephe) {
  const set = SARVARTHA_SIDDHI[weekday];
  if (!set || !set.has(nakIdx)) return null;
  return jdToWin(sunriseJd, sunsetJd, ephe);
}
function amritaSiddhiYoga(sunriseJd, sunsetJd, weekday, nakIdx, ephe) {
  const set = AMRITA_SIDDHI[weekday];
  if (!set || !set.has(nakIdx)) return null;
  return jdToWin(sunriseJd, sunsetJd, ephe);
}
function bhadraWindows(karanas) {
  return karanas.filter((k) => k.name === "Vishti").map((k) => ({ start: k.starts_at ?? k.ends_at, end: k.ends_at }));
}

// src/calculations/gowri.ts
var GOWRI_NAMES = [
  "Soram",
  "Uthi",
  "Visham",
  "Amridha",
  "Rogam",
  "Labam",
  "Dhanam",
  "Sugam"
];
var AUSPICIOUS_GOWRI = /* @__PURE__ */ new Set([
  "Amridha",
  "Sugam",
  "Labam",
  "Dhanam",
  "Uthi"
]);
function computeGowri(sunriseJd, sunsetJd, nextSunriseJd, weekday, ephe) {
  const dayStart = GOWRI_DAY_START[weekday] ?? 0;
  const nightStart = (dayStart + 5) % 8;
  const dayDur = (sunsetJd - sunriseJd) / 8;
  const nightDur = (nextSunriseJd - sunsetJd) / 8;
  const day = [];
  for (let i = 0; i < 8; i++) {
    const name = GOWRI_NAMES[(dayStart + i) % 8];
    const start = sunriseJd + i * dayDur;
    const end = start + dayDur;
    day.push({
      name,
      auspicious: AUSPICIOUS_GOWRI.has(name),
      start: jdToIso(start, ephe),
      end: jdToIso(end, ephe)
    });
  }
  const night = [];
  for (let i = 0; i < 8; i++) {
    const name = GOWRI_NAMES[(nightStart + i) % 8];
    const start = sunsetJd + i * nightDur;
    const end = start + nightDur;
    night.push({
      name,
      auspicious: AUSPICIOUS_GOWRI.has(name),
      start: jdToIso(start, ephe),
      end: jdToIso(end, ephe)
    });
  }
  return { day, night };
}

// src/calculations/hora.ts
function computeHora(sunriseJd, sunsetJd, nextSunriseJd, weekday, ephe) {
  const dayStart = HORA_DAY_START[weekday] ?? 0;
  const nightStart = (dayStart + 12) % 7;
  const dayDur = (sunsetJd - sunriseJd) / 12;
  const nightDur = (nextSunriseJd - sunsetJd) / 12;
  const day = [];
  for (let i = 0; i < 12; i++) {
    const name = HORA_CYCLE[(dayStart + i) % 7];
    const start = sunriseJd + i * dayDur;
    const end = sunriseJd + (i + 1) * dayDur;
    day.push({
      name,
      auspicious: AUSPICIOUS_HORAS.has(name),
      start: jdToIso(start, ephe),
      end: jdToIso(end, ephe)
    });
  }
  const night = [];
  for (let i = 0; i < 12; i++) {
    const name = HORA_CYCLE[(nightStart + i) % 7];
    const start = sunsetJd + i * nightDur;
    const end = sunsetJd + (i + 1) * nightDur;
    night.push({
      name,
      auspicious: AUSPICIOUS_HORAS.has(name),
      start: jdToIso(start, ephe),
      end: jdToIso(end, ephe)
    });
  }
  return { day, night };
}

// src/calculations/nalla-neram.ts
function subtractWindows(good, bad) {
  const result = [];
  for (const g of good) {
    let remaining = [g];
    for (const b of bad) {
      const newRemaining = [];
      for (const r of remaining) {
        const bStart = new Date(b.start).getTime();
        const bEnd = new Date(b.end).getTime();
        const rStart = new Date(r.start).getTime();
        const rEnd = new Date(r.end).getTime();
        if (bEnd <= rStart || bStart >= rEnd) {
          newRemaining.push(r);
        } else {
          if (bStart > rStart) {
            newRemaining.push({
              start: r.start,
              end: new Date(bStart).toISOString()
            });
          }
          if (bEnd < rEnd) {
            newRemaining.push({
              start: new Date(bEnd).toISOString(),
              end: r.end
            });
          }
        }
      }
      remaining = newRemaining;
    }
    result.push(...remaining);
  }
  return result.filter((w) => {
    const dur = new Date(w.end).getTime() - new Date(w.start).getTime();
    return dur > 60 * 1e3;
  });
}
function computeNallaNeram(horas, inauspicious) {
  const goodHoras = horas.filter((h) => h.auspicious).map((h) => ({ start: h.start, end: h.end }));
  return subtractWindows(goodHoras, inauspicious);
}

// src/calculations/tyajyam/nakshatra.ts
function nakshatra_tyajyam(nakshatras) {
  const results = [];
  const durMs = NAKSHATRA_TYAJYAM_DURATION_MIN * 60 * 1e3;
  for (const nak of nakshatras) {
    const ratio = NAKSHATRA_TYAJYAM_RATIO[nak.index];
    if (!ratio) continue;
    const [num, denom] = ratio;
    const nakStart = new Date(nak.starts_at ?? nak.ends_at).getTime();
    const nakEnd = new Date(nak.ends_at).getTime();
    const nakDurMs = nakEnd - nakStart;
    const offsetMs = nakDurMs * num / denom;
    const startMs = nakStart + offsetMs;
    const endMs = startMs + durMs;
    results.push({
      start: new Date(startMs).toISOString(),
      end: new Date(Math.min(endMs, nakEnd)).toISOString(),
      nakshatra: nak.name
    });
  }
  return results;
}

// src/calculations/tyajyam/tithi.ts
function tithi_tyajyam(tithis) {
  const results = [];
  const durMs = TITHI_TYAJYAM_DURATION_MIN * 60 * 1e3;
  for (const tithi of tithis) {
    const idx = tithi.index;
    let baseIdx = (idx - 1) % 15;
    if (idx === 15) baseIdx = 14;
    if (idx === 30) baseIdx = 15;
    const ratio = TITHI_TYAJYAM_BASE[baseIdx];
    if (!ratio) continue;
    const [num, denom] = ratio;
    const tStart = new Date(tithi.starts_at ?? tithi.ends_at).getTime();
    const tEnd = new Date(tithi.ends_at).getTime();
    const tDur = tEnd - tStart;
    const offsetMs = tDur * num / denom;
    const startMs = tStart + offsetMs;
    results.push({
      start: new Date(startMs).toISOString(),
      end: new Date(Math.min(startMs + durMs, tEnd)).toISOString(),
      tithi: tithi.name
    });
  }
  return results;
}

// src/calculations/tyajyam/vara.ts
function vara_tyajyam(sunriseIso, weekday) {
  const nazhigai = VARA_TYAJYAM_NAZHIGAI[weekday];
  if (nazhigai == null) return null;
  const sunriseMs = new Date(sunriseIso).getTime();
  const offsetMs = nazhigai * 24 * 60 * 1e3;
  const durMs = VARA_TYAJYAM_DURATION_MIN * 60 * 1e3;
  const start = sunriseMs + offsetMs;
  return {
    start: new Date(start).toISOString(),
    end: new Date(start + durMs).toISOString()
  };
}

// src/calculations/tyajyam/amritadi.ts
var YOGAM_NAMES = {
  A: "Amrita",
  S: "Siddha",
  M: "Marana",
  P: "Prabalarishta"
};
function amritadi_yogam(nakshatras, weekday) {
  const results = [];
  const dayCol = weekday - 1;
  for (const nak of nakshatras) {
    const row = AMRITADI_TABLE[nak.index];
    if (!row) continue;
    const code = row[dayCol] ?? "S";
    const yogam = YOGAM_NAMES[code] ?? "Siddha";
    results.push({
      start: nak.starts_at ?? nak.ends_at,
      end: nak.ends_at,
      nakshatra: nak.name,
      yogam
    });
  }
  return results;
}

// src/calculations/tyajyam/lagna.ts
function lagna_tyajyam(lagnas) {
  const results = [];
  for (const lagna of lagnas) {
    const position = LAGNA_DEFECT_POSITION[lagna.sign] ?? "beginning";
    const startMs = new Date(lagna.start).getTime();
    const endMs = new Date(lagna.end).getTime();
    const durMs = endMs - startMs;
    const defectMs = durMs * LAGNA_DEFECT_RATIO;
    let tyStart;
    let tyEnd;
    if (position === "beginning") {
      tyStart = startMs;
      tyEnd = startMs + defectMs;
    } else if (position === "end") {
      tyStart = endMs - defectMs;
      tyEnd = endMs;
    } else {
      const mid = startMs + durMs / 2;
      tyStart = mid - defectMs / 2;
      tyEnd = mid + defectMs / 2;
    }
    results.push({
      start: new Date(tyStart).toISOString(),
      end: new Date(tyEnd).toISOString(),
      sign: lagna.sign,
      position
    });
  }
  return results;
}

// src/calculations/tyajyam/karana.ts
function karana_tyajyam(karanas) {
  return karanas.filter((k) => INAUSPICIOUS_KARANAS.has(k.name)).map((k) => ({
    start: k.starts_at ?? k.ends_at,
    end: k.ends_at,
    karana: k.name
  }));
}

// src/calculations/tyajyam/gowri.ts
var INAUSPICIOUS_GOWRI = /* @__PURE__ */ new Set(["Soram", "Visham", "Rogam"]);
function gowri_tyajyam(day, night) {
  const all = [...day, ...night];
  return all.filter((s) => INAUSPICIOUS_GOWRI.has(s.name)).map((s) => ({
    start: s.start,
    end: s.end,
    name: s.name,
    period: day.includes(s) ? "day" : "night"
  }));
}

// src/calculations/tyajyam/dosha.ts
function withinOrb(lon, sunLon, orb) {
  const diff = Math.abs(lon - sunLon);
  return diff <= orb || diff >= 360 - orb;
}
function dosha_tyajyam(sunriseIso, sunsetIso, eclipseWins, jupiterLon, venusLon, venusRetro, sunLon) {
  const results = [];
  const dayStart = new Date(sunriseIso).getTime();
  const dayEnd = new Date(sunsetIso).getTime();
  for (const e of eclipseWins) {
    const eStart = Math.max(new Date(e.start).getTime(), dayStart);
    const eEnd = Math.min(new Date(e.end).getTime(), dayEnd);
    if (eEnd > eStart) {
      results.push({
        start: new Date(eStart).toISOString(),
        end: new Date(eEnd).toISOString(),
        dosha: `${e.kind === "solar" ? "Solar" : "Lunar"} Eclipse`
      });
    }
  }
  if (withinOrb(jupiterLon, sunLon, GURU_ASTHAMANAM_ORB)) {
    results.push({
      start: sunriseIso,
      end: sunsetIso,
      dosha: "Guru Asthamanam"
    });
  }
  const venusOrb = venusRetro ? SUKRA_ASTHAMANAM_ORB_RETRO : SUKRA_ASTHAMANAM_ORB_DIRECT;
  if (withinOrb(venusLon, sunLon, venusOrb)) {
    results.push({
      start: sunriseIso,
      end: sunsetIso,
      dosha: "Sukra Asthamanam"
    });
  }
  return results;
}

// src/calculations/tyajyam/tithi-lagna.ts
function tithi_lagna_tyajyam(tithis, lagnas, signNames) {
  const results = [];
  for (const tithi of tithis) {
    const tStart = new Date(tithi.starts_at ?? tithi.ends_at).getTime();
    const tEnd = new Date(tithi.ends_at).getTime();
    const afflictedSignIdx = (tithi.index - 1) % 12;
    const afflictedSign = signNames[afflictedSignIdx] ?? "";
    for (const lagna of lagnas) {
      if (lagna.sign !== afflictedSign) continue;
      const lStart = new Date(lagna.start).getTime();
      const lEnd = new Date(lagna.end).getTime();
      const overlapStart = Math.max(tStart, lStart);
      const overlapEnd = Math.min(tEnd, lEnd);
      if (overlapEnd <= overlapStart) continue;
      results.push({
        start: new Date(overlapStart).toISOString(),
        end: new Date(overlapEnd).toISOString(),
        tithi: tithi.name,
        sign: lagna.sign
      });
    }
  }
  return results;
}

// src/calculations/tyajyam/tamil-month.ts
function tamil_month_avoidables(tamilMonthEn) {
  const AVOIDABLES = {
    Chithirai: {
      avoid_tithis: ["Ashtami"],
      avoid_nakshatras: ["Bharani"],
      avoid_lagnas: ["Scorpio"]
    },
    Vaikasi: {
      avoid_tithis: ["Chaturdashi"],
      avoid_nakshatras: ["Krittika"],
      avoid_lagnas: []
    },
    Aani: {
      avoid_tithis: ["Navami"],
      avoid_nakshatras: ["Ardra"],
      avoid_lagnas: []
    },
    Aadi: {
      avoid_tithis: ["Saptami"],
      avoid_nakshatras: ["Ashlesha"],
      avoid_lagnas: ["Cancer"]
    },
    Aavani: { avoid_tithis: [], avoid_nakshatras: [], avoid_lagnas: [] },
    Purattasi: {
      avoid_tithis: ["Ashtami"],
      avoid_nakshatras: ["Vishakha"],
      avoid_lagnas: []
    },
    Aippasi: {
      avoid_tithis: [],
      avoid_nakshatras: ["Jyeshtha"],
      avoid_lagnas: []
    },
    Karthigai: {
      avoid_tithis: ["Trayodashi"],
      avoid_nakshatras: ["Mula"],
      avoid_lagnas: []
    },
    Margazhi: {
      avoid_tithis: [],
      avoid_nakshatras: ["Purva Ashadha"],
      avoid_lagnas: []
    },
    Thai: {
      avoid_tithis: ["Ekadashi"],
      avoid_nakshatras: [],
      avoid_lagnas: []
    },
    Maasi: {
      avoid_tithis: [],
      avoid_nakshatras: ["Uttara Bhadrapada"],
      avoid_lagnas: []
    },
    Panguni: {
      avoid_tithis: ["Dwitiya"],
      avoid_nakshatras: ["Revati"],
      avoid_lagnas: []
    }
  };
  const data = AVOIDABLES[tamilMonthEn];
  if (!data) return null;
  if (!data.avoid_tithis.length && !data.avoid_nakshatras.length && !data.avoid_lagnas.length)
    return null;
  return { ...data, windows: [] };
}

// src/calculations/tyajyam/index.ts
function computeTyajyam(inputs) {
  return {
    nakshatraTyajyam: nakshatra_tyajyam(inputs.nakshatras),
    tithiTyajyam: tithi_tyajyam(inputs.tithis),
    varaTyajyam: vara_tyajyam(inputs.sunriseIso, inputs.weekday),
    amritadiYogam: amritadi_yogam(inputs.nakshatras, inputs.weekday),
    lagnaTyajyam: lagna_tyajyam(inputs.lagnas),
    karanaTyajyam: karana_tyajyam(inputs.karanas),
    gowriTyajyam: gowri_tyajyam(inputs.gowri.day, inputs.gowri.night),
    doshaTyajyam: dosha_tyajyam(
      inputs.sunriseIso,
      inputs.sunsetIso,
      inputs.eclipseWins,
      inputs.jupiterLon,
      inputs.venusLon,
      inputs.venusRetro,
      inputs.sunLon
    ),
    tithiLagnaTyajyam: tithi_lagna_tyajyam(
      inputs.tithis,
      inputs.lagnas,
      inputs.signNames
    ),
    tamilMonthAvoidables: tamil_month_avoidables(inputs.tamilMonthEn)
  };
}

// src/constants/calendars.ts
var KALI_START_JD = 588465.5;
var RATA_DIE_EPOCH_JD = 17214245e-1;
var DISHA_SHOOL = {
  1: "East",
  2: "North",
  3: "North",
  4: "South",
  5: "West",
  6: "East",
  7: "West"
};
var RAHU_VASA = {
  1: "North-West",
  2: "North",
  3: "South-East",
  4: "South",
  5: "East",
  6: "West",
  7: "South-West"
};
var CHANDRA_VASA = {
  1: "West",
  2: "South",
  3: "West",
  4: "North",
  5: "East",
  6: "West",
  7: "South",
  8: "East",
  9: "North",
  10: "East",
  11: "West",
  12: "South"
};
var GOOD_CHANDRA_OFFSETS = /* @__PURE__ */ new Set([0, 2, 5, 6, 9, 10]);
var GOOD_TARA_OFFSETS = /* @__PURE__ */ new Set([
  0,
  1,
  3,
  5,
  7,
  8,
  9,
  10,
  12,
  14,
  16,
  17,
  18,
  19,
  21,
  23,
  25,
  26
]);
var CHANDRA_MASA_BY_SUNSIGN = [
  "Vaishakha",
  "Jyeshtha",
  "Ashadha",
  "Shravana",
  "Bhadrapada",
  "Ashwin",
  "Kartika",
  "Margashirsha",
  "Pausha",
  "Magha",
  "Phalguna",
  "Chaitra"
];
var SIGN_TO_DRIK_RITU = {
  1: "Vasant",
  2: "Grishma",
  3: "Grishma",
  4: "Varsha",
  5: "Varsha",
  6: "Sharad",
  7: "Sharad",
  8: "Hemant",
  9: "Hemant",
  10: "Shishir",
  11: "Shishir",
  12: "Vasant"
};
var SIGN_TO_VEDIC_RITU = {
  1: "Vasant",
  2: "Grishma",
  3: "Grishma",
  4: "Varsha",
  5: "Varsha",
  6: "Sharad",
  7: "Sharad",
  8: "Hemant",
  9: "Hemant",
  10: "Shishir",
  11: "Shishir",
  12: "Vasant"
};
var UTTARAYANA_SIGNS = /* @__PURE__ */ new Set([10, 11, 12, 1, 2, 3]);
var TAMIL_MONTHS_BY_SIGN = {
  1: { en: "Chithirai", ta: "\u0B9A\u0BBF\u0BA4\u0BCD\u0BA4\u0BBF\u0BB0\u0BC8" },
  2: { en: "Vaikasi", ta: "\u0BB5\u0BC8\u0B95\u0BBE\u0B9A\u0BBF" },
  3: { en: "Aani", ta: "\u0B86\u0BA9\u0BBF" },
  4: { en: "Aadi", ta: "\u0B86\u0B9F\u0BBF" },
  5: { en: "Aavani", ta: "\u0B86\u0BB5\u0BA3\u0BBF" },
  6: { en: "Purattasi", ta: "\u0BAA\u0BC1\u0BB0\u0B9F\u0BCD\u0B9F\u0BBE\u0B9A\u0BBF" },
  7: { en: "Aippasi", ta: "\u0B90\u0BAA\u0BCD\u0BAA\u0B9A\u0BBF" },
  8: { en: "Karthigai", ta: "\u0B95\u0BBE\u0BB0\u0BCD\u0BA4\u0BCD\u0BA4\u0BBF\u0B95\u0BC8" },
  9: { en: "Margazhi", ta: "\u0BAE\u0BBE\u0BB0\u0BCD\u0B95\u0BB4\u0BBF" },
  10: { en: "Thai", ta: "\u0BA4\u0BC8" },
  11: { en: "Maasi", ta: "\u0BAE\u0BBE\u0B9A\u0BBF" },
  12: { en: "Panguni", ta: "\u0BAA\u0B99\u0BCD\u0B95\u0BC1\u0BA9\u0BBF" }
};
var NATIONAL_CIVIL_MONTHS = [
  { name: "Chaitra", days: 30 },
  // 31 in leap year
  { name: "Vaishakha", days: 31 },
  { name: "Jyaistha", days: 31 },
  { name: "Asadha", days: 31 },
  { name: "Sravana", days: 31 },
  { name: "Bhadra", days: 31 },
  { name: "Asvina", days: 30 },
  { name: "Kartika", days: 30 },
  { name: "Agrahayana", days: 30 },
  { name: "Pausa", days: 30 },
  { name: "Magha", days: 30 },
  { name: "Phalguna", days: 30 }
];

// src/calculations/calendars.ts
var SIDEREAL_FLAGS2 = () => SE.FLG_SWIEPH | SE.FLG_SPEED | SE.FLG_SIDEREAL;
function computeCalendars(jd, sunLon, moonLon, tithiIdx, sunriseJd, ephe, samvatsaraNames, nakshatra) {
  const julianDay = jd;
  const modifiedJulianDay = jd - 24000005e-1;
  const rataDie = Math.floor(jd - RATA_DIE_EPOCH_JD);
  const kaliAhargana = Math.floor(jd - KALI_START_JD);
  const kaliYear = Math.floor(kaliAhargana / 365.25) + 1;
  const [gregYear, gregMonth, gregDay, gregHour] = ephe.revjul(jd);
  const afterMeshaIngress = sunLon >= 0;
  const shakaYear = gregYear - (afterMeshaIngress ? 77 : 78);
  const vikramYear = shakaYear + 135;
  const gujaratiYear = vikramYear - 1;
  const samvatsaraShakaSuffix = (shakaYear + 11) % 60;
  const samvatsaraVikramSuffix = (vikramYear + 9) % 60;
  const samvatsaraShaka = samvatsaraNames[samvatsaraShakaSuffix] ?? "";
  const samvatsaraVikram = samvatsaraNames[samvatsaraVikramSuffix] ?? "";
  const sunSignId = signIdFromLon(sunLon);
  const niraayanaSolarMonth = getNirayanaSolarMonth(sunSignId - 1);
  const chandramasaAmanta = CHANDRA_MASA_BY_SUNSIGN[(sunSignId - 1 + 12) % 12];
  const chandramasaPurnimanta = CHANDRA_MASA_BY_SUNSIGN[sunSignId % 12];
  const paksha = tithiIdx <= 15 ? "Shukla Paksha" : "Krishna Paksha";
  const pravishteDays = tithiIdx <= 15 ? tithiIdx : tithiIdx - 15;
  const drikRitu = SIGN_TO_DRIK_RITU[sunSignId] ?? "";
  const vedicRitu = SIGN_TO_VEDIC_RITU[sunSignId] ?? "";
  const drikAyana = UTTARAYANA_SIGNS.has(sunSignId) ? "Uttarayana" : "Dakshinayana";
  const vedicAyana = drikAyana;
  const nationalCivil = computeNationalCivilDate(jd, shakaYear, false);
  const nationalNirayana = computeNationalCivilDate(jd, shakaYear, true);
  const ayanamshaLahiri = ephe.getAyanamsaUt(jd);
  return {
    kaliYear,
    kaliAhargana,
    julianDay,
    modifiedJulianDay,
    rataDie,
    ayanamshaLahiri,
    shakaYear,
    vikramYear,
    gujaratiYear,
    nationalCivilDate: { ...nationalCivil, shakaYear },
    nationalNirayanaDate: { ...nationalNirayana, shakaYear },
    samvatsaraShaka,
    samvatsaraVikram,
    samvatsaraShakaSuffix,
    samvatsaraVikramSuffix,
    vikramSamvat: vikramYear,
    shaka: shakaYear,
    gujaratiSamvat: gujaratiYear,
    chandramasaAmanta,
    chandramasaPurnimanta,
    paksha,
    pravishteDays,
    niraayanaSolarMonth,
    drikRitu,
    drikAyana,
    vedicRitu,
    vedicAyana
  };
}
function getNirayanaSolarMonth(sunSignIdx) {
  const NIRAYANA = [
    "Vaishakha",
    "Jyeshtha",
    "Ashadha",
    "Shravana",
    "Bhadrapada",
    "Ashwin",
    "Kartika",
    "Margashirsha",
    "Pausha",
    "Magha",
    "Phalguna",
    "Chaitra"
  ];
  return NIRAYANA[sunSignIdx] ?? "";
}
function computeNationalCivilDate(jd, shakaYear, _nirayana) {
  const [gregYear, gregMonth, gregDay] = [0, 0, 0];
  const [y] = [2e3];
  const chaitraStartGreg = isGregorianLeap(shakaYear + 78) ? 21 : 22;
  const chaitraStartJd = new EphemerisServiceProxy().julday(
    shakaYear + 78,
    3,
    chaitraStartGreg,
    12
  );
  let dayOfYear = Math.floor(jd) - Math.floor(chaitraStartJd);
  if (dayOfYear < 0) {
    const prevChaitraJd = new EphemerisServiceProxy().julday(
      shakaYear + 77,
      3,
      isGregorianLeap(shakaYear + 77) ? 21 : 22,
      12
    );
    dayOfYear = Math.floor(jd) - Math.floor(prevChaitraJd);
  }
  let cumDays = 0;
  for (let i = 0; i < NATIONAL_CIVIL_MONTHS.length; i++) {
    const monthDays = i === 0 && isGregorianLeap(shakaYear + 78) ? 31 : NATIONAL_CIVIL_MONTHS[i].days;
    if (dayOfYear < cumDays + monthDays) {
      return {
        month: NATIONAL_CIVIL_MONTHS[i].name,
        day: dayOfYear - cumDays + 1
      };
    }
    cumDays += monthDays;
  }
  return { month: "Phalguna", day: 30 };
}
function isGregorianLeap(year) {
  return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
}
var EphemerisServiceProxy = class {
  julday(y, m, d, h) {
    const a = Math.floor((14 - m) / 12);
    const yr = y + 4800 - a;
    const mo = m + 12 * a - 3;
    return d + Math.floor((153 * mo + 2) / 5) + 365 * yr + Math.floor(yr / 4) - Math.floor(yr / 100) + Math.floor(yr / 400) - 32045 + (h - 12) / 24;
  }
};
function findLastSankranti(jd, signId, ephe) {
  const targetDeg = (signId - 1) * 30;
  const sunLonAt2 = (t) => ephe.calcUt(t, SE.SUN, SIDEREAL_FLAGS2()).lon;
  const result = findAngleTime(jd - 32, jd, targetDeg, sunLonAt2);
  return result ?? jd;
}
function computeTamilCalendar(jd, sunSignId, sunSignStartJd, weekday, ephe, tamilMonths, samvatsaraNames, samvatsaraTaNames) {
  const [gregYear] = ephe.revjul(jd);
  const tamilMonth = tamilMonths[sunSignId];
  const dayInMonth = Math.floor(jd - sunSignStartJd) + 1;
  const shakaYear = gregYear - 78;
  const samvIdx = (shakaYear + 11) % 60;
  const EN_DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ];
  const TA_DAYS = [
    "\u0BA4\u0BBF\u0B99\u0BCD\u0B95\u0BB3\u0BCD",
    "\u0B9A\u0BC6\u0BB5\u0BCD\u0BB5\u0BBE\u0BAF\u0BCD",
    "\u0BAA\u0BC1\u0BA4\u0BA9\u0BCD",
    "\u0BB5\u0BBF\u0BAF\u0BBE\u0BB4\u0BA9\u0BCD",
    "\u0BB5\u0BC6\u0BB3\u0BCD\u0BB3\u0BBF",
    "\u0B9A\u0BA9\u0BBF",
    "\u0B9E\u0BBE\u0BAF\u0BBF\u0BB1\u0BC1"
  ];
  const monthStartIso = (() => {
    const [sy, sm, sd, sh] = ephe.revjul(sunSignStartJd);
    return `${sy}-${String(sm).padStart(2, "0")}-${String(sd).padStart(2, "0")}`;
  })();
  return {
    week_day: {
      en: EN_DAYS[weekday - 1] ?? "",
      ta: TA_DAYS[weekday - 1] ?? ""
    },
    tamil_date: `${dayInMonth} ${tamilMonth?.ta ?? ""}`,
    tamil_month: {
      id: sunSignId,
      en: tamilMonth?.en ?? "",
      ta: tamilMonth?.ta ?? "",
      rashi: ""
    },
    tamil_year: {
      id: samvIdx + 1,
      name_en: samvatsaraNames[samvIdx] ?? "",
      name_ta: samvatsaraTaNames[samvIdx] ?? "",
      gregorian_start_year: gregYear
    },
    month_start_iso: monthStartIso,
    nokku_naal: "",
    kari_naal: false,
    thaniya_naal: false
  };
}

// src/calculations/tarabalam.ts
function computeTarabalam(birthNakIdx, namesFn) {
  const good_nakshatras = [];
  for (let i = 0; i < 27; i++) {
    const offset = (i - birthNakIdx + 27) % 27;
    if (GOOD_TARA_OFFSETS.has(offset)) {
      good_nakshatras.push({ nakshatra: namesFn(i), index: i });
    }
  }
  return { good_nakshatras };
}

// src/calculations/chandrabalam.ts
function computeChandrabalam(birthSignId, namesFn) {
  const good_rashis = [];
  const birthIdx = birthSignId - 1;
  for (let i = 0; i < 12; i++) {
    const offset = (i - birthIdx + 12) % 12;
    if (GOOD_CHANDRA_OFFSETS.has(offset)) {
      good_rashis.push({ rashi: namesFn(i), index: i + 1 });
    }
  }
  return { good_rashis };
}

// src/calculations/ganda-mula-ravi-yoga.ts
var GANDA_MULA_INDICES = /* @__PURE__ */ new Set([0, 8, 9, 17, 18, 26]);
function detectGandaMula(nakshatras) {
  for (const nak of nakshatras) {
    if (GANDA_MULA_INDICES.has(nak.index)) {
      return { nakshatra: nak.name, ends_at: nak.ends_at };
    }
  }
  return null;
}
var RAVI_YOGA_COMBOS = {
  7: /* @__PURE__ */ new Set([7, 14, 21]),
  // Sunday + Pushya(7), Swati(14), Shravana(21)
  1: /* @__PURE__ */ new Set([3, 10, 17])
  // Monday + Rohini(3), Magha(9)... (simplified)
};
function detectRaviYoga(sunNakIdx, weekday, sunriseIso, sunsetIso) {
  const set = RAVI_YOGA_COMBOS[weekday];
  if (!set || !set.has(sunNakIdx)) return null;
  return { start: sunriseIso, end: sunsetIso };
}

// src/api/get-panchang.ts
function todayDate() {
  return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
function dateToJdNoon(dateStr, ephe) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return ephe.julday(y, m, d, 12);
}
async function computeDetailedPanchang(date, latitude, longitude, timezone = "UTC", locale4 = "en") {
  const ephe = EphemerisService.getInstance();
  if (!ephe.initialized) {
    try {
      await ephe.init();
    } catch (err) {
      throw new PanchangError(
        "EPHEMERIS_ERROR",
        `Ephemeris initialization failed: ${String(err)}`
      );
    }
  }
  const dateStr = date ?? todayDate();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new PanchangError("INVALID_DATE", `Invalid date format: ${dateStr}`);
  }
  const lat = latitude ?? 0;
  const lon = longitude ?? 0;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw new PanchangError(
      "INVALID_LOCATION",
      `Invalid coordinates: ${lat}, ${lon}`
    );
  }
  try {
    const table = getLocaleTable(locale4);
    const jdNoon = dateToJdNoon(dateStr, ephe);
    const flags = SE.FLG_SWIEPH | SE.FLG_SPEED | SE.FLG_SIDEREAL;
    const sunPos = ephe.calcUt(jdNoon, SE.SUN, flags);
    const moonPos = ephe.calcUt(jdNoon, SE.MOON, flags);
    const sunLon = sunPos.lon;
    const moonLon = moonPos.lon;
    const solarTimes = computeSolarTimes(jdNoon, lat, lon, ephe);
    const sunriseJd = solarTimes.sunrise ?? jdNoon - 0.25;
    const sunsetJd = solarTimes.sunset ?? jdNoon + 0.25;
    const nextSunriseJd = solarTimes.nextSunrise ?? sunriseJd + 1;
    const sunriseIso = solarTimes.sunrise != null ? jdToIso(sunriseJd, ephe) : null;
    const sunsetIso = solarTimes.sunset != null ? jdToIso(sunsetJd, ephe) : null;
    const moonriseIso = solarTimes.moonrise != null ? jdToIso(solarTimes.moonrise, ephe) : null;
    const moonsetIso = solarTimes.moonset != null ? jdToIso(solarTimes.moonset, ephe) : null;
    const nextSunriseIso = solarTimes.nextSunrise != null ? jdToIso(nextSunriseJd, ephe) : null;
    const dayInfo = computeDaySegments(sunriseJd, sunsetJd, nextSunriseJd);
    const weekday = ephe.isoWeekday(jdNoon);
    const vara = {
      index: weekday,
      sanskrit: table.varas[weekday] ?? "",
      english: table.varaEnglish[weekday] ?? ""
    };
    const winStart = sunriseJd;
    const winEnd = nextSunriseJd;
    const tithiSeq = generateTithis(
      winStart,
      winEnd,
      ephe,
      (i) => table.tithis[i] ?? `Tithi ${i}`
    );
    const tithiNow = tithiSeq[0] ?? null;
    const nakSeq = generateNakshatras(
      winStart,
      winEnd,
      ephe,
      (i) => table.nakshatras[i] ?? `Nak ${i}`
    );
    const nakNow = nakSeq[0] ?? null;
    const yogaSeq = generateYogas(
      winStart,
      winEnd,
      ephe,
      (i) => table.yogas[i] ?? `Yoga ${i}`
    );
    const yogaNow = yogaSeq[0] ?? null;
    const karanaSeq = generateKaranas(winStart, winEnd, ephe);
    const karanaNow = karanaSeq[0] ?? null;
    const moonSignSeq = generateMoonSigns(
      winStart,
      winEnd,
      ephe,
      (i) => table.rashis[i] ?? "",
      (i) => table.rashis[i] ?? ""
    );
    const moonSignNow = moonSignSeq[0] ?? null;
    const sunSignId = signIdFromLon(sunLon);
    const sunsign = {
      index: sunSignId,
      sign: table.signs[sunSignId - 1] ?? "",
      rashi: table.rashis[sunSignId - 1] ?? "",
      longitude: sunLon
    };
    const sunNakIdx = Math.floor((sunLon % 360 + 360) % 360 / NAK_SPAN);
    const suryaNak = {
      index: sunNakIdx,
      name: table.nakshatras[sunNakIdx] ?? "",
      pada: Math.floor(
        (sunLon % 360 + 360) % 360 % NAK_SPAN / (NAK_SPAN / 4)
      ) + 1,
      ends_at: null
    };
    const moonNakPadas = generateNakshatraPadas(
      winStart,
      winEnd,
      ephe,
      (i) => table.nakshatras[i] ?? ""
    );
    const tIdx = tithiIndex(sunLon, moonLon);
    const paksha = tIdx <= 15 ? "Shukla Paksha" : "Krishna Paksha";
    const brahma = brahmaMuhurta(sunriseJd, nextSunriseJd, ephe);
    const pratah = pratahSandhya(sunriseJd, sunsetJd, nextSunriseJd, ephe);
    const abhijit = abhijitMuhurta(
      sunriseJd,
      sunsetJd,
      nextSunriseJd,
      weekday,
      ephe
    );
    const vijay = vijayMuhurta(sunriseJd, sunsetJd, nextSunriseJd, ephe);
    const godhuli = godhuliMuhurta(sunsetJd, ephe);
    const sayahna = sayahnaSandhya(sunriseJd, sunsetJd, nextSunriseJd, ephe);
    const nishita = nishitaMuhurta(sunriseJd, sunsetJd, nextSunriseJd, ephe);
    const varjyamWins = [];
    const amritWins = [];
    for (const nak of nakSeq) {
      const w = varjyamWindow(
        nak.index,
        new Date(nak.starts_at ?? nak.ends_at).getTime() / 864e5 + 24405875e-1,
        new Date(nak.ends_at).getTime() / 864e5 + 24405875e-1,
        ephe
      );
      if (w) varjyamWins.push(w);
      const a = amritKalamWindow(
        nak.index,
        new Date(nak.starts_at ?? nak.ends_at).getTime() / 864e5 + 24405875e-1,
        new Date(nak.ends_at).getTime() / 864e5 + 24405875e-1,
        ephe
      );
      if (a) amritWins.push(a);
    }
    const curNakIdx = nakNow?.index ?? 0;
    const sarvarthaWins = [];
    const amritaSiddhiWins = [];
    const sv = sarvarthaSiddhiYoga(
      sunriseJd,
      sunsetJd,
      weekday,
      curNakIdx,
      ephe
    );
    if (sv) sarvarthaWins.push(sv);
    const as = amritaSiddhiYoga(sunriseJd, sunsetJd, weekday, curNakIdx, ephe);
    if (as) amritaSiddhiWins.push(as);
    const rahuWin = rahuKalam(sunriseJd, sunsetJd, weekday, ephe);
    const yamaWin = yamaganda(sunriseJd, sunsetJd, weekday, ephe);
    const gulikaWin = gulikaKalam(sunriseJd, sunsetJd, weekday, ephe);
    const durWins = durMuhurtam(
      sunriseJd,
      sunsetJd,
      nextSunriseJd,
      weekday,
      ephe
    );
    const bhadraWins = bhadraWindows(karanaSeq);
    const madhyahnaJd = sunriseJd + (sunsetJd - sunriseJd) / 2;
    const udayaLagna = generateUdayaLagna(
      sunriseJd,
      nextSunriseJd,
      lat,
      lon,
      ephe,
      (id) => table.signs[id - 1] ?? "",
      (id) => table.rashis[id - 1] ?? ""
    );
    const gowri = computeGowri(
      sunriseJd,
      sunsetJd,
      nextSunriseJd,
      weekday,
      ephe
    );
    const hora = computeHora(sunriseJd, sunsetJd, nextSunriseJd, weekday, ephe);
    const inauspiciousWins = [
      ...rahuWin ? [rahuWin] : [],
      ...yamaWin ? [yamaWin] : [],
      ...gulikaWin ? [gulikaWin] : []
    ];
    const allHoras = [...hora.day, ...hora.night];
    const nallaNeramWins = computeNallaNeram(allHoras, inauspiciousWins);
    const calInfo = computeCalendars(
      jdNoon,
      sunLon,
      moonLon,
      tIdx,
      sunriseJd,
      ephe,
      table.samvatsaras
    );
    const sunSignStartJd = findLastSankranti(jdNoon, sunSignId, ephe);
    let tamilCal = null;
    try {
      tamilCal = computeTamilCalendar(
        jdNoon,
        sunSignId,
        sunSignStartJd,
        weekday,
        ephe,
        TAMIL_MONTHS_BY_SIGN,
        table.samvatsaras,
        table.samvatsaras
      );
    } catch {
    }
    const tarabalam = computeTarabalam(3, (i) => table.nakshatras[i] ?? "");
    const chandrabalam = computeChandrabalam(2, (i) => table.rashis[i] ?? "");
    const jupiterPos = ephe.calcUt(jdNoon, SE.JUPITER, flags);
    const venusPos = ephe.calcUt(jdNoon, SE.VENUS, flags);
    const tyajyam = computeTyajyam({
      nakshatras: nakSeq,
      tithis: tithiSeq,
      karanas: karanaSeq,
      sunriseIso: sunriseIso ?? jdToIso(sunriseJd, ephe),
      sunsetIso: sunsetIso ?? jdToIso(sunsetJd, ephe),
      weekday,
      gowri,
      lagnas: udayaLagna,
      signNames: table.signs,
      jupiterLon: jupiterPos.lon,
      venusLon: venusPos.lon,
      venusRetro: venusPos.speed < 0,
      sunLon,
      eclipseWins: [],
      tamilMonthEn: tamilCal?.tamil_month.en ?? ""
    });
    const gandaMula = detectGandaMula(nakSeq);
    const raviYoga = detectRaviYoga(
      sunNakIdx,
      weekday,
      sunriseIso ?? jdToIso(sunriseJd, ephe),
      sunsetIso ?? jdToIso(sunsetJd, ephe)
    );
    const moonSignId2 = moonSignNow?.index ?? 1;
    const shoolVasa = {
      disha_shool: DISHA_SHOOL[weekday] ?? "",
      rahu_vasa: RAHU_VASA[weekday] ?? "",
      chandra_vasa: CHANDRA_VASA[moonSignId2] ?? ""
    };
    return {
      date: dateStr,
      location: { latitude: lat, longitude: lon, timezone },
      sun_moon: {
        sunrise: sunriseIso,
        sunset: sunsetIso,
        moonrise: moonriseIso,
        moonset: moonsetIso,
        next_sunrise: nextSunriseIso,
        dinaman_hours: dayInfo.dinamanHours,
        ratriman_hours: dayInfo.ratrimanHours,
        madhyahna: jdToIso(madhyahnaJd, ephe)
      },
      vara,
      panchang: {
        tithi: tithiNow,
        tithi_sequence: tithiSeq,
        nakshatra: nakNow,
        nakshatra_sequence: nakSeq,
        yoga: yogaNow,
        yoga_sequence: yogaSeq,
        karana: karanaNow,
        karana_sequence: karanaSeq,
        paksha
      },
      rashi_nakshatra: {
        moonsign: moonSignNow,
        moonsign_sequence: moonSignSeq,
        sunsign,
        surya_nakshatra: suryaNak,
        moon_nakshatra_padas: moonNakPadas
      },
      lunar_month: {
        samvatsara_shaka: calInfo.samvatsaraShaka,
        samvatsara_vikram: calInfo.samvatsaraVikram,
        vikram_samvat: calInfo.vikramSamvat,
        shaka_samvat: calInfo.shaka,
        gujarati_samvat: calInfo.gujaratiSamvat,
        chandramasa_amanta: calInfo.chandramasaAmanta,
        chandramasa_purnimanta: calInfo.chandramasaPurnimanta,
        paksha,
        pravishte_day: calInfo.pravishteDays,
        nirayana_solar_month: calInfo.niraayanaSolarMonth
      },
      ritu_ayana: {
        drik_ritu: calInfo.drikRitu,
        drik_ayana: calInfo.drikAyana,
        vedic_ritu: calInfo.vedicRitu,
        vedic_ayana: calInfo.vedicAyana
      },
      auspicious_timings: {
        brahma_muhurta: brahma,
        pratah_sandhya: pratah,
        abhijit,
        vijay_muhurta: vijay,
        godhuli_muhurta: godhuli,
        sayahna_sandhya: sayahna,
        nishita_muhurta: nishita,
        amrit_kalam: amritWins,
        sarvartha_siddhi_yoga: sarvarthaWins,
        amrita_siddhi_yoga: amritaSiddhiWins
      },
      inauspicious_timings: {
        rahu_kalam: rahuWin,
        yamaganda: yamaWin,
        gulika_kalam: gulikaWin,
        dur_muhurtam: durWins,
        bhadra: bhadraWins,
        varjyam: varjyamWins
      },
      udaya_lagna: udayaLagna,
      chandrabalam,
      tarabalam,
      shool_vasa: shoolVasa,
      yogas_extra: {
        ganda_mula: gandaMula,
        ravi_yoga: raviYoga
      },
      gowri_panchang: gowri,
      hora,
      tyajyam,
      nalla_neram: nallaNeramWins,
      tamil_calendar: tamilCal,
      calendars: {
        kali_year: calInfo.kaliYear,
        kali_ahargana_days: calInfo.kaliAhargana,
        julian_day: calInfo.julianDay,
        modified_julian_day: calInfo.modifiedJulianDay,
        rata_die: calInfo.rataDie,
        ayanamsha_lahiri: calInfo.ayanamshaLahiri,
        national_civil_date: {
          month: calInfo.nationalCivilDate.month,
          day: calInfo.nationalCivilDate.day,
          shaka_year: calInfo.shakaYear
        },
        national_nirayana_date: {
          month: calInfo.nationalNirayanaDate.month,
          day: calInfo.nationalNirayanaDate.day,
          shaka_year: calInfo.shakaYear
        }
      }
    };
  } catch (err) {
    if (err instanceof PanchangError) throw err;
    throw new PanchangError("CALCULATION_FAILED", String(err));
  }
}

// src/constants/vargas.ts
var VARGA_ORDER = [
  1,
  2,
  3,
  4,
  7,
  9,
  10,
  11,
  12,
  16,
  20,
  24,
  27,
  30,
  40,
  45,
  60
];
var SIGN_QUALITY = {
  1: 1,
  2: 2,
  3: 3,
  4: 1,
  5: 2,
  6: 3,
  7: 1,
  8: 2,
  9: 3,
  10: 1,
  11: 2,
  12: 3
};
var D30_BREAKS_ODD = [0, 5, 10, 18, 25, 30];
var D30_BREAKS_EVEN = [0, 5, 12, 20, 25, 30];
var D30_SIGNS_ODD = [1, 11, 9, 3, 7];
var D30_SIGNS_EVEN = [2, 6, 12, 10, 8];

// src/calculations/vargas.ts
function vargaSign(longitude, varga) {
  const norm = longitude >= 0 && longitude < 360 ? longitude : (longitude % 360 + 360) % 360;
  const signId = Math.floor(norm / 30) + 1;
  const degInSign = norm - (signId - 1) * 30;
  switch (varga) {
    case 1:
      return signId;
    case 2: {
      const part = degInSign >= 15 ? 1 : 0;
      if (signId % 2 === 1)
        return part === 0 ? 5 : 4;
      else return part === 0 ? 4 : 5;
    }
    case 3: {
      const part = Math.floor(degInSign / 10);
      return (signId - 1 + part * 4) % 12 + 1;
    }
    case 4: {
      const part = Math.floor(degInSign / 7.5);
      return (signId - 1 + part * 3) % 12 + 1;
    }
    case 7: {
      const part = Math.floor(degInSign / (30 / 7));
      const start = signId % 2 === 1 ? signId : (signId - 1 + 6) % 12 + 1;
      return (start - 1 + part) % 12 + 1;
    }
    case 9: {
      return Math.floor(norm * 9 % 360 / 30) + 1;
    }
    case 10: {
      const part = Math.floor(degInSign / 3);
      const start = signId % 2 === 1 ? signId : (signId - 1 + 8) % 12 + 1;
      return (start - 1 + part) % 12 + 1;
    }
    case 11: {
      const start = ((1 - signId) % 12 + 12) % 12 + 1;
      const part = Math.floor(degInSign / (30 / 11));
      return (start - 1 + part) % 12 + 1;
    }
    case 12: {
      const part = Math.floor(degInSign / 2.5);
      return (signId - 1 + part) % 12 + 1;
    }
    case 16: {
      const quality = SIGN_QUALITY[signId];
      const startSign = quality === 1 ? 1 : quality === 2 ? 5 : 9;
      const part = Math.floor(degInSign / (30 / 16));
      return (startSign - 1 + part) % 12 + 1;
    }
    case 20: {
      const quality = SIGN_QUALITY[signId];
      const startSign = quality === 1 ? 1 : quality === 3 ? 9 : 5;
      const part = Math.floor(degInSign / 1.5);
      return (startSign - 1 + part) % 12 + 1;
    }
    case 24: {
      const startSign = signId % 2 === 1 ? 4 : 5;
      const part = Math.floor(degInSign / 1.25);
      return (startSign - 1 + part) % 12 + 1;
    }
    case 27: {
      const elem = [1, 4, 1, 4, 1, 4, 1, 4, 1, 4, 1, 4][signId - 1];
      const STARTS = { 1: 1, 2: 10, 3: 7, 4: 4 };
      const elem2 = [1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4][signId - 1];
      const startSign = STARTS[elem2];
      const part = Math.floor(degInSign / (30 / 27));
      return (startSign - 1 + part) % 12 + 1;
    }
    case 30: {
      const breaks = signId % 2 === 1 ? D30_BREAKS_ODD : D30_BREAKS_EVEN;
      const signs = signId % 2 === 1 ? D30_SIGNS_ODD : D30_SIGNS_EVEN;
      for (let i = 0; i < breaks.length - 1; i++) {
        if (degInSign >= breaks[i] && degInSign < breaks[i + 1]) {
          return signs[i];
        }
      }
      return signs[signs.length - 1];
    }
    case 40: {
      const startSign = signId % 2 === 1 ? 1 : 7;
      const part = Math.floor(degInSign / 0.75);
      return (startSign - 1 + part) % 12 + 1;
    }
    case 45: {
      const quality = SIGN_QUALITY[signId];
      const startSign = quality === 1 ? 1 : quality === 2 ? 5 : 9;
      const part = Math.floor(degInSign / (30 / 45));
      return (startSign - 1 + part) % 12 + 1;
    }
    case 60: {
      const part = Math.floor(degInSign / 0.5);
      return (signId - 1 + part) % 12 + 1;
    }
    default:
      return signId;
  }
}
function vargaDegreeInSign(longitude, varga) {
  const norm = (longitude % 360 + 360) % 360;
  if (varga === 1) {
    return norm - Math.floor(norm / 30) * 30;
  }
  const partSize = 30 / varga;
  const degInSign = norm - Math.floor(norm / 30) * 30;
  const partFrac = degInSign % partSize / partSize;
  return partFrac * 30;
}
function buildVargaCharts(planetLongitudes, ascLon, vargaNames, vargaSubtitles) {
  const charts = {};
  for (const v of VARGA_ORDER) {
    const chart = {};
    for (let h = 1; h <= 12; h++) chart[h] = [];
    const ascSignId = vargaSign(ascLon, v);
    const planetDegrees = {};
    for (const [abbr, lon] of Object.entries(planetLongitudes)) {
      const pSignId = vargaSign(lon, v);
      const house = (pSignId - ascSignId + 12) % 12 + 1;
      chart[house].push(abbr);
      planetDegrees[abbr] = vargaDegreeInSign(lon, v);
    }
    charts[`d${v}`] = {
      chart,
      asc_sign: ascSignId,
      name: vargaNames[v] ?? `D${v}`,
      subtitle: vargaSubtitles[v] ?? "",
      division: v,
      planet_degrees: planetDegrees
    };
  }
  return charts;
}

// src/calculations/dasha.ts
var DAYS_PER_YEAR = 365.25;
function addYears(date, years) {
  return new Date(date.getTime() + years * DAYS_PER_YEAR * 86400 * 1e3);
}
function toIso(d) {
  return d.toISOString().replace(".000Z", "Z");
}
function computeMahadashas(moonLon, birthUtc) {
  const norm = (moonLon % 360 + 360) % 360;
  const nakIdx = Math.floor(norm / NAK_SPAN);
  const degInNak = norm - nakIdx * NAK_SPAN;
  const fractionElapsed = degInNak / NAK_SPAN;
  const lordIdx = nakIdx % 9;
  const firstLord = NAKSHATRA_LORD_CYCLE[lordIdx];
  const balanceYears = DASHA_YEARS[firstLord] * (1 - fractionElapsed);
  const dashas = [];
  let cur = birthUtc;
  let seqIdx = lordIdx;
  for (let i = 0; i < 9; i++) {
    const lord = DASHA_SEQUENCE[seqIdx % 9];
    const years = i === 0 ? balanceYears : DASHA_YEARS[lord];
    const end = addYears(cur, years);
    dashas.push({
      lord,
      start: toIso(cur),
      end: toIso(end),
      years
    });
    cur = end;
    seqIdx = (seqIdx + 1) % 9;
  }
  return dashas;
}
function computeAntardashas(md) {
  const mdStart = new Date(md.start);
  const mdYears = md.years;
  const lordIdx = DASHA_SEQUENCE.indexOf(
    md.lord
  );
  const antardashas = [];
  let cur = mdStart;
  for (let i = 0; i < 9; i++) {
    const adLord = DASHA_SEQUENCE[(lordIdx + i) % 9];
    const adYears = mdYears * DASHA_YEARS[adLord] / DASHA_TOTAL_YEARS;
    const end = addYears(cur, adYears);
    antardashas.push({
      lord: adLord,
      start: toIso(cur),
      end: toIso(end),
      years: adYears
    });
    cur = end;
  }
  return antardashas;
}
function computePratyantars(ad) {
  const adStart = new Date(ad.start);
  const adYears = ad.years;
  const lordIdx = DASHA_SEQUENCE.indexOf(
    ad.lord
  );
  const pratyantars = [];
  let cur = adStart;
  for (let i = 0; i < 9; i++) {
    const pdLord = DASHA_SEQUENCE[(lordIdx + i) % 9];
    const pdYears = adYears * DASHA_YEARS[pdLord] / DASHA_TOTAL_YEARS;
    const end = addYears(cur, pdYears);
    pratyantars.push({
      lord: pdLord,
      start: toIso(cur),
      end: toIso(end),
      years: pdYears
    });
    cur = end;
  }
  return pratyantars;
}
function enrichWithAntardashas(dashas, includePratyantars = false) {
  return dashas.map((md) => {
    const antardashas = computeAntardashas(md).map((ad) => ({
      ...ad,
      pratyantars: includePratyantars ? computePratyantars(ad) : void 0
    }));
    return { ...md, antardashas };
  });
}

// src/calculations/ashtakavarga.ts
function computeAshtakavarga(planetSigns, ascSignId) {
  const BAV_PLANETS = [
    "Sun",
    "Moon",
    "Mars",
    "Mercury",
    "Jupiter",
    "Venus",
    "Saturn"
  ];
  const bav = {};
  for (const p of BAV_PLANETS) {
    bav[p] = new Array(12).fill(0);
  }
  const contributorSigns = {
    Sun: planetSigns["Su"] ?? 1,
    Moon: planetSigns["Mo"] ?? 1,
    Mars: planetSigns["Ma"] ?? 1,
    Mercury: planetSigns["Me"] ?? 1,
    Jupiter: planetSigns["Ju"] ?? 1,
    Venus: planetSigns["Ve"] ?? 1,
    Saturn: planetSigns["Sa"] ?? 1,
    Asc: ascSignId
  };
  for (const planet of BAV_PLANETS) {
    const rules = BAV_RULES[planet];
    if (!rules) continue;
    for (const contributor of BAV_CONTRIBUTORS) {
      const houseOffsets = rules[contributor];
      if (!houseOffsets) continue;
      const contribSign = contributorSigns[contributor] ?? 1;
      for (const offset of houseOffsets) {
        const targetSign = ((contribSign - 1 + offset - 1) % 12 + 12) % 12;
        bav[planet][targetSign] += 1;
      }
    }
  }
  const sav = new Array(12).fill(0);
  for (const points of Object.values(bav)) {
    for (let i = 0; i < 12; i++) {
      sav[i] += points[i];
    }
  }
  return { bav, sav };
}

// src/calculations/placements.ts
function withinOrb2(a, b, orb) {
  const diff = Math.abs(a - b);
  return diff <= orb || diff >= 360 - orb;
}
function isExalted(planet, signId, deg) {
  const ex = EXALTATION[planet];
  if (!ex) return false;
  return ex.sign === signId && Math.abs(deg - ex.degree) <= 1;
}
function isDebilitated(planet, signId, deg) {
  const db = DEBILITATION[planet];
  if (!db) return false;
  return db.sign === signId && Math.abs(deg - db.degree) <= 1;
}
function isOwnSign(planet, signId) {
  return (OWN_SIGNS[planet] ?? []).includes(signId);
}
function isMoolatrikona(planet, signId, deg) {
  const mt = MOOLATRIKONA[planet];
  if (!mt) return false;
  return mt.sign === signId && deg >= mt.start && deg <= mt.end;
}
function isVargottama(longitude) {
  return vargaSign(longitude, 1) === vargaSign(longitude, 9);
}
function isDigbala(planet, signId) {
  return DIGBALA_SIGNS[planet] === signId;
}
function isPushkaraBhaga(signId, deg) {
  const pb = PUSHKARA_BHAGA[signId];
  if (!pb) return false;
  return pb.includes(Math.round(deg));
}
function isPushkaraNavamsa(longitude) {
  return PUSHKARA_NAVAMSA_SIGNS.has(vargaSign(longitude, 9));
}
function isMrityuBhaga(planet, signId, deg) {
  const mb = MRITYU_BHAGA[planet];
  if (!mb) return false;
  const mbDeg = mb[signId];
  return mbDeg != null && Math.abs(deg - mbDeg) < 1;
}
function isGandanta(signId, deg) {
  for (const jn of GANDANTA_JUNCTIONS) {
    if (jn.sign !== signId) continue;
    if (jn.edge === "start" && deg <= jn.orb) return true;
    if (jn.edge === "end" && deg >= 30 - jn.orb) return true;
  }
  return false;
}
function isCombust(planet, lon, sunLon) {
  if (!COMBUST_PLANETS.has(planet)) return false;
  return withinOrb2(lon, sunLon, COMBUST_ORB);
}
function isNeechaBhanga(planet, signId, planetSigns, ascSignId) {
  const db = DEBILITATION[planet];
  if (!db || db.sign !== signId) return false;
  const SIGN_LORDS = {
    1: ["Ma"],
    2: ["Ve"],
    3: ["Me"],
    4: ["Mo"],
    5: ["Su"],
    6: ["Me"],
    7: ["Ve"],
    8: ["Ma"],
    9: ["Ju"],
    10: ["Sa"],
    11: ["Sa"],
    12: ["Ju"]
  };
  const lords = SIGN_LORDS[db.sign] ?? [];
  for (const abbr of lords) {
    const lSign = planetSigns[abbr];
    if (lSign == null) continue;
    const houseFromAsc = (lSign - ascSignId + 12) % 12 + 1;
    if ([1, 4, 7, 10].includes(houseFromAsc)) return true;
  }
  return false;
}
function computeParivartana(planetSigns) {
  const NAME_MAP = {
    Su: "Sun",
    Mo: "Moon",
    Ma: "Mars",
    Me: "Mercury",
    Ju: "Jupiter",
    Ve: "Venus",
    Sa: "Saturn"
  };
  const result = {};
  const abbrs = Object.keys(planetSigns);
  for (const a of abbrs) {
    result[a] = null;
    for (const b of abbrs) {
      if (a === b) continue;
      const aSign = planetSigns[a];
      const bSign = planetSigns[b];
      if ((OWN_SIGNS[NAME_MAP[b] ?? ""] ?? []).includes(aSign) && (OWN_SIGNS[NAME_MAP[a] ?? ""] ?? []).includes(bSign)) {
        result[a] = b;
        break;
      }
    }
  }
  return result;
}
function computeGrahaYuddha(planets) {
  const ELIGIBLE = /* @__PURE__ */ new Set(["Ma", "Me", "Ju", "Ve", "Sa"]);
  const result = {};
  for (const p of planets) {
    result[p.abbr] = null;
  }
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const a = planets[i];
      const b = planets[j];
      if (!ELIGIBLE.has(a.abbr) || !ELIGIBLE.has(b.abbr)) continue;
      const diff = Math.abs(a.lon - b.lon);
      if (diff <= 1 || diff >= 359) {
        result[a.abbr] = b.abbr;
        result[b.abbr] = a.abbr;
      }
    }
  }
  return result;
}
function applySpecialPlacements(positions, ascSignId, sunLon) {
  const planetSigns = {};
  const planetLons = {};
  const planetLats = {};
  for (const p of positions) {
    planetSigns[p.abbr] = p.sign_id;
    planetLons[p.abbr] = p.longitude;
    planetLats[p.abbr] = 0;
  }
  const parivartana = computeParivartana(planetSigns);
  const yuddha = computeGrahaYuddha(
    positions.map((p) => ({ abbr: p.abbr, lon: p.longitude, lat: 0 }))
  );
  for (const p of positions) {
    const { name, abbr, sign_id, degree_in_sign, longitude } = p;
    p.exalted = isExalted(name, sign_id, degree_in_sign);
    p.debilitated = isDebilitated(name, sign_id, degree_in_sign);
    p.own_sign = isOwnSign(name, sign_id);
    p.moolatrikona = isMoolatrikona(name, sign_id, degree_in_sign);
    p.vargottama = isVargottama(longitude);
    p.digbala = isDigbala(name, sign_id);
    p.pushkara_bhaga = isPushkaraBhaga(sign_id, degree_in_sign);
    p.pushkara_navamsa = isPushkaraNavamsa(longitude);
    p.mrityu_bhaga = isMrityuBhaga(name, sign_id, degree_in_sign);
    p.gandanta = isGandanta(sign_id, degree_in_sign);
    p.combust = isCombust(name, longitude, sunLon);
    p.neecha_bhanga = isNeechaBhanga(name, sign_id, planetSigns, ascSignId);
    p.parivartana = parivartana[abbr] != null;
    p.parivartana_with = parivartana[abbr] ?? null;
    p.graha_yuddha = yuddha[abbr] != null;
    p.graha_yuddha_with = yuddha[abbr] ?? null;
  }
  return positions;
}

// src/calculations/jaimini.ts
var KARAKA_TITLES = [
  "Atmakaraka",
  "Amatyakaraka",
  "Bhratrukaraka",
  "Matrukaraka",
  "Putrakaraka",
  "Gnatikaraka",
  "Darakaraka"
];
var KARAKA_ABBRS = ["AK", "AmK", "BK", "MK", "PK", "GK", "DK"];
var CHARA_PLANETS = ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa"];
function computeKarakas(positions, namesFn) {
  const eligible = positions.filter((p) => CHARA_PLANETS.includes(p.abbr)).map((p) => ({
    ...p,
    _degInSign: degreeInSign(p.longitude)
  })).sort((a, b) => b._degInSign - a._degInSign);
  return eligible.slice(0, 7).map((p, i) => ({
    rank: i + 1,
    abbr: KARAKA_ABBRS[i],
    title: KARAKA_TITLES[i],
    planet: p.name,
    planet_abbr: p.abbr,
    sign: namesFn(p.sign_id),
    sign_id: p.sign_id,
    degree_in_sign: p._degInSign,
    dms: formatDms(p._degInSign)
  }));
}
function computeKarakamsa(atmakaraka, d9Chart, d9AscSign, namesFn) {
  let akSign = -1;
  for (const [house, abbrs] of Object.entries(d9Chart)) {
    if (abbrs.includes(atmakaraka.planet_abbr)) {
      const h = parseInt(house, 10);
      akSign = (d9AscSign - 1 + h - 1) % 12 + 1;
      break;
    }
  }
  const karakamsa = akSign > 0 ? namesFn(akSign) : "";
  return { karakamsa, swamsa: karakamsa };
}

// src/calculations/relationships.ts
var NATURAL = {
  Sun: {
    Sun: "N",
    Moon: "F",
    Mars: "F",
    Mercury: "N",
    Jupiter: "F",
    Venus: "E",
    Saturn: "E",
    Rahu: "E",
    Ketu: "E"
  },
  Moon: {
    Sun: "F",
    Moon: "N",
    Mars: "N",
    Mercury: "F",
    Jupiter: "F",
    Venus: "N",
    Saturn: "N",
    Rahu: "N",
    Ketu: "N"
  },
  Mars: {
    Sun: "F",
    Moon: "N",
    Mars: "N",
    Mercury: "E",
    Jupiter: "F",
    Venus: "N",
    Saturn: "N",
    Rahu: "N",
    Ketu: "N"
  },
  Mercury: {
    Sun: "F",
    Moon: "N",
    Mars: "N",
    Mercury: "N",
    Jupiter: "N",
    Venus: "F",
    Saturn: "N",
    Rahu: "F",
    Ketu: "N"
  },
  Jupiter: {
    Sun: "F",
    Moon: "F",
    Mars: "F",
    Mercury: "E",
    Jupiter: "N",
    Venus: "E",
    Saturn: "E",
    Rahu: "E",
    Ketu: "F"
  },
  Venus: {
    Sun: "E",
    Moon: "N",
    Mars: "N",
    Mercury: "F",
    Jupiter: "N",
    Venus: "N",
    Saturn: "F",
    Rahu: "F",
    Ketu: "N"
  },
  Saturn: {
    Sun: "E",
    Moon: "E",
    Mars: "E",
    Mercury: "F",
    Jupiter: "E",
    Venus: "F",
    Saturn: "N",
    Rahu: "F",
    Ketu: "N"
  },
  Rahu: {
    Sun: "E",
    Moon: "E",
    Mars: "E",
    Mercury: "F",
    Jupiter: "E",
    Venus: "F",
    Saturn: "F",
    Rahu: "N",
    Ketu: "N"
  },
  Ketu: {
    Sun: "E",
    Moon: "E",
    Mars: "F",
    Mercury: "N",
    Jupiter: "F",
    Venus: "N",
    Saturn: "N",
    Rahu: "N",
    Ketu: "N"
  }
};
var PLANET_LIST = [
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn"
];
function computeTemporalFriendships(planetSigns) {
  const FRIEND_OFFSETS = /* @__PURE__ */ new Set([2, 3, 4, 10, 11, 12]);
  const temporal = {};
  for (const p of PLANET_LIST) {
    temporal[p] = {};
    const pSign = planetSigns[p] ?? 1;
    for (const q of PLANET_LIST) {
      if (p === q) {
        temporal[p][q] = "N";
        continue;
      }
      const qSign = planetSigns[q] ?? 1;
      const offset = (qSign - pSign + 12) % 12 + 1;
      temporal[p][q] = FRIEND_OFFSETS.has(offset) ? "F" : "E";
    }
  }
  return temporal;
}
function computeCompositeRelationship(nat, tmp) {
  const score = (r) => r === "F" ? 1 : r === "E" ? -1 : 0;
  const total = score(nat) + score(tmp);
  if (total >= 2) return "GF";
  if (total === 1) return "F";
  if (total === 0) return "N";
  if (total === -1) return "E";
  return "GE";
}
function computeFriendships(planetSigns) {
  const temporal = computeTemporalFriendships(planetSigns);
  const composite = {};
  for (const p of PLANET_LIST) {
    composite[p] = {};
    for (const q of PLANET_LIST) {
      const nat = NATURAL[p]?.[q] ?? "N";
      const tmp = temporal[p]?.[q] ?? "N";
      composite[p][q] = computeCompositeRelationship(nat, tmp);
    }
  }
  return {
    natural: NATURAL,
    temporal,
    composite
  };
}

// src/calculations/aspects.ts
var SPECIAL_ASPECTS = {
  Mars: [4, 8],
  Jupiter: [5, 9],
  Saturn: [3, 10],
  Rahu: [5, 9],
  Ketu: [5, 9]
};
var BENEFIC_PLANETS = /* @__PURE__ */ new Set(["Jupiter", "Venus", "Moon", "Mercury"]);
function computeAspects(positions) {
  const aspects = [];
  const byPlanet = {};
  for (const planet of positions) {
    const fromHouse = planet.house;
    const fromSign = planet.sign_id;
    const benefic = BENEFIC_PLANETS.has(planet.name);
    const offsets = /* @__PURE__ */ new Set([7]);
    for (const sp of SPECIAL_ASPECTS[planet.name] ?? []) {
      offsets.add(sp);
    }
    const aspectedHouses = [];
    const details = [];
    for (const offset of offsets) {
      const toHouse = (fromHouse - 1 + offset - 1) % 12 + 1;
      const toSign = (fromSign - 1 + offset - 1) % 12 + 1;
      const type = offset === 7 ? "standard" : "special";
      const strength = offset === 7 ? 100 : 75;
      const edge = {
        planet: planet.name,
        planet_abbr: planet.abbr,
        from_sign: fromSign,
        from_house: fromHouse,
        to_sign: toSign,
        to_house: toHouse,
        offset,
        aspect_type: type,
        strength,
        benefic
      };
      aspects.push(edge);
      aspectedHouses.push(toHouse);
      details.push(edge);
    }
    byPlanet[planet.abbr] = {
      name: planet.name,
      abbr: planet.abbr,
      house: fromHouse,
      benefic,
      retrograde: planet.retrograde,
      combust: planet.combust,
      aspected_houses: aspectedHouses,
      details
    };
  }
  const mutual = [];
  const seen = /* @__PURE__ */ new Set();
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const a = positions[i];
      const b = positions[j];
      const aAspects = byPlanet[a.abbr]?.aspected_houses ?? [];
      const bAspects = byPlanet[b.abbr]?.aspected_houses ?? [];
      if (aAspects.includes(b.house) && bAspects.includes(a.house)) {
        const key = [a.abbr, b.abbr].sort().join("-");
        if (!seen.has(key)) {
          seen.add(key);
          mutual.push({ planet1: a.abbr, planet2: b.abbr });
        }
      }
    }
  }
  return { aspects, by_planet: byPlanet, mutual };
}

// src/calculations/kalsarpa.ts
var KALSARPA_NAMES = [
  "Anant",
  "Kulik",
  "Vasuki",
  "Shankhpal",
  "Padma",
  "Mahapadma",
  "Takshak",
  "Karkotak",
  "Shankhachood",
  "Ghatak",
  "Vishaktak",
  "Sheshnag"
];
function onArc(lon, from, to) {
  const norm = (lon - from + 360) % 360;
  const arc = (to - from + 360) % 360;
  return norm > 0 && norm < arc;
}
function computeKalsarpa(planetLons, rahuHouse, ketuHouse) {
  const rahuLon = planetLons["Rahu"] ?? planetLons["Ra"];
  const ketuLon = planetLons["Ketu"] ?? planetLons["Ke"];
  if (rahuLon == null || ketuLon == null) {
    return {
      present: false,
      verdict: "Kalsarpa Yoga not present",
      kind: null,
      direction: null,
      rahu_house: rahuHouse,
      ketu_house: ketuHouse
    };
  }
  const VISIBLE = [
    "Sun",
    "Moon",
    "Mars",
    "Mercury",
    "Jupiter",
    "Venus",
    "Saturn"
  ];
  const lons = VISIBLE.map((p) => planetLons[p]).filter(
    (l) => l != null
  );
  const forwardArc = (ketuLon - rahuLon + 360) % 360;
  const reverseArc = (rahuLon - ketuLon + 360) % 360;
  const allOnForward = lons.every((l) => onArc(l, rahuLon, ketuLon));
  const allOnReverse = lons.every((l) => onArc(l, ketuLon, rahuLon));
  if (!allOnForward && !allOnReverse) {
    return {
      present: false,
      verdict: "Kalsarpa Yoga not present",
      kind: null,
      direction: null,
      rahu_house: rahuHouse,
      ketu_house: ketuHouse
    };
  }
  const kind = KALSARPA_NAMES[(rahuHouse - 1) % 12];
  const direction = allOnForward ? "Forward (Rahu leading)" : "Reverse (Ketu leading)";
  const verdict = `${kind} Kalsarpa Yoga is present (${direction})`;
  return {
    present: true,
    verdict,
    kind,
    direction,
    rahu_house: rahuHouse,
    ketu_house: ketuHouse
  };
}

// src/api/calculate.ts
function parseLocalTime(date, time, timezone) {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mn] = time.split(":").map(Number);
  const isoLocal = `${date}T${String(h).padStart(2, "0")}:${String(mn).padStart(2, "0")}:00`;
  const utc = localToUtc(isoLocal, timezone);
  return utc;
}
function localToUtc(isoLocal, tz) {
  const candidate = /* @__PURE__ */ new Date(isoLocal + "Z");
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
  const parts = fmt.formatToParts(candidate);
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  const tzY = get("year");
  const tzMo = get("month");
  const tzD = get("day");
  const tzH = get("hour") === 24 ? 0 : get("hour");
  const tzMn = get("minute");
  const tzS = get("second");
  const tzUtc = Date.UTC(tzY, tzMo - 1, tzD, tzH, tzMn, tzS);
  const offset = candidate.getTime() - tzUtc;
  return new Date((/* @__PURE__ */ new Date(isoLocal + "Z")).getTime() + offset);
}
function utcToJd(utcDate, ephe) {
  const y = utcDate.getUTCFullYear();
  const mo = utcDate.getUTCMonth() + 1;
  const d = utcDate.getUTCDate();
  const h = utcDate.getUTCHours() + utcDate.getUTCMinutes() / 60 + utcDate.getUTCSeconds() / 3600 + utcDate.getUTCMilliseconds() / 36e5;
  return ephe.julday(y, mo, d, h);
}
async function computeChart(birthInfo, locale4 = "en") {
  const ephe = EphemerisService.getInstance();
  if (!ephe.initialized) {
    try {
      await ephe.init();
    } catch (err) {
      throw new ChartError(
        "EPHEMERIS_ERROR",
        `Ephemeris initialization failed: ${String(err)}`
      );
    }
  }
  if (!birthInfo.date || !birthInfo.time) {
    throw new ChartError("INVALID_BIRTH_INFO", "date and time are required");
  }
  if (birthInfo.latitude < -90 || birthInfo.latitude > 90) {
    throw new ChartError("INVALID_BIRTH_INFO", "Invalid latitude");
  }
  const tz = birthInfo.timezone ?? "UTC";
  const ayanamsa = birthInfo.ayanamsa ?? "lahiri";
  try {
    const table = getLocaleTable(locale4);
    ephe.setAyanamsa(ayanamsa);
    const sidFlag = SE.FLG_SWIEPH | SE.FLG_SPEED | SE.FLG_SIDEREAL;
    const birthUtc = parseLocalTime(birthInfo.date, birthInfo.time, tz);
    const jd = utcToJd(birthUtc, ephe);
    const ayanamsaValue = ephe.getAyanamsaUt(jd);
    const ayanamsaLabel = AYANAMSA_MAP[ayanamsa]?.label ?? "";
    const housesResult = ephe.housesEx(
      jd,
      birthInfo.latitude,
      birthInfo.longitude
    );
    const ascLon = housesResult.ascendant;
    const SE_IDS = {
      Sun: SE.SUN,
      Moon: SE.MOON,
      Mars: SE.MARS,
      Mercury: SE.MERCURY,
      Jupiter: SE.JUPITER,
      Venus: SE.VENUS,
      Saturn: SE.SATURN,
      Uranus: SE.URANUS,
      Neptune: SE.NEPTUNE,
      Pluto: SE.PLUTO,
      Rahu: SE.MEAN_NODE
    };
    const sunCalc = ephe.calcUt(jd, SE.SUN, sidFlag);
    const ascSignId = signIdFromLon(ascLon);
    const planets = [];
    const planetLongitudes = {};
    const planetSigns = {};
    for (const { name, abbr } of PLANET_ORDER) {
      let lon;
      let speed;
      if (name === "Ketu") {
        const rahLon = planetLongitudes["Rahu"] ?? 0;
        lon = (rahLon + 180) % 360;
        speed = 0;
      } else {
        const seId = SE_IDS[name];
        if (seId == null) continue;
        const calc = ephe.calcUt(jd, seId, sidFlag);
        lon = (calc.lon % 360 + 360) % 360;
        speed = calc.speed;
      }
      const signId = signIdFromLon(lon);
      const degSign = degreeInSign(lon);
      const nakIdx = Math.floor((lon % 360 + 360) % 360 / NAK_SPAN);
      const nakPada = nakshatraPada(lon);
      const house = (signId - ascSignId + 12) % 12 + 1;
      const retrograde = speed < 0;
      const pos = {
        name,
        abbr,
        longitude: lon,
        sign_id: signId,
        sign: table.signs[signId - 1] ?? "",
        sign_lord: table.signLords[signId - 1] ?? "",
        degree_in_sign: degSign,
        dms: formatDms(degSign),
        nakshatra: table.nakshatras[nakIdx] ?? "",
        nakshatra_pada: nakPada,
        nakshatra_lord: table.nakshatraLords[nakIdx % 9] ?? "",
        retrograde,
        combust: false,
        house,
        exalted: false,
        debilitated: false,
        own_sign: false,
        moolatrikona: false,
        vargottama: false,
        digbala: false,
        pushkara_bhaga: false,
        pushkara_navamsa: false,
        mrityu_bhaga: false,
        gandanta: false,
        neecha_bhanga: false,
        parivartana: false,
        parivartana_with: null,
        graha_yuddha: false,
        graha_yuddha_with: null
      };
      planets.push(pos);
      planetLongitudes[abbr] = lon;
      planetLongitudes[name] = lon;
      planetSigns[abbr] = signId;
      planetSigns[name] = signId;
    }
    const ascSignDeg = degreeInSign(ascLon);
    const ascNakIdx = Math.floor((ascLon % 360 + 360) % 360 / NAK_SPAN);
    const ascPos = {
      name: "Ascendant",
      abbr: "As",
      longitude: (ascLon % 360 + 360) % 360,
      sign_id: ascSignId,
      sign: table.signs[ascSignId - 1] ?? "",
      sign_lord: table.signLords[ascSignId - 1] ?? "",
      degree_in_sign: ascSignDeg,
      dms: formatDms(ascSignDeg),
      nakshatra: table.nakshatras[ascNakIdx] ?? "",
      nakshatra_pada: nakshatraPada(ascLon),
      nakshatra_lord: table.nakshatraLords[ascNakIdx % 9] ?? "",
      retrograde: false,
      combust: false,
      house: 1,
      exalted: false,
      debilitated: false,
      own_sign: false,
      moolatrikona: false,
      vargottama: false,
      digbala: false,
      pushkara_bhaga: false,
      pushkara_navamsa: false,
      mrityu_bhaga: false,
      gandanta: false,
      neecha_bhanga: false,
      parivartana: false,
      parivartana_with: null,
      graha_yuddha: false,
      graha_yuddha_with: null
    };
    applySpecialPlacements(planets, ascSignId, sunCalc.lon);
    const vargas = buildVargaCharts(
      planetLongitudes,
      ascLon,
      table.vargaNames,
      table.vargaSubtitles
    );
    const moonLon = planetLongitudes["Mo"] ?? 0;
    const dashas = computeMahadashas(moonLon, birthUtc);
    const dashaAntar = enrichWithAntardashas(dashas);
    const ashtakavarga = computeAshtakavarga(planetSigns, ascSignId);
    const karakas = computeKarakas(planets, (id) => table.signs[id - 1] ?? "");
    const ak = karakas[0];
    const d9 = vargas["d9"];
    const { karakamsa, swamsa } = ak && d9 ? computeKarakamsa(
      ak,
      d9.chart,
      d9.asc_sign,
      (id) => table.signs[id - 1] ?? ""
    ) : { karakamsa: "", swamsa: "" };
    const friendships = computeFriendships(planetSigns);
    const drishti = computeAspects(
      planets.map((p) => ({
        name: p.name,
        abbr: p.abbr,
        house: p.house,
        sign_id: p.sign_id,
        retrograde: p.retrograde,
        combust: p.combust
      }))
    );
    const rahuHouse = planets.find((p) => p.name === "Rahu")?.house ?? 1;
    const ketuHouse = planets.find((p) => p.name === "Ketu")?.house ?? 7;
    const kalsarpa = computeKalsarpa(planetLongitudes, rahuHouse, ketuHouse);
    const d1 = vargas["d1"];
    const d2 = vargas["d2"];
    const d9c = vargas["d9"];
    return {
      birth: {
        local_time: birthInfo.date + "T" + birthInfo.time,
        utc_time: birthUtc.toISOString(),
        timezone: tz,
        latitude: birthInfo.latitude,
        longitude: birthInfo.longitude,
        julian_day: jd,
        ayanamsa: ayanamsaValue,
        ayanamsa_id: ayanamsa,
        ayanamsa_label: ayanamsaLabel
      },
      ascendant: ascPos,
      planets_data: planets,
      d1_chart: d1,
      d2_chart: d2,
      d9_chart: d9c,
      d1_asc_sign: table.signs[d1.asc_sign - 1] ?? "",
      d2_asc_sign: table.signs[d2.asc_sign - 1] ?? "",
      d9_asc_sign: table.signs[d9c.asc_sign - 1] ?? "",
      vargas,
      varga_order: VARGA_ORDER,
      dasha: dashas,
      dasha_antar: dashaAntar,
      karakas,
      karakamsa,
      swamsa,
      friendships,
      kalsarpa,
      ashtakavarga,
      drishti
    };
  } catch (err) {
    if (err instanceof ChartError) throw err;
    throw new ChartError("CALCULATION_FAILED", String(err));
  }
}

// example/entry.ts
var vpv = {
  computeDetailedPanchang,
  computeChart,
  PanchangError,
  ChartError,
  getLocaleTable,
  localeTables: TABLES,
  EphemerisService
};
globalThis.vpv = vpv;
