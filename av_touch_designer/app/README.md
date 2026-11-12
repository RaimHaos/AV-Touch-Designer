# AV Touch Designer 引継ぎ改修版

`codex/trial-download` の配布済みエディタを回収し、依頼された編集機能を追加した開発環境です。単体HTMLはインストール不要でChrome/Edgeから開けます。

## 起動・検証

Node.js 24 / npm 11、Python 3。既存チェックアウトを利用し、worktreeは作成しません。

```sh
cd /workspace/AV-Touch-Designer/av_touch_designer/app
npm ci
npm run typecheck
npm test
npm run build
npm start
```

サーバー起動後 `npm run test:e2e`。Chromiumは `/usr/bin/chromium`、別パスは `CHROMIUM_PATH` で指定。E2Eは独立HTMLの外部通信を遮断しても長押しが動くことを確認します。画像・ZIPは `test-results/` に生成します。

## 追加した操作

- プレビューの長押し中、上辺中央から時計回りにシアンの光が外周に蓄積し、一周で操作が完了。途中離脱・キャンセル・非表示・フォーカス喪失で中止。キーボード代替も維持。従来のoutline/bar/circle設定はこの版では外周表示に統一（noneは非表示）。HTML出力も同じ実装。
- 右欄の「部品テンプレート」で映像数・音声チャンネル数を指定して追加。各0〜8、合計1以上。映像は独立した選択肢、音声は各チャンネル独立した音量・ミュート。画面に収まらない場合は変更せず通知。
- パネルを選択し「内部部品をサイズ・移動に追従」を有効化すると、完全に内包する前面の部品の位置・寸法が比例追従。新テンプレートでは有効。既存パネルでは無効。重なる追従パネルや内部ロック部品は変更を拒否。部品最小サイズを下回る確定操作も既存バリデータが拒否。複雑な親子関係は追加しません。
- Shift＋クリックで複数選択。従来の左右・上下・水平/垂直均等に加え、左右中央・上下中央揃え。
- 横並び・縦並び・グリッドを選択部品に適用。間隔0〜200px、列数1〜20。要素配列の順序で配置。ロック部品は対象外。画面外になる配置は変更せず通知。
- 変更は既存のUndo/Redo・JSON保存/読込に統合。パネル追従設定はv2のpanel.props.responsive（省略時false）として保持。旧版では追加フィールドが無視されます。

## 回収できたもの・できないもの

回収元: GitHub `RaimHaos/AV-Touch-Designer`、ブランチ `codex/trial-download`、コミット `d2eb757a6d173488763e58da28858ee4abc8aa75` の `downloads/AV-Touch-Designer-trial.zip`（2026-11-11配布版）。

`main` は設計資料のみ。配布HTMLにはReact/Zod等とアプリ、独立出力用ランタイムが同梱されています。`recovered/editor.js` と `runtime.js` は配布JSを整形・分離したものです。元のファイル構成、TypeScript型、元テスト、ソースマップ、前チャットの未コミット変更は回収できていません。変数名が短い箇所が残ります。完全な元ソース復元とは扱いません。

新規配置ロジックは `src/layout.ts`（strict）、共通長押しは `src/hold.js`、UI追加は `src/controls.js`。ビルド時に回収したエディタ・ランタイムへ組み込みます。回収JS全体へのTypeScript検査や既存全Phaseの回帰保証はありません。今後は機能単位で元の設計に沿ったモジュールへ移していけます。

依存は開発専用で固定・lockfile管理。esbuild/tsxはMIT、Playwright/TypeScriptはApache-2.0（各公式npm package metadata / LICENSEを確認）。回収済み依存の表示とライセンスは `recovered/LICENSES.txt` を保持。出力HTMLは外部CDNを使いません。

## 今回の検証範囲

型検査（新規TS）、単体5件、ブラウザで数値リサイズ・ドラッグ移動と追従/Undo/JSON往復、左右・上下・中央揃え/均等配置/横並び/縦並び/グリッド、長押し進捗/領域外中止/完了後tap抑止、5映像＋2音声テンプレート、ZIP出力と通信遮断した独立ランタイムを確認。Linux Chromiumで実行。Windows/macOSのChrome/Edge、実タッチ端末、旧版全機能の網羅回帰は未実施です。

配布ZIP再生成: `npm run package`。出力先はリポジトリ直下の `downloads/AV-Touch-Designer-recovered.zip`。

回収元ZIP SHA-256: `2ea8f71d92f96fd812ac754dd8abc97bdddd8b86f5cd02d347d4787bbe960c7e`。
