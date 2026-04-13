---
name: codex-exec
description: Codex CLIを使った任意プロンプト実行。設計品質チェック、コードベース分析、ドキュメント生成など汎用的なAI分析に使用。
allowed-tools: Bash, Read, Glob, Grep
argument-hint: <prompt> [--context <file-paths>]
---

# Codex CLI プロンプト実行

Codex CLIの`exec`コマンドを使って任意のプロンプトを実行するスキルです。

## 使用方法

### 基本コマンド

```bash
# 基本的なプロンプト実行
/codex-exec "コードベースのアーキテクチャを分析して"

# コンテキストファイル付きで実行
/codex-exec --context src/services/*.ts "これらのサービスの設計パターンを分析して"

# 設計品質チェック
/codex-exec "設計ドキュメントの品質をチェック" --context .claude/specs/feature/design.md
```

### 引数パターン

| パターン | 説明 |
|---------|------|
| `<prompt>` | 実行するプロンプト（必須） |
| `--context <paths>` | コンテキストとして読み込むファイル（オプション） |

## 実行フロー

### 1. Codex CLI可用性チェック

```bash
which codex > /dev/null 2>&1
```

インストールされていない場合は、インストール方法を案内して終了。

### 2. 引数パース

$ARGUMENTSを解析：
- プロンプト部分を抽出
- `--context`オプションがあればファイルパスを抽出

### 3. コンテキスト準備（オプション）

`--context`が指定されている場合：
- 指定されたファイルを読み込む
- プロンプトにコンテキストとして追加

### 4. Codex exec実行

```bash
codex exec "$PROMPT"
```

または、コンテキスト付きの場合：
```bash
codex exec "$PROMPT

## Context Files
$FILE_CONTENTS"
```

### 5. 結果表示

- Codex出力をそのまま表示
- エラーがあればエラーメッセージを表示

## 主な用途

### 設計品質チェック

```
/codex-exec "以下の設計ドキュメントの品質をチェックして:
1. 完全性 - 要件がすべてカバーされているか
2. 明確性 - インターフェースが明確か
3. 一貫性 - 命名と構造が一貫しているか
4. 型安全性 - 型が適切に定義されているか"
```

### コードベース分析

```
/codex-exec "このコードベースの:
1. 使用パターン
2. 統合ポイント
3. 再利用可能なコンポーネント
4. 潜在的な問題
を分析して"
```

### ドキュメント生成

```
/codex-exec "このコードからAPIドキュメントを生成して" --context src/api/**/*.ts
```

## エラーハンドリング

| エラー | 対処 |
|-------|------|
| Codex CLI未インストール | `npm i -g @openai/codex`でインストール |
| 認証エラー | `codex login`で認証 |
| タイムアウト | より小さいコンテキストで再試行 |
| コンテキストファイルなし | ファイルパスを確認 |

## codex-reviewとの違い

| スキル | コマンド | 用途 |
|-------|---------|------|
| codex-review | `codex review` | コード変更のレビュー（diff分析） |
| codex-exec | `codex exec` | 任意プロンプト実行（汎用分析） |

## 関連スキル

- `/codex-review` - コードレビュー
- `/business-knowledge` - ドメイン知識参照
