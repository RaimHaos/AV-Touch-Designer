# ビジュアル設計トークン（初期基準）

以下はMVPの初期設計値。実装後の実画面レビューで変更可能だが、変更時はテーマ・全コンポーネントに一括反映する。

## Modern Dark
- background #171C25; surface #242C39; surfaceRaised #303B4B
- text #F4F7FB; mutedText #AAB6C5; accent #4C91F2
- border #465267; danger #D95B65; success #49B69A
- button radius 12px; panel radius 16px; border 1px; shadow 0 4px 12px rgba(0,0,0,.12)

## Minimal Light
- background #F4F6F9; surface #FFFFFF; surfaceRaised #E9EDF3
- text #1C2532; mutedText #627083; accent #2869C9
- border #CDD5E0; danger #C63E4A; success #16846A
- button radius 12px; panel radius 16px; border 1px; shadow 0 4px 12px rgba(20,30,50,.06)

## 共通
- フォント: 日本語はシステムフォント優先（'Yu Gothic', 'Meiryo', 'Noto Sans CJK JP', sans-serif）。外部CDNフォント不使用。
- 文字: ページ見出し32px、セクション22px、操作ラベル20px、補助16pxを基準。縮小表示時も論理寸法で保持。
- 余白: 8px刻みを基本。画面外周48px、セクション間24〜32px、部品間16pxを標準。
- タッチ対象: 論理寸法44×44px以上、主要操作は64px以上を推奨。
- 選択中: accent背景/枠 + 明示的な状態表現。無効: コントラストを下げ操作不能。dangerは電源OFFなど重要操作のみに限定。
- テーマ切替では座標・寸法・テキスト・アクションを変更しない。
