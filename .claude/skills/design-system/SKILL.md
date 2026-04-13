---
name: design-system
description: プロジェクトの設計システム定義。カラーパレット、タイポグラフィ、コンポーネントライブラリ、アクセシビリティ基準を一元管理。
allowed-tools: Read, Glob, Grep
---

# 設計システム（Design System）

<!-- TODO: プロジェクトの設計システムをここに定義します -->

このドキュメントはデザインと実装の一貫性を保つための基準です。

## カラーシステム

<!-- TODO: カラーパレットを定義 -->

### プライマリカラー

```
Primary: {{PRIMARY_COLOR}}          （例: #007BFF）
Primary Dark: {{PRIMARY_DARK_COLOR}} （例: #0056B3）
Primary Light: {{PRIMARY_LIGHT_COLOR}} （例: #0D6EFD）
```

### セカンダリカラー

```
Secondary: {{SECONDARY_COLOR}}          （例: #6C757D）
Secondary Dark: {{SECONDARY_DARK_COLOR}} （例: #545B62）
Secondary Light: {{SECONDARY_LIGHT_COLOR}} （例: #ADB5BD）
```

### ニュートラルカラー

```
White: {{WHITE_COLOR}}       （例: #FFFFFF）
Black: {{BLACK_COLOR}}       （例: #000000）
Gray-50: {{GRAY_50_COLOR}}   （例: #F9FAFB）
Gray-100: {{GRAY_100_COLOR}} （例: #F3F4F6）
Gray-200: {{GRAY_200_COLOR}} （例: #E5E7EB）
Gray-300: {{GRAY_300_COLOR}} （例: #D1D5DB）
Gray-400: {{GRAY_400_COLOR}} （例: #9CA3AF）
Gray-500: {{GRAY_500_COLOR}} （例: #6B7280）
Gray-600: {{GRAY_600_COLOR}} （例: #4B5563）
Gray-700: {{GRAY_700_COLOR}} （例: #374151）
Gray-800: {{GRAY_800_COLOR}} （例: #1F2937）
Gray-900: {{GRAY_900_COLOR}} （例: #111827）
```

### セマンティックカラー

```
Success: {{SUCCESS_COLOR}}     （例: #28A745）
Warning: {{WARNING_COLOR}}     （例: #FFC107）
Danger: {{DANGER_COLOR}}       （例: #DC3545）
Info: {{INFO_COLOR}}           （例: #17A2B8）
```

### CSS変数定義

```css
:root {
  --color-primary: {{PRIMARY_COLOR}};
  --color-secondary: {{SECONDARY_COLOR}};
  --color-success: {{SUCCESS_COLOR}};
  --color-warning: {{WARNING_COLOR}};
  --color-danger: {{DANGER_COLOR}};
  --color-info: {{INFO_COLOR}};
}
```

## タイポグラフィ

<!-- TODO: フォント、サイズ、ウェイト、行間を定義 -->

### フォント設定

```
Body Font: {{BODY_FONT_FAMILY}}       （例: -apple-system, BlinkMacSystemFont, 'Segoe UI'）
Heading Font: {{HEADING_FONT_FAMILY}} （例: -apple-system, BlinkMacSystemFont, 'Segoe UI'）
Code Font: {{CODE_FONT_FAMILY}}       （例: 'Monaco', 'Menlo', 'Ubuntu Mono'）
```

### フォントサイズスケール

```
h1: {{H1_SIZE}} / {{H1_WEIGHT}}          （例: 32px / 700）
h2: {{H2_SIZE}} / {{H2_WEIGHT}}          （例: 28px / 700）
h3: {{H3_SIZE}} / {{H3_WEIGHT}}          （例: 24px / 600）
h4: {{H4_SIZE}} / {{H4_WEIGHT}}          （例: 20px / 600）
body: {{BODY_SIZE}} / {{BODY_WEIGHT}}    （例: 16px / 400）
small: {{SMALL_SIZE}} / {{SMALL_WEIGHT}}  （例: 14px / 400）
```

### 行間設定

```
Heading: {{HEADING_LINE_HEIGHT}}  （例: 1.2）
Body: {{BODY_LINE_HEIGHT}}        （例: 1.5）
Dense: {{DENSE_LINE_HEIGHT}}      （例: 1.3）
```

## コンポーネント

<!-- TODO: UI コンポーネント仕様を定義 -->

### ボタン

```
Primary Button
  - 背景色: {{PRIMARY_COLOR}}
  - テキスト色: {{WHITE_COLOR}}
  - Padding: {{BUTTON_PADDING}} （例: 12px 24px）
  - Border Radius: {{BUTTON_BORDER_RADIUS}} （例: 4px）
  - Font Size: {{BUTTON_FONT_SIZE}} （例: 16px）

Secondary Button
  - 背景色: {{SECONDARY_COLOR}}
  - テキスト色: {{WHITE_COLOR}}
  - Padding: {{BUTTON_PADDING}}
```

### フォーム要素

```
Input Field
  - Background: {{INPUT_BG_COLOR}} （例: #FFFFFF）
  - Border: 1px solid {{INPUT_BORDER_COLOR}} （例: #D1D5DB）
  - Border Radius: {{INPUT_BORDER_RADIUS}} （例: 4px）
  - Padding: {{INPUT_PADDING}} （例: 8px 12px）
  - Font Size: {{INPUT_FONT_SIZE}} （例: 16px）

Focus State
  - Border Color: {{PRIMARY_COLOR}}
  - Box Shadow: 0 0 0 3px {{PRIMARY_LIGHT_COLOR}}
```

### カード

```
Card
  - Background: {{CARD_BG_COLOR}} （例: #FFFFFF）
  - Border: 1px solid {{CARD_BORDER_COLOR}} （例: #E5E7EB）
  - Border Radius: {{CARD_BORDER_RADIUS}} （例: 8px）
  - Padding: {{CARD_PADDING}} （例: 24px）
  - Box Shadow: {{CARD_SHADOW}} （例: 0 1px 3px rgba(0,0,0,0.1)）
```

## レイアウト

<!-- TODO: スペーシング、グリッド、ブレークポイントを定義 -->

### スペーシングスケール

```
xs: {{SPACING_XS}}   （例: 4px）
sm: {{SPACING_SM}}   （例: 8px）
md: {{SPACING_MD}}   （例: 16px）
lg: {{SPACING_LG}}   （例: 24px）
xl: {{SPACING_XL}}   （例: 32px）
2xl: {{SPACING_2XL}} （例: 48px）
```

### レスポンシブブレークポイント

```
Mobile: < {{MOBILE_BREAKPOINT}}px       （例: 640px）
Tablet: {{MOBILE_BREAKPOINT}} - {{TABLET_BREAKPOINT}}px （例: 640-1024px）
Desktop: > {{TABLET_BREAKPOINT}}px      （例: 1024px）
```

### コンテナ幅

```
sm: {{CONTAINER_SM}}   （例: 640px）
md: {{CONTAINER_MD}}   （例: 768px）
lg: {{CONTAINER_LG}}   （例: 1024px）
xl: {{CONTAINER_XL}}   （例: 1280px）
2xl: {{CONTAINER_2XL}} （例: 1536px）
```

## アクセシビリティ

<!-- TODO: WCAG準拠のアクセシビリティ基準を定義 -->

### カラーコントラスト

- 通常テキスト: 最小 4.5:1（WCAG AA）
- 大きいテキスト（18.5pt以上）: 最小 3:1
- UI要素・グラフィック: 最小 3:1

### キーボードナビゲーション

- `Tab`: 次の要素へフォーカス
- `Shift + Tab`: 前の要素へフォーカス
- `Enter`: ボタン実行、フォーム送信
- `Escape`: モーダル閉じる、メニュー閉じる
- `Space`: チェックボックス切り替え、ボタン実行

### フォーカス可視性

```css
:focus-visible {
  outline: 3px solid {{PRIMARY_COLOR}};
  outline-offset: 2px;
}
```

### スクリーンリーダー対応

- `aria-label`: ボタン、アイコンに説明を付与
- `aria-describedby`: フォーム入力に説明を関連付け
- `role`: セマンティックHTMLで表現できない場合に指定
- `aria-live`: 動的更新があるエリアに付与

### Tailwind Classesの例

```html
<!-- プライマリボタン -->
<button class="bg-{{PRIMARY_COLOR}} text-{{WHITE_COLOR}} px-6 py-2 rounded-md font-semibold hover:bg-{{PRIMARY_DARK_COLOR}} focus-visible:outline focus-visible:outline-2 focus-visible:outline-{{PRIMARY_COLOR}}">
  Button
</button>

<!-- フォームフィールド -->
<input type="text" class="px-3 py-2 border border-{{GRAY_300}} rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-{{PRIMARY_COLOR}} placeholder-{{GRAY_400}}" />

<!-- カード -->
<div class="bg-white border border-{{GRAY_200}} rounded-lg p-6 shadow-sm">
  Content
</div>
```

## ダークモード

<!-- TODO: ダークモード対応の場合、カラー定義を追加 -->

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-primary: {{PRIMARY_COLOR_DARK}};
    --color-background: {{BG_COLOR_DARK}};
  }
}
```

## アニメーション・トランジション

<!-- TODO: トランジション、アニメーション基準を定義 -->

```
Duration
  - Quick: {{TRANSITION_QUICK}}     （例: 150ms）
  - Standard: {{TRANSITION_STANDARD}} （例: 250ms）
  - Slow: {{TRANSITION_SLOW}}       （例: 350ms）

Easing
  - ease-in-out
  - ease-out
  - cubic-bezier(0.4, 0, 0.2, 1)
```

## デザイン原則

<!-- TODO: プロジェクトのデザイン哲学を定義 -->

1. **シンプリシティ**: 不要な要素を排除し、本質的なUI要素に注力
2. **一貫性**: すべてのコンポーネント、ページで統一された体験
3. **アクセシビリティ**: すべてのユーザーが使用可能な設計
4. **効率性**: ユーザーが効率的にタスクを完了できる
5. **美しさ**: ビジュアル階層とタイポグラフィで優れた外観

## 参考資料

- DESIGN_RULE.md - 設計ガイドライン詳細
- コンポーネントライブラリドキュメント
- Figmaデザインファイル

