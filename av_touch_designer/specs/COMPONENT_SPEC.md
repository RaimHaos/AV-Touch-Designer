# AVコンポーネント詳細仕様（MVP）

## 共通
要素は絶対座標 x/y/width/height（論理px）、zIndex、locked、visibleWhen?、disabledWhen?、styleOverrides?、props、interactions を持つ。編集時に不可視の要素もレイヤー一覧から選択できる。条件式は `stateKey` + `equals` / `notEquals` の宣言的比較のみ。任意コード・式評価は禁止。未設定条件は常時表示/有効。参照切れは検証エラー。

## 基本部品
|type|標準寸法|最小寸法|編集可能プロパティ|動作|
|---|---|---|---|---|
|button|200×80|64×44|text,icon,variant,selectedWhen,hold,interactions|tap/holdComplete|
|label|320×56|48×24|text,fontSize,align,weight,colorToken|なし|
|panel|440×260|80×60|title,variant,fillToken|なし（視覚背景、親子関係なし）|
|navigation|180×64|64×44|text,icon,targetPageId|tapでnavigate|
|sourceSelector|520×120|200×80|options(1〜8),stateKey,columns|選択値更新|
|volume|480×120|横240×96・縦96×240|label,stateKey,muteStateKey,showValue,orientation|0〜100のスライダーとmute|
|cameraPreset|420×180|240×120|cameraLabel,options(1〜12),columns,selectedStateKey,registrationStateKey,hold|tap呼出、hold登録確認|
|ptzPad|300×300|220×220|label,panTiltStep,zoomStep,positionKeys|方向/ズームの模擬数値更新|
|powerControl|320×120|200×80|powerStateKey,offHoldDuration,popupId|ONはtap、OFFはhold→確認|
|sceneSelector|480×120|200×80|options(1〜8),stateKey,columns|排他的シーン選択|
|image|240×160|32×32|assetId,fit,alt|表示のみ（後続Phase）|

## 実装優先順位
Phase 2: button,label,panel。Phase 3: navigation,sourceSelector,volume,sceneSelector。Phase 4: cameraPreset,ptzPad,powerControl。imageはPhase 6（後続）。MVP完了にはPhase 4のAV部品まで含める。

## cameraPreset
各選択肢は `{id,label,value}`。タップでselectedStateKeyを設定。長押し成立で登録確認ポップアップを表示。確定時、registrationStateKey（文字列：最後に登録したプリセットID）を更新。登録済みバッジは値一致で表示。モック上で実カメラの位置情報は保存しない。プリセットの長押し時間は部品共通で500〜5000ms。登録確認用ポップアップが未定義なら検証エラー。

## ptzPad
stateDefinitionsに pan（-100〜100）、tilt（-100〜100）、zoom（0〜100）の数値キーを割り当てる。タップでstep加算、値域でクランプ。押し続けた連続送信はMVP対象外（実機制御と混同しない）。停止ボタンは模擬状態を変更しない。表示に現在値を示す。

## powerControl
電源状態はboolean。OFFの長押し成功で確認ポップアップを開き、確定後false。ONはtrue。モックの電源OFF後も画面は表示し続け、状態に応じて関連部品をdisabledWhenで無効化可能。

## 表示・編集
複合部品の内部ボタンは独立要素IDを持たず、右プロパティで項目数やラベルを編集する。部品の内部レイアウトはCSS Grid/Flexで自動配置。サイズが不足する場合はエディタで警告し、文字切れを黙認しない。部品の分解機能はMVP対象外。

## 動作を保ったレイアウト切り替え（2026-11-12追加）

選択部品のレイアウトは列数/フェーダーの向きのみを変更し、状態定義・参照・選択肢・イベント・条件を維持。音量orientationはhorizontal/verticalで省略時horizontal。cameraPreset columnsは1〜12で省略時2。必要なサイズを確保し、キャンバスに収まらない変更は拒否する。個別色はstyleOverridesの既存トークンを利用し、全体themeIdの変更と分離する。
