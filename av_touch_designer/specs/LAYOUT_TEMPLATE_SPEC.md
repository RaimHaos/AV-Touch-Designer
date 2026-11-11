# レイアウトテンプレートと画面構成

テーマ（色・文字・形状）とレイアウト（要素位置・ページ構成）を分離。テンプレート適用時は新規プロジェクト生成を基本とし、既存編集中への破壊的上書きはしない。

|テンプレート|画面|初期要素|初期状態|
|---|---|---|---|
|Blank|Main|見出しのみ|なし|
|Standard Meeting Room|Main / Camera|入力選択、音量、ミュート、電源、ナビ、カメラプリセット|selectedSource=pc, volume=65, muted=false, power=true, cameraPreset=1|
|Presentation Room|Main / Display|入力選択、出力先選択、音量、電源、ナビ|selectedSource=pc, selectedDisplay=main, volume=65, muted=false, power=true|
|Camera Focus|Main / Camera|カメラプリセット、PTZ、カメラ切替、戻る|cameraPreset=1, pan=0, tilt=0, zoom=50|
|Multi-Zone Audio|Main|エリア別音量2組、ミュート、シーン|volumeA=50,volumeB=50,muteA=false,muteB=false,scene=normal|

MVPは上記5種。初期解像度1280×800。全要素は余白48px、主要部品間16〜24pxを目安に配置。標準のヘッダー高88px、コンテンツはy=120以降。テンプレートを読み込んだ時点で全参照が整合し、プレビューが動作すること。解像度変更時の自動再配置はしない。変更前に画面外要素の有無を確認し、問題があれば変更を拒否して説明する。

テンプレートの保存・再利用はプロジェクトJSONを複製して利用する方式をMVP標準とする。「テンプレートとして保存」の専用管理UIは後続。
