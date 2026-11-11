# Codex実装規約（v4）

1. 日本語UI、TypeScript strict。対象Phaseのみ実装し、範囲外機能は追加しない。
2. 仕様優先順位：PRODUCT_SPEC → DATA_SCHEMA_V2 / RUNTIME_SPEC / COMPONENT_SPEC / EDITOR_WORKFLOWS / EXPORT_RUNTIME_SPEC → THEME_SPEC / LAYOUT_TEMPLATE_SPEC / QUALITY_SECURITY_SPEC → ROADMAP → 旧v1〜v3文書。矛盾はDECISIONSに記録。
3. JSONの正規形式はschemaVersion=2。v1入力は決定的移行。既存のv1例は移行テスト用に残す。
4. 編集UIと共通Renderer/RuntimeEngineを分離。HTML出力に編集機能を混入させない。
5. 任意HTML/JS/CSS、外部通信、実機制御、クラウド保存は実装しない。
6. 依存パッケージは実装時に公式情報・ライセンスを確認し、固定バージョンを記録。
7. 各Phaseで型検査・単体/E2Eの該当テストを実行し、コマンド・結果・未実施を報告。未実施を成功と記載しない。
8. 変更内容と仕様差分をREADME/DECISIONSへ記録。Phaseを越える独断の拡張は禁止。
