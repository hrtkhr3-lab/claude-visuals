# claude-visuals

チャットで生成した、**単体で動く standalone HTML** のインタラクティブ可視化物を一元管理し、
自動生成されるギャラリーから一覧・公開するためのリポジトリ。

🔗 **公開ギャラリー:** https://hrtkhr3-lab.github.io/claude-visuals/

## 収録されている可視化物

| 単元 | タイトル | 内容 |
|---|---|---|
| 距離・類似度の可視化 | [ユークリッド距離：まっすぐ測る](https://hrtkhr3-lab.github.io/claude-visuals/visuals/euclidean-distance.html) | 2点を直線で結んだ長さ。ピタゴラスの定理で決まる基本の距離。点をドラッグ。 |
| 距離・類似度の可視化 | [マンハッタン距離：碁盤の目で測る](https://hrtkhr3-lab.github.io/claude-visuals/visuals/manhattan-distance.html) | 縦横にしか進めないタクシーの道のり。どのルートでも長さは同じ。 |
| 距離・類似度の可視化 | [コサイン類似度：角度で比べる](https://hrtkhr3-lab.github.io/claude-visuals/visuals/cosine-similarity.html) | 2ベクトルのなす角度で似ている度合いを測る。矢印の先端をドラッグ。 |
| 距離・類似度の可視化 | [DTW vs ユークリッド距離](https://hrtkhr3-lab.github.io/claude-visuals/visuals/dtw-vs-euclidean.html) | 速さの違う2波形を対応づけ、時間ズレへの強さの違いを可視化。 |
| クラスタリング | [k-means クラスタリング](https://hrtkhr3-lab.github.io/claude-visuals/visuals/kmeans-clustering.html) | 割り当てと中心更新の反復でグループを見つける。点を追加できる。 |
| 大規模言語モデル（LLM） | [LLMの自己回帰的生成ループ](https://hrtkhr3-lab.github.io/claude-visuals/visuals/llm-generation-loop.html) | 順伝播→ロジット→softmax・温度→top-p→サンプリングを1トークンずつ実行。 |
| ニューラルネットワーク | [ニューラルネットワークの中身をのぞく](https://hrtkhr3-lab.github.io/claude-visuals/visuals/neural-network-playground.html) | 小さなNNが2クラス分類を学習する過程を、重み・活性値・決定境界のリアルタイム表示で観察。 |
| その他 | [AIは二進数でできている](https://hrtkhr3-lab.github.io/claude-visuals/visuals/ai-binary-basics.html) | 文字も重みも計算も 0 と 1 の列。AIが二進数でどう構成されるかを6ステップで学ぶ。 |

> この表は手動メンテナンス。単元別に自動整列されたカード一覧は[公開ギャラリー](https://hrtkhr3-lab.github.io/claude-visuals/)を参照。

## 特徴

- **standalone**: 各可視化物は1枚の HTML で完結。外部フォント / CDN / 外部スクリプトに依存しない。
- **見た目が揃う**: 全ファイルが共通の `:root` CSS 変数（`--bg-accent`, `--text-accent`, `--surface-1` など）を使うので、色・タイポグラフィが統一され、ダークモードも自動対応。
- **依存ゼロのビルド**: `index.html`（ギャラリー）は Node 標準ライブラリだけで生成。`npm install` 不要。

## 構成

```
claude-visuals/
  visuals/                     # 1可視化物 = 1 standalone .html（ここだけ手で足す）
    euclidean-distance.html
    neural-network-playground.html
    …                          # 上記「収録されている可視化物」を参照
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
