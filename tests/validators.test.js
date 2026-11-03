#!/usr/bin/env node
// Офлайн-тест валидаторов LLM-вывода (T2.5). Без сети и БД.
const assert = require("node:assert/strict");
const { isValidTitleRu, isValidDefinition, MAX_TITLE, MAX_DEFINITION } = require("../tools/validators");

// title_ru
assert.equal(isValidTitleRu("Официант"), true);
assert.equal(isValidTitleRu("Менеджер по продажам"), true);
assert.equal(isValidTitleRu("IT-специалист"), true);
assert.equal(isValidTitleRu("Инженер DevOps"), true);
assert.equal(isValidTitleRu("Разработчик JavaScript"), true);
assert.equal(isValidTitleRu("Senior JavaScript разработчик"), false);
assert.equal(isValidTitleRu(""), false);
assert.equal(isValidTitleRu("   "), false);
assert.equal(isValidTitleRu(null), false);
assert.equal(isValidTitleRu(42), false);
assert.equal(isValidTitleRu("Sales Manager"), false);
assert.equal(isValidTitleRu("Официант https://example.com"), false);
assert.equal(isValidTitleRu("Официант\nВторая строка"), false);
assert.equal(isValidTitleRu("я".repeat(MAX_TITLE + 1)), false);
assert.equal(isValidTitleRu("я".repeat(MAX_TITLE)), true);

// definition
assert.equal(isValidDefinition("краткое профессиональное определение"), true);
assert.equal(isValidDefinition("термин с латиницей: Kubernetes"), true);
assert.equal(isValidDefinition(""), false);
assert.equal(isValidDefinition("   "), false);
assert.equal(isValidDefinition(null), false);
assert.equal(isValidDefinition("см. https://example.com"), false);
assert.equal(isValidDefinition("я".repeat(MAX_DEFINITION + 1)), false);
assert.equal(isValidDefinition("я".repeat(MAX_DEFINITION)), true);

console.log("OK: validators (title_ru cyrillic/URL/length, definition length/URL)");
