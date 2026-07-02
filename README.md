# claude-visuals

チャットで生成した、**単体で動く standalone HTML** のインタラクティブ可視化物を一元管理し、
自動生成されるギャラリーから一覧・公開するためのリポジトリ。

🔗 **公開ギャラリー:** https://hrtkhr3-lab.github.io/claude-visuals/

## 特徴

- **standalone**: 各可視化物は1枚の HTML で完結。外部フォント / CDN / 外部スクリプトに依存しない。
- **見た目が揃う**: 全ファイルが共通の `:root` CSS 変数（`--bg-accent`, `--text-accent`, `--surface-1` など）を使うので、色・タイポグラフィが統一され、ダークモードも自動対応。
- **依存ゼロのビルド**: `index.html`（ギャラリー）は Node 標準ライブラリだけで生成。`npm install` 不要。

## 構成

```
claude-visuals/
  visuals/                     # 1可視化物 = 1 standalone .html（ここだけ手で足す）
    llm-generation-loop.html
  template.html                # 新規作成用の空シェル（型）
  scripts/build-index.mjs      # visuals/ を走査して index.html を再生成（依存ゼロ）
  index.html                   # ★自動生成。手で編集しない
  package.json                 # "build": "node scripts/build-index.mjs"
  .github/workflows/pages.yml  # main への push で GitHub Pages にデプロイ
```

## 新しい可視化物を追加する

1. `template.html` をコピーして `visuals/<name>.html` を作る。守るのは以下:
   - `:root` の CSS 変数をそのまま使い、色を直書きしない。
   - `@media (prefers-color-scheme: dark)` を消さない。
   - 外部依存を持たせない（standalone であること）。
   - `<title>` にタイトル → ギャラリーのカード見出しになる。
   - `<meta name="unit" content="…">` に単元名 → ギャラリーが単元ごとにまとめる（省略時は「その他」）。
   - `<p class="lede">…</p>` に一文の説明 → カード本文になる（任意だが推奨）。
   - widget 本体は `<main id="widget">…</main>` に入れ、固有の CSS/JS はその中で完結させる。
2. ギャラリーを再生成する:
   ```bash
   npm run build
   ```
3. コミットして push（`index.html` も一緒に）。main への push で Pages に自動デプロイされる。

## ギャラリーの仕組み

`scripts/build-index.mjs` が `visuals/*.html` を読み、各ファイルの `<title>` /
`<meta name="unit">` / `<p class="lede">` を抽出してカード型のリンク集 `index.html` を生成する。
カードは **単元（unit）ごとにセクション分け**され、各単元内は更新日時の新しい順に並ぶ。
title が無ければファイル名で代替、unit が無ければ「その他」、lede は省略可。

## ライセンス

MIT
