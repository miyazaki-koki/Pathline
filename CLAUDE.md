# CLAUDE.md

Claude Code向けのプロジェクトガイド。詳細は `.kiro/steering/` を参照。

## Project Overview

<!-- TODO: プロジェクト概要を記載 -->
**{{PROJECT_NAME}}** は{{PROJECT_DESCRIPTION}}。

### Core Capabilities

<!-- TODO: プロジェクトの主要機能を記載 -->
- **機能1**: 説明
- **機能2**: 説明
- **機能3**: 説明

### Design Philosophy

<!-- TODO: 設計思想を記載 -->
- **原則1**: 説明
- **原則2**: 説明

## Technology Stack

<!-- TODO: 使用技術を記載 -->
- **Language**: TypeScript 5+ (strict mode)
- **Web Framework**: {{FRAMEWORK}} (例: Next.js 15, Remix, Nuxt)
- **UI**: {{UI_LIBRARY}} (例: Tailwind CSS, shadcn/ui)
- **Testing**: {{TEST_FRAMEWORK}} (例: Vitest, Jest)

## Project Structure

<!-- TODO: プロジェクト構造を記載 -->
```
src/
├── app/              # ページ・ルーティング
├── components/       # UIコンポーネント
│   ├── ui/           # 汎用UIコンポーネント
│   └── features/     # 機能別コンポーネント
├── lib/              # ユーティリティ・ヘルパー
├── types/            # 型定義
└── ...
```

## Development Commands

<!-- TODO: 開発コマンドを記載 -->
```bash
# Dev
{{DEV_COMMAND}}

# Build
{{BUILD_COMMAND}}

# Test
{{TEST_COMMAND}}

# Lint
{{LINT_COMMAND}}
```

## Architecture Principles

<!-- TODO: アーキテクチャ原則を記載 -->
### レイヤー設計
- 表示 / ロジック / データの分離
- 型安全性の徹底

### データフロー
```
データソース → 型定義 → ロジック → コンポーネント → 表示
```

## Implementation: Canon TDD

実装タスクはKent BeckのCanon TDDに従う。

### TDD Cycle (厳守)

```
🔴 RED   → 🟢 GREEN → 🔵 BLUE → Repeat
```

| Phase | Action | Rule |
|-------|--------|------|
| 🔴 RED | テストを書く | 実装コードより先にテストを書く。テストは失敗すること |
| 🟢 GREEN | 実装を書く | テストを通す最小限のコードのみ |
| 🔵 BLUE | リファクタリング | テストをGREENに保ちながら改善 |

### Two Hats Rule (Kent Beck)

```
🎩 HAT 1 (GREEN): Make it work - 動くコードを書く
🎩 HAT 2 (BLUE):  Make it right - 構造を改善する

⚠️ 2つの帽子を同時にかぶらない
```

### Implementation Flow

1. **Test List作成**: 実装前に振る舞いシナリオをリスト化
   - Happy path（正常系）
   - Edge cases（境界値）
   - Error cases（異常系）

2. **One Test at a Time**: リストから1つずつテスト→実装→リファクタリング

3. **Checkpoint**: 各フェーズ完了時に状態を報告
   - `🔴 RED: [behavior] test fails as expected`
   - `🟢 GREEN: [behavior] implemented and test passes`
   - `🔵 BLUE: Refactoring complete, tests remain GREEN`

### Test Commands

```bash
{{TEST_COMMAND}}
{{TEST_WATCH_COMMAND}}
```

詳細は `.claude/commands/kiro/spec-impl.md` を参照。

## Design System

<!-- TODO: デザインシステムを記載。DESIGN_RULE.md を別途作成する場合はそちらを参照 -->
```typescript
// Primary Colors
accent.primary: '{{PRIMARY_COLOR}}'
accent.secondary: '{{SECONDARY_COLOR}}'
accent.danger: '{{DANGER_COLOR}}'
primary: '{{TEXT_COLOR}}'
```

詳細は `DESIGN_RULE.md` を参照（別途作成する場合）。

## Git操作ルール

- **フォースプッシュ禁止**: `git push --force` は事前承認なしに実行しない
- コミットは Working Tree がクリーンな状態で行う
- コミットメッセージは変更の「why」を説明

## 応答言語

- **会話**: 日本語
- **コード**: 英語（変数名、関数名）
- **UIテキスト**: 日本語

## 詳細ドキュメント

- `.kiro/steering/product.md` - プロダクト概要・ビジネスモデル
- `.kiro/steering/tech.md` - 技術スタック
- `.kiro/steering/structure.md` - プロジェクト構造
- `.kiro/steering/design.md` - デザインシステム
- `.kiro/steering/testing.md` - テスト規約
- `.kiro/steering/team-protocol.md` - チームプロトコル
