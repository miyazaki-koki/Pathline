# CC-SDD Template Repository

Claude Code + CC-SDD（Spec-Driven Development）のテンプレートリポジトリ。
新規プロジェクトの起点として使用し、Claude Codeによる高品質な開発を即座に始められます。

## 目次

- [概要](#概要)
- [クイックスタート](#クイックスタート)
- [ディレクトリ構成](#ディレクトリ構成)
- [セットアップ手順](#セットアップ手順)
- [CC-SDDワークフロー](#cc-sddワークフロー)
- [マルチエージェント開発](#マルチエージェント開発)
- [カスタマイズガイド](#カスタマイズガイド)
- [ベストプラクティス](#ベストプラクティス)
- [ライセンス](#ライセンス)

---

## 概要

### CC-SDD（Claude Code Spec-Driven Development）とは

CC-SDDは、Claude Codeと統合された**仕様駆動型開発方法論**です。プロダクト設計から実装まで、段階的で検証可能なプロセスに従うことで、以下を実現します：

- **品質保証**: テスト駆動開発（TDD）による厳格な検証
- **要件の明確化**: 設計フェーズで完全な仕様化
- **効率的な実装**: 曖昧性を排除し、集中力を高める
- **マルチエージェント対応**: 複数のAIエージェントが協力して開発

### このテンプレートが提供するもの

このテンプレートには、CC-SDDベースのプロジェクト開発に必要なすべてが含まれています：

1. **Claude Code設定** (`.claude/`)
   - エージェント定義（チームリード、バックエンド、フロントエンド）
   - CC-SDDコマンド（7つのワークフローステップ）
   - 開発スキル（テスト、デザイン、ビジネス知識）

2. **Kiro設定ファイル** (`.kiro/`)
   - **steering文書**: プロジェクトの「記憶」（プロダクト、技術、構造、デザイン、テスト、チームプロトコル）
   - **settings**: ルールテンプレートと仕様テンプレート
   - **specs**: 機能ごとの仕様管理（各フェーズで段階的に完成）

3. **TDD強制機構**
   - Canon TDDサイクル（RED → GREEN → BLUE）
   - テストファースト実装
   - 検証コマンド（`/kiro:validate-design`, `/kiro:validate-impl`など）

4. **チームプロトコル**
   - マルチエージェント開発ルール
   - コミュニケーション規約
   - Git操作ガイドライン

### 想定ユーザー

- **新規プロジェクト立ち上げメンバー**: CC-SDDのベストプラクティスに従いたい
- **Claude Code利用開発チーム**: 高品質な自動化開発を実現したい
- **スタートアップ/小規模チーム**: 少人数で高品質プロダクトを作りたい
- **既存プロジェクト改善チーム**: TDD + 仕様駆動へ移行したい

---

## クイックスタート

### 方法1: GitHub Templateから（推奨）

```bash
# GitHub CLIを使用してテンプレートから新規リポジトリを作成
gh repo create my-project --template miyazaki-koki/template --private
cd my-project

# プレースホルダーを置換（次のステップで詳細を説明）
claude "CLAUDE.mdと.kiro/steering/のすべてのプレースホルダーをこのプロジェクト向けに置換してください"

# Claude Code CLIで開発開始
claude
```

### 方法2: 手動クローン

```bash
git clone https://github.com/miyazaki-koki/template.git my-project
cd my-project
git remote set-url origin https://github.com/YOUR_USERNAME/my-project.git
# プレースホルダーを置換
# Claude Codeで開発開始
```

### 方法3: 手作業でコピー

テンプレートディレクトリをコピーして、`git init`で新しいリポジトリを初期化します。

---

## ディレクトリ構成

```
├── README.md                          # このファイル
├── CLAUDE.md                          # プロジェクト全体のガイド（Claude Code用）
├── .claude/
│   ├── agents/                        # エージェント定義（AI開発チーム）
│   │   ├── backend-engineer.md        # バックエンド専門エージェント
│   │   ├── frontend-engineer.md       # フロントエンド専門エージェント
│   │   └── team-lead.md               # プロジェクト統括エージェント
│   ├── commands/
│   │   └── kiro/                      # CC-SDDコマンド（ワークフロー）
│   │       ├── spec-init.md           # Phase 1: スペック初期化
│   │       ├── spec-requirements.md   # Phase 2: 要件定義
│   │       ├── spec-design.md         # Phase 3: 技術設計
│   │       ├── spec-tasks.md          # Phase 4: タスク生成
│   │       ├── spec-impl.md           # Phase 5: TDD実装
│   │       ├── validate-design.md     # 設計検証
│   │       ├── validate-impl.md       # 実装検証
│   │       ├── validate-gap.md        # ギャップ分析
│   │       ├── steering.md            # steering文書の表示・更新
│   │       ├── steering-custom.md     # steering文書のカスタマイズ
│   │       ├── spec-status.md         # 仕様状態確認
│   │       └── code-simplify.md       # コード簡潔化
│   └── skills/                        # 開発スキル（拡張可能）
│       ├── business-knowledge/        # ビジネス知識スキル
│       ├── design-system/             # デザインシステムスキル
│       ├── feature-design/            # 機能設計スキル
│       ├── development-guide/         # 開発ガイドスキル
│       ├── learn-break/               # 学習・休憩スキル
│       └── learn-quiz/                # クイズスキル
├── .kiro/                             # Kiroプロジェクト構成
│   ├── steering/                      # プロジェクトの「記憶」（最重要）
│   │   ├── product.md                 # プロダクト概要・ビジネスモデル
│   │   ├── tech.md                    # 技術スタック・アーキテクチャ
│   │   ├── structure.md               # プロジェクト構造・レイアウト
│   │   ├── design.md                  # デザインシステム・カラーパレット（オプション）
│   │   ├── testing.md                 # テスト規約・テスト戦略（オプション）
│   │   └── team-protocol.md           # チームプロトコル・ルール（オプション）
│   ├── settings/
│   │   ├── rules/                     # プロジェクトルール定義
│   │   └── templates/                 # 仕様テンプレート
│   │       ├── specs/
│   │       │   ├── init.json          # スペック初期化テンプレート
│   │       │   └── requirements-init.md
│   │       └── ...
│   └── specs/                         # 機能スペック（段階的に成長）
│       └── example-feature/           # サンプルスペック（削除可能）
│           ├── spec.json              # メタデータ
│           ├── requirements.md        # 要件定義
│           ├── design.md              # 技術設計
│           ├── tasks.md               # タスク一覧
│           └── tests/                 # テストコード（実装フェーズで作成）
├── .github/
│   └── workflows/                     # CI/CDワークフロー
│       └── kiro-lint.yml              # CC-SDD検証ワークフロー
├── src/                               # ソースコード（プロジェクト依存）
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── types/
│   └── ...
└── package.json / pyproject.toml / Gemfile  # 依存関係定義
```

### 重要なファイル

| ファイル | 目的 | 編集者 |
|---------|------|--------|
| `CLAUDE.md` | プロジェクト全体ガイド | チームリード |
| `.kiro/steering/*` | プロジェクト記憶・方針 | チームリード（定期更新） |
| `.kiro/specs/*/` | 機能ごと仕様 | バックエンド/フロントエンド |
| `.claude/commands/kiro/` | ワークフロー定義 | 変更不可（テンプレート） |

---

## セットアップ手順

### Step 1: テンプレートの取得

前述のクイックスタートに従ってテンプレートを取得してください。

### Step 2: プレースホルダーの置換

テンプレート内には複数のプレースホルダーが含まれています。これらをプロジェクト固有の値に置換します。

#### 置換対象プレースホルダー一覧

| プレースホルダー | 説明 | 例 |
|--------------|------|-----|
| `{{PROJECT_NAME}}` | プロジェクト名 | TaskFlow, BlogSystem |
| `{{PROJECT_DESCRIPTION}}` | プロジェクト説明 | タスク管理アプリケーション |
| `{{FRAMEWORK}}` | Webフレームワーク | Next.js 15, Remix, Django |
| `{{UI_LIBRARY}}` | UIライブラリ | Tailwind CSS, shadcn/ui |
| `{{TEST_FRAMEWORK}}` | テストフレームワーク | Vitest, Jest, pytest |
| `{{TEST_COMMAND}}` | テスト実行コマンド | npm test, pytest |
| `{{TEST_WATCH_COMMAND}}` | テスト監視コマンド | npm run test:watch |
| `{{DEV_COMMAND}}` | 開発サーバーコマンド | npm run dev |
| `{{BUILD_COMMAND}}` | ビルドコマンド | npm run build |
| `{{LINT_COMMAND}}` | Lintコマンド | npm run lint |
| `{{PRIMARY_COLOR}}` | メインカラー | #3B82F6 (Tailwind blue-500) |
| `{{SECONDARY_COLOR}}` | サブカラー | #8B5CF6 |
| `{{DANGER_COLOR}}` | 危険色 | #EF4444 |
| `{{TEXT_COLOR}}` | テキスト色 | #1F2937 |

#### 置換方法

**方法A: Claude Codeで自動置換（推奨）**

```bash
claude "CLAUDE.mdと.kiro/steering/のすべてのプレースホルダーをこのプロジェクト向けに置換してください。
プロジェクト名: MyAwesomeApp
説明: ユーザーのタスク管理と時間追跡ツール
フレームワーク: Next.js 15
UIライブラリ: Tailwind CSS + shadcn/ui
テストフレームワーク: Vitest"
```

**方法B: sed コマンドで一括置換**

```bash
# 環境変数を設定
PROJECT_NAME="MyAwesomeApp"
PROJECT_DESCRIPTION="ユーザーのタスク管理と時間追跡ツール"
FRAMEWORK="Next.js 15"
UI_LIBRARY="Tailwind CSS"
TEST_FRAMEWORK="Vitest"
TEST_COMMAND="npm test"
DEV_COMMAND="npm run dev"
BUILD_COMMAND="npm run build"
LINT_COMMAND="npm run lint"

# 一括置換実行
find . -type f \( -name "*.md" -o -name "*.json" \) -exec sed -i \
  -e "s|{{PROJECT_NAME}}|$PROJECT_NAME|g" \
  -e "s|{{PROJECT_DESCRIPTION}}|$PROJECT_DESCRIPTION|g" \
  -e "s|{{FRAMEWORK}}|$FRAMEWORK|g" \
  -e "s|{{UI_LIBRARY}}|$UI_LIBRARY|g" \
  -e "s|{{TEST_FRAMEWORK}}|$TEST_FRAMEWORK|g" \
  -e "s|{{TEST_COMMAND}}|$TEST_COMMAND|g" \
  -e "s|{{DEV_COMMAND}}|$DEV_COMMAND|g" \
  -e "s|{{BUILD_COMMAND}}|$BUILD_COMMAND|g" \
  -e "s|{{LINT_COMMAND}}|$LINT_COMMAND|g" \
  {} \;
```

**方法C: 手動編集**

`CLAUDE.md` と `.kiro/steering/` 内のすべてのファイルを開き、プレースホルダーを手動で置換します。

### Step 3: Steering文書のカスタマイズ

steering文書はプロジェクトの「記憶」です。チームが最初に作成・同意すべき重要な文書です。

#### 各ファイルの役割と編集内容

**`.kiro/steering/product.md`** - プロダクト戦略
- ターゲットユーザー
- コア機能
- 価値提案（競合優位性）
- 設計思想
- 成功メトリクス
- 制約と境界

推奨行数: 100-150行

**`.kiro/steering/tech.md`** - 技術決定
- 言語・フレームワークの選定理由
- データベース設計
- API仕様
- 環境構成（開発・ステージング・本番）
- 依存関係の方針

推奨行数: 100-150行

**`.kiro/steering/structure.md`** - プロジェクト構成
- ディレクトリレイアウト
- 各ディレクトリの責務
- ファイル命名規則
- モジュール依存関係

推奨行数: 80-120行

**`.kiro/steering/design.md`** - デザインシステム（オプション）
- カラーパレット
- タイポグラフィ
- コンポーネント設計原則
- アクセシビリティ要件

推奨行数: 50-100行

**`.kiro/steering/testing.md`** - テスト戦略（オプション）
- ユニットテスト範囲
- 統合テスト方針
- E2Eテスト対象
- カバレッジ目標

推奨行数: 50-100行

**`.kiro/steering/team-protocol.md`** - チームルール（オプション）
- コードレビュー基準
- コミットメッセージ規約
- PR作成ルール
- 意思決定プロセス

推奨行数: 60-100行

#### Steering文書の更新方法

```bash
# 既存のsteering文書を表示・確認
claude /kiro:steering

# steering文書をカスタマイズ
claude /kiro:steering-custom "product.md に新しいセクション「ローカライゼーション戦略」を追加"
```

### Step 4: GitHub Actionsの設定（オプション）

CC-SDDワークフローをCI/CDで自動実行する場合、GitHub Secretsを設定します。

```bash
# 1. GitHub リポジトリの Settings > Secrets and variables > Actions に移動
# 2. 以下のシークレットを追加

# CLAUDE_CODE_OAUTH_TOKEN: Claude Code のOAuthトークン
# 取得方法: `claude auth login` で認証後、トークン情報を確認

# 3. .github/workflows/kiro-lint.yml の有効化
# リポジトリルートで以下を実行:
git add .github/workflows/
git commit -m "Enable CI/CD workflow"
git push origin main
```

### Step 5: サンプルスペックの確認・削除

テンプレートに含まれる `example-feature` スペックは、CC-SDDのワークフローを理解するためのサンプルです。

```bash
# サンプルを確認してワークフローを理解する
claude /kiro:spec-status

# 理解したら削除
rm -rf .kiro/specs/example-feature/
git add .kiro/specs/
git commit -m "Remove example feature spec"
```

---

## CC-SDDワークフロー

CC-SDDは以下の5つのフェーズで構成されます。各フェーズは前フェーズが完了してから開始します。

### ワークフロー図

```
┌─────────────────────────────────────────────────────────────────┐
│                   Feature Implementation Loop                    │
└─────────────────────────────────────────────────────────────────┘

/kiro:spec-init
    ↓
    └─→ 機能名・説明生成
        spec.json作成


/kiro:spec-requirements
    ↓
    └─→ ユースケース・受理基準定義
        requirements.md作成


/kiro:spec-design
    ↓
    └─→ 技術アーキテクチャ・実装方針決定
        design.md作成


/kiro:spec-tasks
    ↓
    └─→ 実装タスク・テストシナリオ生成
        tasks.md作成


/kiro:spec-impl (Canon TDD)
    ↓
    ┌─ 🔴 RED: テスト作成
    │
    ├─ 🟢 GREEN: 実装
    │
    └─ 🔵 BLUE: リファクタリング
    
    ↓
    └─→ コード・テストのチェックイン


検証（必要に応じて）
    ├─ /kiro:validate-design  → 設計レビュー
    ├─ /kiro:validate-impl    → 実装検証
    └─ /kiro:validate-gap     → ギャップ分析
```

### 各フェーズの概要

#### Phase 1: スペック初期化 (`/kiro:spec-init`)

**目的**: 新機能のスペックディレクトリ構造を作成し、初期メタデータを生成

**入力**: 機能説明（1文から数行）

**実行例**:
```bash
claude /kiro:spec-init "ユーザーがタスクを作成・編集・削除できる機能"
```

**出力**:
- `.kiro/specs/create-edit-delete-tasks/spec.json`
- `.kiro/specs/create-edit-delete-tasks/requirements.md`

**所要時間**: 1-2分

---

#### Phase 2: 要件定義 (`/kiro:spec-requirements`)

**目的**: ユースケース・受理基準・エッジケースを明確化

**入力**: スペック名（フェーズ1で作成）

**実行例**:
```bash
claude /kiro:spec-requirements create-edit-delete-tasks
```

**出力**:
- `requirements.md` の詳細化
  - Happy Path: 正常系シナリオ
  - Edge Cases: 境界値・特殊ケース
  - Error Cases: エラーハンドリング
  - 受理基準（Acceptance Criteria）

**チェックリスト**:
- [ ] すべてのユースケースが列挙されているか
- [ ] 受理基準が測定可能か（testable）
- [ ] 依存関係が明記されているか

**所要時間**: 15-30分

---

#### Phase 3: 技術設計 (`/kiro:spec-design`)

**目的**: 実装方針・API仕様・データモデルを設計

**入力**: スペック名 + 要件書の内容

**実行例**:
```bash
claude /kiro:spec-design create-edit-delete-tasks
```

**出力**:
- `design.md`
  - システム構成図（テキストベース）
  - API仕様（エンドポイント・入出力）
  - データモデル（スキーマ）
  - エラーハンドリング方針
  - パフォーマンス考慮

**検証**: `/kiro:validate-design` で設計が要件を満たしているか確認

```bash
claude /kiro:validate-design create-edit-delete-tasks
```

**所要時間**: 30-60分

---

#### Phase 4: タスク生成 (`/kiro:spec-tasks`)

**目的**: 設計に基づいて実装タスクを生成

**入力**: スペック名 + 設計書

**実行例**:
```bash
claude /kiro:spec-tasks create-edit-delete-tasks
```

**出力**:
- `tasks.md`
  - タスク一覧（実装順序付き）
  - 各タスクのテスト計画
  - 依存関係グラフ

**例**:
```
Task 1: TaskデータモデルのTypeScript型定義
  - テスト: 型が正しくコンパイルされる
  
Task 2: createTask API実装 (POST /api/tasks)
  - テスト: 正常系・バリデーションエラー・DB失敗
  
Task 3: editTask API実装 (PATCH /api/tasks/:id)
  - 依存: Task 1, Task 2
```

**所要時間**: 20-30分

---

#### Phase 5: TDD実装 (`/kiro:spec-impl`)

**目的**: Canon TDDサイクルに従い、テストファーストで実装

**入力**: スペック名 + タスク一覧

**実行例**:
```bash
claude /kiro:spec-impl create-edit-delete-tasks
```

**実装サイクル（厳守）**:

```
🔴 RED Phase
└─ タスクに対するテストを先に書く
   - Happy path
   - Edge case
   - Error case
   └─ テストは失敗する（実装がないため）

🟢 GREEN Phase
└─ テストを通す最小限のコードのみ実装
   - 一時的な実装もOK
   - リファクタリングは後で
   
🔵 BLUE Phase
└─ テストをGREENに保ちながらリファクタリング
   - コード品質向上
   - DRY原則の適用
   - 読みやすさ改善
```

**チェックポイント例**:

```bash
# 実装状況確認
npm test

# テストカバレッジ確認
npm test -- --coverage

# 品質チェック
npm run lint
```

**所要時間**: 2-4時間/タスク（タスク複雑度による）

---

### 検証コマンド

実装中・後に仕様との整合性を確認できます。

```bash
# 設計が要件を満たしているか確認
claude /kiro:validate-design [spec-name]

# 実装がコードで実証されているか確認
claude /kiro:validate-impl [spec-name]

# 要件・設計・実装のギャップ分析
claude /kiro:validate-gap [spec-name]
```

---

## マルチエージェント開発

このテンプレートは3つのエージェントが協力して開発することを想定しています。

### エージェント構成

#### Team Lead (`.claude/agents/team-lead.md`)

**責務**:
- プロダクト全体の方向性・ビジョン管理
- steering文書の維持・更新
- Spec管理・優先順位付け
- 品質ゲート・最終承認

**コマンド例**:
```bash
# steering文書を表示・確認
claude /kiro:steering

# steering文書をカスタマイズ
claude /kiro:steering-custom "新しい制約条件を追加"

# プロジェクト全体の状態確認
claude /kiro:spec-status
```

**実行タイミング**: スプリント開始・レビュー時

---

#### Backend Engineer (`.claude/agents/backend-engineer.md`)

**責務**:
- API設計・実装
- データベース・スキーマ設計
- ビジネスロジック実装
- サーバーサイドテスト

**スペック例**:
```bash
# スペック要件の理解
claude /kiro:spec-requirements authentication

# 技術設計の策定
claude /kiro:spec-design authentication

# 実装タスク生成
claude /kiro:spec-tasks authentication

# TDD実装（Phase 5）
claude /kiro:spec-impl authentication
```

**実行タイミング**: スプリント中の各タスク

---

#### Frontend Engineer (`.claude/agents/frontend-engineer.md`)

**責務**:
- UI コンポーネント設計・実装
- ページ・ルーティング
- ユーザーインタラクション実装
- E2Eテスト

**スペック例**:
```bash
# UI要件の確認
claude /kiro:spec-requirements task-list-ui

# コンポーネント設計
claude /kiro:spec-design task-list-ui

# UI実装タスク
claude /kiro:spec-tasks task-list-ui

# TDD実装
claude /kiro:spec-impl task-list-ui
```

---

### マルチエージェント協調ルール

1. **Spec共有**: すべてのエージェントが同じ仕様書を参照
2. **順序依存**: バックエンド API → フロントエンド実装
3. **インターフェース定義**: 設計フェーズで API/型を完全に決定
4. **同期ポイント**: 各フェーズ完了時にレビュー・フィードバック
5. **紛争解決**: Team Leadが最終判断

### コマンドチェーン例（サンプルワークフロー）

```bash
# 1. Team Lead: 機能定義
claude /kiro:spec-init "ユーザー認証（メール・パスワード）"

# 2. Team Lead + Backend: 要件確認
claude /kiro:spec-requirements user-authentication

# 3. Backend: API設計
claude /kiro:spec-design user-authentication

# 4. Team Lead: 設計レビュー
claude /kiro:validate-design user-authentication

# 5. Backend + Frontend: タスク生成・確認
claude /kiro:spec-tasks user-authentication

# 6. Backend: API実装
claude /kiro:spec-impl user-authentication

# 7. Frontend: UI実装（Backend完了後）
claude /kiro:spec-impl user-authentication-ui

# 8. Team Lead: 最終検証
claude /kiro:validate-impl user-authentication
```

---

## カスタマイズガイド

### Steering文書の追加

新しい領域を追跡する必要がある場合、steering文書を追加できます。

```bash
# カスタムsteering文書の追加
claude /kiro:steering-custom "パフォーマンス最適化戦略を .kiro/steering/performance.md に追加"
```

### 新しいスキルの追加

開発中によく使う手順やチェックリストをスキル化して再利用できます。

**例**: テストカバレッジ分析スキル

```bash
# .claude/skills/coverage-analyzer/SKILL.md を作成
```

内容例:
```markdown
# Coverage Analyzer Skill

# 目的
テストカバレッジを分析し、改善提案を生成

# 実行手順
1. カバレッジレポート生成
2. 未カバー領域を抽出
3. 優先度付けして改善提案

# ツール
- npm test -- --coverage
```

### エージェント定義のカスタマイズ

プロジェクト固有のロール（QA Engineer など）を追加する場合：

```bash
# .claude/agents/qa-engineer.md を作成
```

内容例:
```markdown
---
name: QA Engineer
description: 品質保証・テスト戦略

allowed-tools:
  - Read
  - Bash
  - Write
  - Glob

model: claude-opus-4
---

# QA Engineer Role

## 責務
- テスト計画策定
- バグ報告・管理
- リグレッションテスト
```

---

## ベストプラクティス

### 1. Steering文書は簡潔に

- **目標行数**: 100-200行（ファイルごと）
- **理由**: エージェントが完全に理解・参照できる必要
- **内容**: 「なぜ」が明確に書かれているか確認

### 2. スペックは機能単位で作成

**良い粒度**:
- ❌ 「タスク管理アプリ全体」（大きすぎる）
- ✅ 「ユーザー認証」「タスク作成」「タスク一覧表示」
- ✅ 1スペック = 1-2日の実装作業量

### 3. TDDサイクルは厳守

- テストなしで実装しない
- REDフェーズを必ず経験する
- GREENで止めず、BLUEまで進める

### 4. インターフェース先行設計

- API仕様・データ型を先に決定
- 設計フェーズで完全にロック
- バックエンド・フロントエンドが並行実装可能

### 5. 定期的にSteering文書を更新

- スプリント終了時に振り返り
- 判明した新しい制約・原則を追加
- チーム全体でレビュー

### 6. スペック完了の基準

各フェーズの完了条件：

**Phase 1 (Init)**:
- spec.json が生成されている
- requirements.md のテンプレートが存在

**Phase 2 (Requirements)**:
- Happy Path / Edge Cases / Error Cases が列挙
- 受理基準がすべてtestableか確認

**Phase 3 (Design)**:
- API仕様が完全（エンドポイント・リクエスト・レスポンス）
- データモデルが定義
- /kiro:validate-design をパス

**Phase 4 (Tasks)**:
- タスク順序が依存関係を反映
- 各タスクにテスト計画あり

**Phase 5 (Impl)**:
- すべてテストがGREEN
- コードカバレッジ > 80%
- /kiro:validate-impl をパス

### 7. ドキュメント同期

- コード変更時に仕様書も更新
- 実装時に新しい制約が判明したら、steering文書に追記
- 月1回、全ドキュメント一貫性チェック

---

## ライセンス

このテンプレートはMIT Licenseの下で公開されています。

自由に使用・改変・配布できます。詳細は [LICENSE](./LICENSE) ファイルを参照してください。

---

## サポート・フィードバック

- **Issue報告**: https://github.com/miyazaki-koki/template/issues
- **Discussion**: https://github.com/miyazaki-koki/template/discussions
- **ドキュメント改善提案**: PR歓迎

---

## 関連資料

### CC-SDD関連
- [Claude Code公式ドキュメント](https://claude.ai/)
- [Spec-Driven Development入門](#)
- [Kent Beck のCanon TDD](https://pragprog.com/titles/tpp20/test-driven-development-20/)

### テンプレート活用例
- [Next.js + Tailwind プロジェクト例](#)
- [Django + React プロジェクト例](#)

---

**Last Updated**: 2026-04-13
**Template Version**: 1.0
**Maintained by**: Koki Miyazaki
