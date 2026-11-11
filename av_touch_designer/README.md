# AV Touch Designer — Codex向け実装設計書 v4

AV設備操作タッチパネルのノーコードHTMLモックを作成する、ローカルファーストのブラウザエディタ。**設計書であり、実装済みアプリではありません。**

## 開始手順
1. `AGENTS.md`、`specs/DECISIONS.md`、`specs/ROADMAP.md`を読む。
2. `specs/DATA_SCHEMA_V2.md`、`specs/RUNTIME_SPEC.md`、`specs/COMPONENT_SPEC.md`を読む。
3. `examples/sample-project-v2.json`を基準にPhase 1のみ実装する。
4. Phaseごとに`specs/TEST_MATRIX.md`の該当テストを実行し報告する。

## 仕様ファイル
- PRODUCT_SPEC: 目的・MVP境界
- ARCHITECTURE: 技術分離
- DATA_SCHEMA_V2: 正規JSON構造・移行
- RUNTIME_SPEC / STATE_EVENT_ACTION_SPEC: 状態・操作・長押し・ポップアップ
- COMPONENT_SPEC: AV専用部品
- EDITOR_WORKFLOWS: 編集UIとショートカット
- LAYOUT_TEMPLATE_SPEC: 5レイアウト
- THEME_SPEC / VISUAL_TOKENS: 外観・配色
- EXPORT_RUNTIME_SPEC: HTML/PNG
- QUALITY_SECURITY_SPEC / TEST_MATRIX: 品質・受入条件
- ROADMAP: Phase 1〜6
- OPEN_QUESTIONS: MVP外・保留事項

旧仕様書は検討経緯の参照用に保持。矛盾時はAGENTSの優先順位を適用。

## Codexへの開始指示
「AGENTS.mdとspecs/ROADMAP.mdを読み、正規仕様（DATA_SCHEMA_V2.mdほか）に従いPhase 1のみ実装してください。サンプルv2を表示し、型検査・単体テストを実施。完了後、実装内容・テスト結果・未完了項目を報告し、Phase 2には進まないでください。」
