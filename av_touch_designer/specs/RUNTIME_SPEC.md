# 共通レンダラー・状態エンジン

## 状態
stateDefinitionsが唯一の状態宣言。初期値は各定義のinitialValueに統一し、旧initialStateはv1互換読み込み専用。型boolean/number/string、数値min/max/step、string enum（任意）。状態はプレビュー開始でディープコピーし、ページ遷移では保持、リロードで初期化。表示の選択状態は状態から導出し、別保存しない。

## アクション
none, navigate, openPopup, closePopup, toggle, select, setValue, increment。1イベントの配列は順番に同期実行し、navigateが発生したら残りを中断。アクション失敗時は当該アクションをスキップし診断ログへ記録。エディタの編集状態を変えない。ポップアップの確認操作は通常のボタンアクションとして定義する。モック内の疑似動作のみ。

## ポインター長押し
Pointer Eventsを使用。押下開始でpointerIdと開始時刻を記録し、requestAnimationFrame等で進捗更新。500〜5000ms、100ms刻み。領域外移動、pointercancel、blur、visibilitychange、要素無効化、画面遷移で中止。長押し成功後pointerup時のtapは抑止。マルチタッチは最初のポインターのみ受理。長押しボタンではcontextmenu/選択を抑止。キーボード代替の「長押し操作を実行」を提供。

## ポップアップ
同時表示1件。openPopupで置換、閉じると呼出元へフォーカス復帰。背景フォーカスと操作を遮断、Escapeで閉じる（危険操作でEscape無効を指定可能）。背景タップで閉じないのが標準。ポップアップ内でのアクションは閉じる/状態変更が可能。プレビューと出力HTMLは同一エンジンを使用。

## イベントと画面
編集キャンバスではイベントを発火しない。プレビュー中のみ発火。条件付き表示/無効はstateDefinitionsの値を参照。表示変更でフォーカス対象が消えた場合は安全な親領域へフォーカス移動。ポップアップは現在ページとは独立。ループ・遅延・タイマーで連続アクションを自動発火する機能はMVPに含めない。
