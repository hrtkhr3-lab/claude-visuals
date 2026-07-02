#!/usr/bin/env node
// visuals/*.html を走査して index.html（ギャラリー）を再生成する。
// Node 標準ライブラリのみ。依存ゼロ。手で index.html を編集しないこと。

import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const VISUALS_DIR = join(ROOT, 'visuals');
const OUT = join(ROOT, 'index.html');

// ── HTML から素朴に抽出 ──────────────────────────────
function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeEntities(stripTags(m[1]).trim()) : '';
}
function extractLede(html) {
  // <p class="lede">…</p>（class の順序・追加クラスに寛容に）
  const m = html.match(/<p[^>]*class=["'][^"']*\blede\b[^"']*["'][^>]*>([\s\S]*?)<\/p>/i);
  return m ? decodeEntities(stripTags(m[1]).replace(/\s+/g, ' ').trim()) : '';
}
function extractUnit(html) {
  // <meta name="unit" content="…">（単元名。無ければ「その他」に分類）
  const m = html.match(/<meta\s+name=["']unit["']\s+content=["']([^"']*)["'][^>]*>/i);
  return m ? decodeEntities(m[1].trim()) : '';
}
function stripTags(s) { return s.replace(/<[^>]*>/g, ''); }
function decodeEntities(s) {
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}
// 出力へ埋め込む際のエスケープ
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function fmtDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function collect() {
  let entries;
  try {
    entries = await readdir(VISUALS_DIR);
  } catch {
    return [];
  }
  const files = entries.filter(f => f.toLowerCase().endsWith('.html'));
  const items = [];
  for (const file of files) {
    const full = join(VISUALS_DIR, file);
    const [html, st] = await Promise.all([readFile(full, 'utf8'), stat(full)]);
    items.push({
      file,
      href: `visuals/${file}`,
      title: extractTitle(html) || file.replace(/\.html$/i, ''),
      lede: extractLede(html),
      unit: extractUnit(html) || 'その他',
      mtime: st.mtime,
    });
  }
  // 更新日時の新しい順（同時刻はファイル名昇順）
  items.sort((a, b) => (b.mtime - a.mtime) || a.file.localeCompare(b.file));
  return items;
}

// ── 単元（unit）ごとにグループ化 ──────────────────────
// UNIT_ORDER に載る単元はこの順で先頭に、載らない単元は名前順で続き、
// 「その他」は常に最後。単元内は collect() の並び（更新日時の新しい順）を保つ。
const UNIT_ORDER = [
  '距離・類似度の可視化',
  'クラスタリング',
  '大規模言語モデル（LLM）',
];
function groupByUnit(items) {
  const byUnit = new Map();
  for (const it of items) {
    if (!byUnit.has(it.unit)) byUnit.set(it.unit, []);
    byUnit.get(it.unit).push(it);
  }
  const rank = u => {
    const i = UNIT_ORDER.indexOf(u);
    if (i !== -1) return [0, i, ''];
    if (u === 'その他') return [2, 0, ''];
    return [1, 0, u];
  };
  return [...byUnit.entries()]
    .map(([unit, list]) => ({ unit, list }))
    .sort((a, b) => {
      const ra = rank(a.unit), rb = rank(b.unit);
      return ra[0] - rb[0] || ra[1] - rb[1] || ra[2].localeCompare(rb[2]);
    });
}

function renderCard(it) {
  const lede = it.lede ? `<p class="card-lede">${esc(it.lede)}</p>` : '';
  return `      <a class="card" href="${esc(it.href)}">
        <h2 class="card-title">${esc(it.title)}</h2>
        ${lede}
        <span class="card-meta">${esc(it.file)} · ${fmtDate(it.mtime)}</span>
      </a>`;
}

function renderSection({ unit, list }) {
  const cards = list.map(renderCard).join('\n');
  return `      <section class="unit">
        <h2 class="unit-title">${esc(unit)}<span class="unit-count">${list.length}</span></h2>
        <div class="grid">
${cards}
        </div>
      </section>`;
}

function renderPage(items) {
  const groups = groupByUnit(items);
  const sections = items.length
    ? groups.map(renderSection).join('\n')
    : `      <p class="empty">まだ可視化物がありません。visuals/ に .html を追加して <code>npm run build</code>。</p>`;
  const count = items.length;
  const unitCount = groups.length;
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Claude Visuals — ギャラリー</title>
<!-- このファイルは scripts/build-index.mjs が自動生成する。手で編集しない。 -->
<style>
  :root{
    --surface-0:#f5f4ee; --surface-1:#ecebe3; --surface-2:#ffffff;
    --text-primary:#1f1e1b; --text-secondary:#5f5e5a; --text-muted:#8a8981;
    --border:rgba(0,0,0,.10); --border-strong:rgba(0,0,0,.20);
    --bg-accent:#e6f1fb; --text-accent:#185fa5; --border-accent:#378add;
    --text-success:#3b6d11;
    --font-sans:-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Noto Sans JP",sans-serif;
    --font-mono:ui-monospace,SFMono-Regular,Menlo,"Roboto Mono",monospace;
    --radius:8px;
  }
  @media (prefers-color-scheme: dark){
    :root{
      --surface-0:#262624; --surface-1:#302f2d; --surface-2:#3a3a37;
      --text-primary:#e9e7de; --text-secondary:#b1afa5; --text-muted:#85847c;
      --border:rgba(255,255,255,.14); --border-strong:rgba(255,255,255,.26);
      --bg-accent:#0c447c; --text-accent:#b5d4f4; --border-accent:#378add;
      --text-success:#97c459;
    }
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--surface-0);color:var(--text-primary);
    font-family:var(--font-sans);line-height:1.7;
    -webkit-font-smoothing:antialiased;padding:48px 16px}
  .wrap{max-width:820px;margin:0 auto}
  h1{font-size:24px;font-weight:500;margin:0 0 4px}
  .lede{font-size:14px;color:var(--text-secondary);margin:0 0 4px}
  .count{font-size:12px;color:var(--text-muted);margin:0 0 28px}

  .unit{margin:0 0 34px}
  .unit-title{display:flex;align-items:center;gap:10px;font-size:15px;font-weight:600;
    color:var(--text-primary);margin:0 0 14px;padding-bottom:8px;border-bottom:.5px solid var(--border)}
  .unit-count{font-size:11px;font-weight:500;color:var(--text-accent);background:var(--bg-accent);
    border-radius:999px;padding:1px 9px;font-family:var(--font-mono)}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}
  .card{display:flex;flex-direction:column;gap:6px;text-decoration:none;color:inherit;
    background:var(--surface-2);border:.5px solid var(--border);border-radius:12px;
    padding:16px 18px;transition:border-color .15s,transform .05s,box-shadow .15s}
  .card:hover{border-color:var(--border-accent);box-shadow:0 2px 12px rgba(0,0,0,.06)}
  .card:active{transform:scale(.995)}
  .card-title{font-size:16px;font-weight:500;margin:0;color:var(--text-primary)}
  .card-lede{font-size:13px;color:var(--text-secondary);margin:0;
    display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
  .card-meta{margin-top:auto;padding-top:6px;font-size:11px;color:var(--text-muted);font-family:var(--font-mono)}
  .empty{color:var(--text-secondary);font-size:14px}
  .empty code{font-family:var(--font-mono);background:var(--surface-1);padding:1px 5px;border-radius:4px}

  footer{margin-top:36px;font-size:12px;color:var(--text-muted);border-top:.5px solid var(--border);padding-top:12px}
  footer code{font-family:var(--font-mono)}
</style>
</head>
<body>
<div class="wrap">
  <h1>Claude Visuals</h1>
  <p class="lede">チャットで生成した、単体で動くインタラクティブ可視化物のギャラリー。単元ごとにまとめています。</p>
  <p class="count">${unitCount} 単元 ・ ${count} 件</p>

  <main>
${sections}
  </main>

  <footer>自動生成: <code>scripts/build-index.mjs</code> ／ 追加は <code>visuals/&lt;name&gt;.html</code> → <code>npm run build</code>。</footer>
</div>
</body>
</html>
`;
}

const items = await collect();
await writeFile(OUT, renderPage(items), 'utf8');
console.log(`build-index: ${items.length} visual(s) → index.html`);
