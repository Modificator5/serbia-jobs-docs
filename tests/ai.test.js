#!/usr/bin/env node
// Офлайн-тест разбора ответов воркера: parseJson и normalizeWorkerJson.
const assert = require("node:assert/strict");
const { parseJson, normalizeWorkerJson } = require("../tools/ai");

assert.deepEqual(parseJson('{"a":1}'), { a: 1 });
assert.deepEqual(parseJson('```json\n{"a":1}\n```'), { a: 1 });
assert.deepEqual(parseJson("before [1,2] after"), [1, 2]);
assert.equal(parseJson("no json here"), null);
assert.equal(parseJson('{"broken":'), null);

assert.deepEqual(normalizeWorkerJson('{"status":"success","data":{"x":1}}'), { x: 1 });
assert.deepEqual(normalizeWorkerJson('{"status":"SUCCESS","data":[1]}'), [1]);
assert.deepEqual(normalizeWorkerJson('{"raw":"json"}'), { raw: "json" }); // без конверта
assert.throws(() => normalizeWorkerJson('{"status":"error","message":"boom"}'), /status=error.*boom/);
assert.throws(() => normalizeWorkerJson('{"status":"success"}'), /без поля data/);
assert.throws(() => normalizeWorkerJson("plain text"), /не является JSON/);

console.log("OK: ai (parseJson fences/arrays, envelope, raw, errors)");
