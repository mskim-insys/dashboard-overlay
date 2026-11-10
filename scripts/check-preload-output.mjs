import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

const preloadUrl = new URL("../out/preload/index.cjs", import.meta.url);
const source = await readFile(preloadUrl, "utf8");
assert.doesNotMatch(
  source,
  /^\s*import\s/m,
  "preload must not contain ESM imports",
);

let exposedName;
let exposedApi;
const electron = {
  contextBridge: {
    exposeInMainWorld(name, api) {
      exposedName = name;
      exposedApi = api;
    },
  },
  ipcRenderer: {
    invoke() {},
    on() {},
    removeListener() {},
    send() {},
  },
};

runInNewContext(source, {
  console: { info() {} },
  require: (id) => {
    assert.equal(id, "electron", "preload should only require Electron");
    return electron;
  },
});

assert.equal(exposedName, "dashboard");
assert.deepEqual(
  Object.keys(exposedApi).sort(),
  [
    "getInputDebugState",
    "getWindowState",
    "inputDebugEnabled",
    "isDesktop",
    "onInputDebugChange",
    "onWindowStateChange",
    "reportInputDebugEvent",
    "setPointerInteraction",
  ].sort(),
);
console.info(
  "Preload output is bundled CommonJS and exposes the expected dashboard API.",
);
