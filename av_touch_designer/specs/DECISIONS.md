# 設計決定（v4）

- MVPはHTMLベースのAV操作モック作成。実機制御・メーカー別エクスポートは対象外。
- 編集用Reactアプリと、共通Renderer/RuntimeEngineを用いた独立HTML出力を分離。
- データ正規形式はschemaVersion=2。v1サンプルは読み込み時に移行。v2サンプルを標準提供。
- 初期解像度1280×800。固定論理座標、contain表示。テーマとレイアウトを分離。
- MVPにAV専用部品（CameraPreset/PTZ/Power/Scene）、長押し、モーダル、状態管理を含める。
- 複数選択・フラットグループ化・整列はPhase 5に含める。画像部品、複雑なネスト、実機制御は後続。
- 正規仕様はDATA_SCHEMA_V2、RUNTIME_SPEC、COMPONENT_SPEC、EDITOR_WORKFLOWS、EXPORT_RUNTIME_SPEC。旧文書の矛盾箇所よりこれらを優先。
- 既存Siteデザインの厳密再現は保留。Modern Dark/Minimal Lightを標準採用。
- 残る未決事項はOPEN_QUESTIONS.md。MVPを妨げない。
