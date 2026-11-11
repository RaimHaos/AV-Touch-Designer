# アーキテクチャ

## 推奨スタック
Vite + React + TypeScript(strict)。CSS変数によるテーマ管理。状態管理は小規模なうちはReact reducer/context、肥大化時のみ軽量ライブラリを検討。ユニットテストVitest、UI/E2EはPlaywright。アイコンはLucide系のSVGをビルド時に取り込む。

## 重要な設計判断
- **HTML DOMベースのキャンバス**を基本とする。表示部品をHTML/CSSで直接描画し、エディタと独立HTMLで同一のレンダラーを再利用する。
- ドラッグ・リサイズには必要に応じてMoveable等を採用。編集操作の補助ライブラリは出力HTMLに含めない。
- 座標は固定基準解像度に対する論理px。プレビュー時は全体を等比スケールし、部品個別の相対再配置はしない。
- エディタUI、プロジェクトモデル、レンダラー、プレビュー状態、エクスポータを明確に分離。
- HTMLエクスポートは独立した配布用ビルドを生成し、編集アプリのバンドルを含めない。

## 推奨ディレクトリ
`src/editor`, `src/model`, `src/renderer`, `src/components`, `src/themes`, `src/templates`, `src/preview`, `src/export`, `src/utils`, `tests`。

## データフロー
UI編集 → 検証済みProject JSON → 共通Renderer → (編集キャンバス / Preview / HTML Export)。PNG出力はRendererの表示結果をキャプチャ。

## セキュリティ
テキストはReactのテキスト描画でエスケープ。ユーザー提供SVG/HTML/JSを直接挿入しない。画像はMVPではPNG/JPEG/WebPのdata URIに限定し、サイズ制限を設定。HTML出力には外部CDNを使わない。
