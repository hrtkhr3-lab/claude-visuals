# CLAUDE.md — claude-visuals

チャットで生成した**単体で動く standalone HTML** の可視化物を一元管理し、
自動生成されるギャラリー（`index.html`）から一覧・公開するリポジトリ。

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

## 新しい可視化物を追加する手順

1. **`visuals/<name>.html` を追加する。**
   `template.html` をコピーして中身を作るのが早い。守るのは以下だけ:
   - `:root` の CSS 変数（`--bg-accent`, `--text-accent`, `--surface-1` など）をそのまま使う。
     色を直書きせず変数を使えば、全可視化物で見た目が揃い、ダークモードも自動で効く。
   - `@media (prefers-color-scheme: dark)` を消さない。
   - 外部フォント / CDN / 外部スクリプトに依存しない（**standalone** であること）。
   - `<title>` にタイトルを書く → ギャラリーのカード見出しになる。
   - `<meta name="unit" content="…">` に**単元名**を書く → ギャラリーがこの単元ごとにカードをまとめる。
     省略すると「その他」単元に入る。表示順は build-index.mjs の `UNIT_ORDER` で制御。
   - `<p class="lede">…</p>` に一文の説明を書く → カードの本文になる（任意だが推奨）。
   - widget 本体は `<main id="widget">…</main>` に入れる。固有の CSS/JS はその可視化物の中で完結させる。

2. **`npm run build`** を実行して `index.html` を再生成する。

3. **コミットする**（`index.html` も一緒に）。main に push すると Pages に自動デプロイ。

## ギャラリーの仕組み（build-index.mjs）

- `visuals/*.html` を読み、各ファイルから `<title>` / `<meta name="unit">` / `<p class="lede">` を素朴な正規表現で抽出。
- 見つからなければ title はファイル名で代替、unit は「その他」、lede は省略。
- **単元（unit）ごとにセクション分け**して表示。単元の並びは `UNIT_ORDER`（先頭固定）→ 未登録は名前順 → 「その他」は最後。
- 各単元内のカードは**更新日時の新しい順**（同時刻はファイル名昇順）に並ぶ。
- Node 標準ライブラリのみ。**依存パッケージを足さない**（`npm install` 不要で動くのが売り）。

## 触ってよい / いけない

- 触ってよい: `visuals/` の追加、`template.html`、`scripts/build-index.mjs`、`package.json`。
- 触らない: `index.html`（毎回 build で上書きされる）。
- 公開に関わる操作（リポジトリを public にする / push / Pages 有効化）は実行前に人へ確認する。
