# 状態・イベント・アクション共通仕様（MVP追加仕様）

## 適用と優先順位
本書はINTERACTION_SPEC.md、DATA_SPEC.md、IMPLEMENTATION_DETAILS.mdの操作関連仕様を拡張する。衝突する場合は本書を優先。既存のschemaVersion=1のサンプルは読み込み可能に保つ。保存形式はschemaVersion=2とし、v1→v2の決定的なマイグレーションを実装する。未知の将来版は拒否し、元ファイルを変更しない。

## 状態定義
project.initialStateは従来のキー値マップを受理。v2ではstateDefinitionsに各キーの型（boolean/number/string）、初期値、数値の場合min/max/step、選択候補enumを宣言。initialStateと宣言が矛盾すればエラー。画面の選択状態は状態値から導出し、要素ごとに重複保持しない。プレビュー状態はプロジェクト編集状態と完全分離。プレビュー開始時初期化、ページ移動時保持、終了時破棄。

## イベント
ボタンはonTap、onLongPressCompleteを持つ。長押し開始時に視覚フィードバック、完了までの進捗を描画。durationMs初期2000、許容500〜5000、100ms刻み。indicatorはoutline/bar/circle/none。途中のpointerup/pointercancel/画面非表示/無効化/ページ移動でキャンセル。押下中に指がボタン領域外へ移動した場合もキャンセル。長押し成立後はonTapを発火しない。pointerIdで多重入力を排除。タッチ時のブラウザ長押しコンテキストメニューやテキスト選択を対象ボタン内で抑止。編集モードでは一切発火しない。

## アクション（順序付き配列）
none、navigate(pageId)、openPopup(popupId)、closePopup、toggle(stateKey)、select(stateKey,value)、setValue(stateKey,value)、increment(stateKey,delta)を定義。複数アクションは配列順に同期実行。バリデーションで型・参照・値域を確認。実行時に不正なら安全にスキップし、プレビュー診断へ記録。navigateでページが変わったら以降のアクションは実行しない。実機通信・任意JavaScript・URL実行・外部APIは対象外。

## ボタンの表示状態
優先順位はdisabled > pressing > selected > normal。押下進捗は表示のみで、状態キーに書き込まない。selectedWhenは状態キーと値の厳密一致で導出。ボタンの通常タップはonTap、長押し完了はonLongPressCompleteに割当。長押し設定がない場合、通常タップのみ。長押しのみ設定したボタンでは短押しは何もしない。

## ポップアップ
project.popups[]にid/name/elements[]を持たせ、ページとは別管理。MVPは同時に1枚のみ表示し、次のopenPopupは既存のものを置換。背景操作を遮断するモーダル。閉じるボタン、closePopupアクション、Escapeで閉じる。危険操作の確認ダイアログは背景タップでは閉じない設定を既定とする。開いた際にフォーカスをポップアップ内へ移し、閉じたら呼出元へ戻す。プレビューHTMLでも同じ挙動。

## キーボードとアクセシビリティ
Tabでフォーカス、Enter/Spaceでタップ相当。長押し専用操作にはキーボード向けの明示的な代替操作（フォーカス時に表示される「長押し操作を実行」メニュー）を設ける。単なるキー押下時間で長押しを代用しない。フォーカス可視化、ボタンの名前、選択・無効状態をARIAで表現。

## モック用ユースケース
電源OFF：2秒長押し完了→確認ポップアップ→確定でpower=false、キャンセルで変更なし。カメラプリセット：タップでcameraPreset=1、2秒長押し→登録確認ポップアップ→確定で登録済み表示の模擬状態を変更。映像ソース：排他的なsource文字列状態を選択。音量：0〜100、muteは独立したboolean。

## テスト要件
短押し、長押し成功、途中離脱、領域外移動、pointercancel、二重発火防止、複数タッチ、ページ遷移中断、無効化、編集モード無反応、状態型違反、ポップアップ確認/取消、HTMLエクスポート同等動作、キーボード代替操作を自動テスト対象にする。時間依存テストは偽タイマーを用い、実時間待機に依存しない。
