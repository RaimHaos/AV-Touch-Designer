# プロジェクトJSON v2 — 正規仕様

## ルート
`schemaVersion:2`, `id`, `name`, `canvas:{width,height}`, `themeId`, `startPageId`, `pages[]`, `popups[]`, `stateDefinitions[]`, `assets:{}`, `groups?:[]`。未知の必須フィールド・型不一致・重複ID・参照切れはエラー。余分なフィールドは安全に無視できるが保存時は正規化する。JSON読み込み上限10MB、要素最大500/プロジェクト、ページ最大30、ポップアップ最大30、状態キー最大200。キャンバス幅320〜3840、高さ240〜2160。

## stateDefinitions
`{key,type,initialValue,min?,max?,step?,options?}`。数値は有限値、min<=initial<=max、step>0。文字列enumの場合はinitialValueを含む。キーは`^[A-Za-z][A-Za-z0-9_]{0,63}$`。IDは英数字/`_-`、1〜64字。

## ページ・ポップアップ
page `{id,name,elements[]}`、popup `{id,name,width,height,closeOnBackdrop:false,closeOnEscape:true,elements[]}`。startPageIdは既存ページ。ページ/ポップアップ/要素のIDは全体で一意。popup幅200〜canvas.width、高さ120〜canvas.height。

## 要素
`{id,type,x,y,width,height,zIndex,locked,props,interactions?,visibleWhen?,disabledWhen?,styleOverrides?}`。すべて整数の論理px。`zIndex`は0〜9999。`interactions:{onTap?:Action[],onLongPressComplete?:Action[],hold?:{durationMs,indicator}}`。アクションの型別必須引数はSTATE_EVENT_ACTION_SPECを参照。旧`action`単数フィールドはv1入力のみ。`visibleWhen/disabledWhen:{stateKey,equals?:scalar,notEquals?:scalar}`（equals/notEqualsのどちらか一方）。要素の座標は所属キャンバス内に収まる。

## v1→v2移行
v1 `initialState`のキーと値からstateDefinitionsを生成。volumeの参照キーは0〜100のnumber、muteStateKeyはboolean、その他は値から型推定。旧element.actionは`interactions.onTap=[action]`へ移す。v1で参照するキーが初期状態にない場合はエラー。startPageIdは先頭ページ。popups=[]、groups=[]。旧schemaVersion=2の不完全な試作ファイルは自動推測で補完せずエラー。未知の将来版は拒否。変換後は必ずv2検証し、元データを上書きしない。

## バリデーション
JSON Schema/Zod等で構造検証後、参照整合性を二段階で検証。ラベル等の文字列はテキストとしてのみ表示。HTML/JS/CSS文字列は実行しない。アップロード画像はMVPでは未対応、assetsは空オブジェクトのみ。読み込み失敗時は編集内容を保持し、問題のパスを示す。
