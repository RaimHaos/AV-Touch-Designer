# プロジェクトデータ仕様

## JSONルート
`schemaVersion`, `id`, `name`, `canvas`, `themeId`, `pages`, `initialState`, `assets`。

## ページ
`id`, `name`, `elements[]`。

## 要素
`id`, `type`, `x`, `y`, `width`, `height`, `zIndex`, `locked`, `props`, `action`。座標・サイズは基準キャンバスの論理px。`props`はtype別に検証。

## IDと参照
ページ・要素IDはプロジェクト内一意。アクションの参照先は既存ページ・既存stateKeyでなければならない。

## バリデーション
- schemaVersionは整数1。未対応バージョンは読み込み拒否し、破損しない。
- 空ページ、重複ID、負のサイズ、非数値座標、画面外要素、不正アクション、巨大画像を検証。
- JSON入力の未知フィールドは無条件にコード実行しない。読み込み時は安全なスキーマ検証を行う。
- プロジェクト名と表示文字列はプレーンテキストとして扱う。

## 将来の移行
`schemaVersion`による明示的なマイグレーションを設ける。MVPではv1のみ実装。

## JSONサンプル
`../examples/sample-project.json`参照。サンプルのプロパティ仕様と実装バリデータを一致させること。
