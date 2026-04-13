---
name: codex-review
description: Codex CLIを使った自動コードレビュー。開発ブランチのdiff確認、未コミット変更のレビュー、スペック基づくレビューに使用。実装完了後、PR作成前に使用。
allowed-tools: Bash, Read, Glob, Grep
argument-hint: [--uncommitted | --base <branch> | --spec <feature>] [instructions]
---

# Codex CLI コードレビュー

Codex CLIを使って自動コードレビューを実行するスキルです。

## 使用方法

### 基本コマンド

```bash
# 未コミット変更のレビュー（デフォルト）
/codex-review

# developブランチとの差分をレビュー
/codex-review --base develop

# 特定のスペックに基づいてレビュー
/codex-review --spec feature-name

# カスタム指示でレビュー
/codex-review "セキュリティ脆弱性に注目してレビュー"
```

### 引数パターン

| パターン | モード | 説明 |
|---------|------|------|
| なし / `--uncommitted` | 未コミット | ステージング済み・未ステージング変更をレビュー |
| `--base <branch>` | ブランチ差分 | 指定ブランチとの差分をレビュー |
| `--spec <feature>` | スペック連携 | スペックコンテキストでレビュー |
| それ以外 | カスタム | カスタム指示でレビュー |

## 実行フロー

### 1. 引数パース

$ARGUMENTSを解析してレビューモードを決定：

- `--uncommitted` または空 → 未コミット変更レビュー
- `--base <branch>` → ブランチ差分レビュー
- `--spec <feature>` → スペック連携レビュー
- その他 → カスタム指示レビュー

### 2. コンテキスト準備

**スペック連携モードの場合**:
```
読み込み:
- .claude/specs/<feature>/design.md（アーキテクチャ）
- .claude/specs/<feature>/tasks.md（実装タスク）
- .claude/specs/<feature>/requirements.md（要件）
- git diff --name-only develop（変更ファイル一覧）
```

### 3. Codex CLIレビュー実行

**未コミット変更レビュー**:
```bash
codex review --uncommitted
```

**ブランチ差分レビュー**:
```bash
codex review --base develop
```

**スペック連携レビュー**:

スペック連携モードでは、スペックコンテキストをCodexに渡すために `codex exec` を使用：

1. スペックファイル（design.md, tasks.md, requirements.md）を読み込む
2. git diff で変更ファイル一覧を取得
3. `codex exec` でスペックコンテキストを含むプロンプトを実行

```bash
codex exec "Review the code changes against the following specification:

## Design Context
[design.md summary]

## Tasks
[tasks.md summary]

## Changed Files
[git diff --name-only output]

## Review Checklist
1. Spec alignment - Does implementation match design?
2. Task completion - Are tasks correctly implemented?
3. Code quality - Best practices followed?
4. Test coverage - Tests exist and meaningful?"
```

**NOTE**: スペック連携レビューでは `codex review` ではなく `codex exec` を使用する。

### 4. 結果表示

レビュー結果を以下の形式で表示：

1. **レビュー対象**: ファイル一覧
2. **Codex出力**: レビュー結果
3. **重要度別整理**: Critical → Warning → Info
4. **アクション項目**: 修正が必要な項目

## ワークフローとの統合

```
実装サイクル:
1. 実装を完了
2. /codex-review --spec <feature>       # Codexレビュー ← ここ
3. スペック検証を実施
4. 問題があれば修正
5. PR作成
```

## Codex CLIオプション

主要オプション:

| オプション | 説明 |
|----------|------|
| `--uncommitted` | 未コミット変更をレビュー |
| `--base <branch>` | ブランチ差分をレビュー |
| `--commit <sha>` | 特定コミットをレビュー |
| `--title <title>` | レビューサマリーにタイトル表示 |

## エラーハンドリング

| エラー | 対処 |
|-------|------|
| Codex CLI未インストール | `npm i -g @openai/codex`でインストール |
| 認証エラー | `codex login`で認証 |
| 変更なし | レビュー対象なしを報告 |
| タイムアウト | より小さいスコープで再試行 |

## レビュー観点

Codexレビューでチェックする項目：

### コード品質
- 型安全性（TypeScriptで`any`禁止）
- エラーハンドリング
- 命名規則

### ベストプラクティス
- DRY原則
- 単一責任原則
- 適切な抽象化

### テスト
- 新規コードのテストカバレッジ
- 意味のあるテストケース

### セキュリティ
- 入力バリデーション
- 認証情報のハードコード禁止
- インジェクション防止

## 関連スキル

- `/codex-exec` - 汎用プロンプト実行
- `/business-knowledge` - ドメイン知識参照
