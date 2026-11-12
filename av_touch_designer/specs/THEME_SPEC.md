# テーマと視覚表現

Modern Dark / Minimal Lightに加え、ユーザー指定のNavy Blue / Warm Lightを提供。Premium / Professional AVは後続。Site由来の外観はソース未取得のため再現保証せず、デザインレビューで差し替え可能なテーマ構造とする。Appleの設計思想（視認性、タッチ領域、階層）を参考にするがApple素材の無断複製はしない。

トークン: background,surface,surfaceRaised,text,mutedText,accent,accentText,border,danger,success,focusRing,disabledOpacity,buttonRadius,panelRadius,shadow,fontFamily,spacingScale。具体値はVISUAL_TOKENS.mdを正とする。個別styleOverridesは色トークン参照を優先し、固定色を許す場合はテーマ変更で維持されることをUI上で示す。

状態優先度 disabled > pressing > selected > normal。hoverはマウスのみの補助であり必須情報を依存させない。長押し進捗はoutline/bar/circle/none。進捗0〜100%を描画し、完了時に一度だけアクション。キーボードフォーカスは明確な輪郭を表示。選択中は背景・文字・枠の強調表示。ユーザー指定によりチェックマークは表示しない。重要操作には危険色を限定使用。アニメーションは進捗・状態変化のみ（任意のアニメーション編集なし）。

基準フォント: Yu Gothic / Meiryo / Noto Sans CJK JP / sans-serif。外部フォント通信禁止。基準見出し32px、セクション22px、操作20px、補助16px。論理44×44pxを最小タッチ目標、主要操作64px以上。縮小表示時に実物理タッチ領域が小さくなるためプレビューで警告する。

編集操作UIは白基調固定。themeIdによる配色と形状変更はパネルのキャンバス、プレビュー、出力HTMLに限定する。デザインタブの選択は編集UIの色を変えない。実装トークンはapp/src/panel-themes.css、編集専用はapp/src/editor-light.css。
