# Codex実装ロードマップ v4

各Phaseを単独実装・テストし、完了報告後に次へ。MVP完了はPhase 6。

## Phase 1 — プロジェクト基盤
Vite/React/TS strict、レイアウト、v2スキーマ/バリデータ、v1→v2移行、サンプル表示。合格: 型検査・不正データテスト・初期画面表示。

## Phase 2 — 基本エディタ
Button/Label/Panel、ドラッグ配置・リサイズ・数値編集・Undo/Redo、スナップ、レイヤー、ページ管理。合格: T02と編集保存のE2E。

## Phase 3 — テーマ・基本AV部品
2テーマ、5レイアウト、Navigation/SourceSelector/Volume/SceneSelector、状態定義UI。合格: T01/T04/T05。

## Phase 4 — 操作エンジン・AV操作
長押しと進捗、ポップアップ編集、イベント配列、CameraPreset/PTZ/PowerControl、プレビュー/キーボード代替。合格: T06〜T09/T14。

## Phase 5 — 編集効率・保存
複数選択、整列、均等配置、フラットグループ化、コピー/貼付、JSON保存/読込、未保存警告。合格: T03/T10/T11。

## Phase 6 — 出力・回帰
独立HTML ZIP、PNG、オフライン実行、表示比較、全受入試験。合格: T12/T13/T15と全回帰。実測値・未検証項目を報告。

## Phase 7以降（別途判断）
画像アップロード、追加テーマ、複雑なコンポーネント編集、実機制御、メーカー別移植等。承認なく着手しない。
