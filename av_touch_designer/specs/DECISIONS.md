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

## 2026-11-12 引継ぎ改修

- ユーザーの明示依頼により、Phase 1限定の初期指示を越え、試用配布版を基準に指定の5項目を実装。クラウドセットアップに加えソース変更も依頼範囲に含む。
- 元開発ソースはmainにも試用ブランチにもなく、配布JSから回収。完全復元ではなく、回収JS＋新規strict TSの構成。由来と検証範囲はapp/README.md。
- panelはフラットなまま。props.responsive?:booleanを追加し、省略時false。完全内包かつ前面の非panel部品に比例追従。内部ロック/追従対象の重複は拒否。
- 長押し表示は既存outline/bar/circleを外周蓄積に統一。noneは維持。編集・出力HTMLは同じ長押し実装を使用。
- 映像・音声数指定は既存AV部品と状態定義を生成するテンプレートとして実装。外部通信・実機制御は追加しない。
