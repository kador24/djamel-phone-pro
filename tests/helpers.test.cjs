const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const test = require('node:test');
const ts = require('typescript');

// Load the project's TypeScript helper module directly. It needs no browser or network.
const helperPath = path.resolve(__dirname, '../src/lib/helpers.ts');
const source = fs.readFileSync(helperPath, 'utf8');
const compiled = ts.transpileModule(source, {
  fileName: helperPath,
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const helperModule = new Module(helperPath, module);
helperModule.filename = helperPath;
helperModule.paths = Module._nodeModulePaths(path.dirname(helperPath));
helperModule._compile(compiled, helperPath);
const h = helperModule.exports;

test('normalises a local Algerian number to country code 213', () => {
  assert.equal(h.normaliseWhatsAppNumber('0551 23 45 67'), '213551234567');
});

test('normalises international and 00-prefixed phone numbers', () => {
  assert.equal(h.normaliseWhatsAppNumber('+213 551 23 45 67'), '213551234567');
  assert.equal(h.normaliseWhatsAppNumber('00213 551 23 45 67'), '213551234567');
});

test('returns no WhatsApp URL when a store number is absent or too short', () => {
  assert.equal(h.makeWhatsAppUrl('', 'Hello'), null);
  assert.equal(h.makeWhatsAppUrl('1234', 'Hello'), null);
});

test('encodes Arabic message text in WhatsApp URL', () => {
  const url = h.makeWhatsAppUrl('0551234567', 'السلام عليكم، أريد الطلب');
  assert.ok(url);
  assert.match(url, /^https:\/\/wa\.me\/213551234567\?text=/);
  assert.ok(url.includes(encodeURIComponent('السلام عليكم، أريد الطلب')));
});

test('slugifies Latin product names consistently', () => {
  assert.equal(h.slugify('  iPhone 17 Pro  '), 'iphone-17-pro');
  assert.equal(h.slugify('Café & Case'), 'cafe-case');
});

test('Arabic-only product names ending with digits do not become numeric-only slugs', () => {
  const slug = h.slugify('آيفون 17');
  assert.match(slug, /^item-[a-z0-9]+-[a-z0-9]+$/);
});

test('parses required and optional service fields including select options', () => {
  const fields = h.parseServiceFields([
    'اسم الحساب|account_name|text|مطلوب',
    'المنصة|platform|select|required|PS5, Xbox, PC',
    'ملاحظات|notes|text|اختياري',
  ].join('\n'));
  assert.equal(fields.length, 3);
  assert.equal(fields[0].name, 'account_name');
  assert.equal(fields[0].required, true);
  assert.equal(fields[1].type, 'select');
  assert.deepEqual(fields[1].options, ['PS5', 'Xbox', 'PC']);
  assert.equal(fields[2].required, false);
});

test('service field editor text survives a parse/format round trip', () => {
  const original = h.parseServiceFields('Account name|account_name|text|required\nPlatform|platform|select|required|PS5, Xbox');
  const restored = h.parseServiceFields(h.serviceFieldsToText(original));
  assert.equal(restored.length, original.length);
  assert.equal(restored[0].name, original[0].name);
  assert.equal(restored[1].type, original[1].type);
  assert.deepEqual(restored[1].options, original[1].options);
});

test('extracts and URL-decodes media path from Supabase public URL', () => {
  assert.equal(
    h.getStoragePath('https://project.supabase.co/storage/v1/object/public/product-media/abc/my%20photo.webp'),
    'abc/my photo.webp',
  );
  assert.equal(h.getStoragePath('https://example.com/image.webp'), null);
});

test('uses contact prompt for zero price and DZD currency formatting for positive price', () => {
  assert.match(h.formatPrice(0, 'ar'), /التواصل/);
  assert.match(h.formatPrice(1250, 'ar'), /د\.ج\.|DZD|دج/);
});

test('uses safe default store settings and applies database overrides', () => {
  const settings = h.settingFromRows([
    { key: 'store_name_ar', value: 'جمال فون' },
    { key: 'whatsapp_number', value: '0551234567' },
    { key: 'logo_url', value: '' },
  ]);
  assert.equal(settings.store_name_ar, 'جمال فون');
  assert.equal(settings.whatsapp_number, '0551234567');
  assert.equal(settings.logo_url, '/assets/jamal-logo.webp');
});
