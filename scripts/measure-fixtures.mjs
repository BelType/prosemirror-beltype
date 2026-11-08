// usage: node scripts/measure-fixtures.mjs — writes fixtures/measure/<name>/index.html, the long-table, long-paragraph and chapter fixtures scripts/measure.mjs times. Row and word counts are tuned so the page counts land near the names (measure.mjs prints the real ones).
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const out = path.join(fileURLToPath(new URL('..', import.meta.url)), 'fixtures/measure');
const WORDS = 'proof raised ink leading apostrophe tympan paragraph register fragment cedilla line marginal sheet footnote flow typeface rule break page impression diaeresis italic appendix justification index quire column superior glossary colophon measure lead initial quoin preface versal dash'.split(' ');
let seed = 7;
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const words = (n) => Array.from({ length: n }, () => WORDS[Math.floor(rnd() * WORDS.length)]).join(' ');
const page = (title, css, body) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <link rel="stylesheet" href="../base.css">
  <style>${css}</style>
</head>
<body>
${body}
</body>
</html>
`;
const write = (name, html) => { mkdirSync(path.join(out, name), { recursive: true }); writeFileSync(path.join(out, name, 'index.html'), html); };

// Rows per page (measured, A4 20 mm margins): see measure.mjs output; ROWS is rows per target page.
const ROWS = { auto: 32.5, fixed: 32.5, flex: 32.5 };
for (const pages of [10, 20, 40, 80, 200]) {
  const n = Math.round(ROWS.auto * pages);
  const rows = Array.from({ length: n }, (_, i) => `<tr><td>${i + 1}</td><td>${words(3)}</td><td>${words(4)}</td></tr>`).join('\n');
  const table = (layout) => `<table class="${layout}"><thead><tr><th>No.</th><th>Term</th><th>Note</th></tr></thead><tbody>\n${rows}\n</tbody></table>`;
  const tcss = (layout) => `table{width:100%;border-collapse:collapse;table-layout:${layout}} td,th{border:1px solid #888;padding:2px 4px;text-align:left}`;
  write(`table-auto-${pages}`, page('Table auto', tcss('auto'), `<h1>Table</h1>\n${table('auto')}`));
  write(`table-fixed-${pages}`, page('Table fixed', tcss('fixed'), `<h1>Table</h1>\n${table('fixed')}`));
  const items = Array.from({ length: Math.round(ROWS.flex * pages) }, (_, i) => `<div class="item"><span>${i + 1}</span> ${words(7)}</div>`).join('\n');
  write(`flex-nowrap-${pages}`, page('Flex column', `.col{display:flex;flex-direction:column;flex-wrap:nowrap} .item{padding:2px 4px;border-bottom:1px solid #888;white-space:nowrap}`, `<h1>Flex column</h1>\n<div class="col">\n${items}\n</div>`));
}

// A single paragraph: about 520 words fill an A4 page at the base look.
for (const pages of [5, 20, 50]) write(`para-${pages}`, page('One paragraph', '', `<h1>One paragraph</h1>\n<p>${words(445 * pages)}.</p>`));

// A chapter: one top-level section, Markdown-shaped (h2 and h3 sections, paragraphs, lists, a quote, a code block), about 30 pages.
{
  const block = (i) => `<h2 id="s${i}">Section ${i}</h2>\n<p>${words(110)}.</p>\n<p>${words(90)}.</p>\n<h3 id="s${i}a">Section ${i}.a</h3>\n<ul>\n${Array.from({ length: 5 }, () => `<li>${words(12)}</li>`).join('\n')}\n</ul>\n<p>${words(120)}.</p>\n<blockquote><p>${words(40)}.</p></blockquote>\n<pre><code>${Array.from({ length: 4 }, (_, k) => `line ${k + 1} ${words(4)}`).join('\n')}</code></pre>\n<p>${words(100)}.</p>`;
  write('chapter-30', page('Chapter', '', `<section><h1 id="chapter">Chapter</h1>\n${Array.from({ length: 17 }, (_, i) => block(i + 1)).join('\n')}\n</section>`));
}
