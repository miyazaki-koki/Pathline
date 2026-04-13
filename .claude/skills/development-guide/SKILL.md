---
name: development-guide
description: プロジェクト開発ガイド。プロジェクト構成、開発環境セットアップ、コマンド、アーキテクチャ、コーディング規則を一元管理。
allowed-tools: Read, Glob, Grep, Bash
---

# 開発ガイド

<!-- TODO: このドキュメントを使用プロジェクト固有の開発情報で更新 -->

## プロジェクト構成

<!-- TODO: プロジェクト構造を記載 -->

```
<!-- TODO: ディレクトリ構造を追加 -->
```

## 環境セットアップ

### 前提条件

<!-- TODO: 必要なバージョンを指定 -->

- Node.js: {{NODE_VERSION}} （例: 18.x）
- npm/yarn: {{NPM_VERSION}} （例: 9.x）
- <!-- TODO: その他ツール -->

### インストール手順

```bash
# 1. リポジトリをクローン
git clone {{REPOSITORY_URL}}
cd {{PROJECT_NAME}}

# 2. 依存関係をインストール
npm install

# 3. 環境変数をセットアップ
cp .env.example .env.local

# 4. 開発サーバーを起動
npm run dev
```

### 環境変数

<!-- TODO: 必要な環境変数を定義 -->

```env
# .env.local
{{ENV_VAR_1}}=value
{{ENV_VAR_2}}=value
```

## 開発コマンド

<!-- TODO: 開発に必要なコマンド一覧 -->

### 基本コマンド

```bash
# 開発サーバー起動
{{DEV_COMMAND}}

# 本番ビルド
{{BUILD_COMMAND}}

# テスト実行
{{TEST_COMMAND}}

# リント
{{LINT_COMMAND}}

# フォーマット
{{FORMAT_COMMAND}}
```

### Makefile / npm scripts

<!-- TODO: よく使用するコマンドをエイリアス化 -->

```bash
# package.jsonのscriptsセクション例
{
  "scripts": {
    "dev": "{{DEV_COMMAND}}",
    "build": "{{BUILD_COMMAND}}",
    "test": "{{TEST_COMMAND}}",
    "lint": "{{LINT_COMMAND}}",
    "format": "{{FORMAT_COMMAND}}"
  }
}
```

## アーキテクチャ

### システム構成図

<!-- TODO: システム全体のアーキテクチャを図示 -->

```
[フロントエンド] --> [バックエンド] --> [データベース]
       |                   |
       +---> [外部API]     |
                           |
                    [キャッシュレイヤー]
```

### レイヤー構成

<!-- TODO: 各レイヤーの責務を記載 -->

| レイヤー | 責務 |
|---------|------|
| プレゼンテーション | <!-- TODO: UI、ユーザーインタラクション --> |
| ビジネスロジック | <!-- TODO: 業務ルール、処理フロー --> |
| データアクセス | <!-- TODO: DB操作、キャッシュ --> |
| インフラ | <!-- TODO: 外部API、メッセージング --> |

### 主要ディレクトリ

<!-- TODO: 重要なディレクトリの説明 -->

- `src/` - ソースコード
  - `components/` - UIコンポーネント
  - `services/` - ビジネスロジック
  - `types/` - 型定義
  - `utils/` - ユーティリティ関数
- `tests/` - テストコード
- `docs/` - ドキュメント
- `.claude/` - Claude設定・スキル

## Git ワークフロー

### ブランチ戦略

ブランチ命名規則:

```
feature/機能名           - 新機能開発
bugfix/バグ名            - バグ修正
refactor/概要            - リファクタリング
chore/作業概要           - メンテナンス
docs/ドキュメント概要     - ドキュメント更新
```

### コミットメッセージ規則

```
<type>(<scope>): <subject>

<body>

<footer>
```

例：

```
feat(auth): ユーザー認証機能を追加

GoogleログインとGitHub認証に対応した。
セッション管理にJWTを採用。

Closes #123
```

**タイプ一覧**:

- `feat` - 新機能
- `fix` - バグ修正
- `refactor` - コード改善
- `perf` - パフォーマンス改善
- `test` - テスト追加
- `docs` - ドキュメント更新
- `chore` - ビルドツール、依存関係更新

### PR プロセス

1. ブランチを作成: `git checkout -b feature/機能名`
2. コミットしてプッシュ: `git push origin feature/機能名`
3. GitHubでPRを作成
4. コードレビュー・Ciチェック通過
5. `squash and merge` でマージ

## コーディング規則

### JavaScript / TypeScript

<!-- TODO: 言語固有の規則を記載 -->

#### 一般原則

- 日本語でコメント・ドキュメントを作成
- 英語でコード（変数名、関数名、クラス名）を記述
- 型安全性：TypeScript使用時は `any` を禁止
- エラーハンドリング：すべての非同期処理でエラーハンドリング

#### 命名規則

```typescript
// 定数: UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;

// 変数・関数: camelCase
const userName = 'John';
function calculateTotal() { }

// クラス・型: PascalCase
class UserService { }
interface IUserRepository { }
type UserRole = 'admin' | 'user';

// プライベートメソッド: _で開始
class User {
  private _id: string;
  private _validateEmail() { }
}
```

#### ファイル構成

```typescript
// 1. インポート
import { Component } from 'react';
import { service } from '../services';

// 2. 型定義
interface Props {
  id: string;
  onSubmit: (data: FormData) => Promise<void>;
}

// 3. コンポーネント/関数
export function MyComponent(props: Props) {
  // ...
}

// 4. エクスポート
export default MyComponent;
```

### テスト規則

<!-- TODO: テスト戦略、カバレッジ基準を定義 -->

```typescript
describe('UserService', () => {
  describe('findById', () => {
    it('should return user when user exists', async () => {
      // Arrange
      const userId = 'user-123';
      
      // Act
      const user = await userService.findById(userId);
      
      // Assert
      expect(user).toBeDefined();
      expect(user.id).toBe(userId);
    });

    it('should throw error when user not found', async () => {
      // Arrange
      const userId = 'nonexistent';
      
      // Act & Assert
      await expect(
        userService.findById(userId)
      ).rejects.toThrow('User not found');
    });
  });
});
```

**テストカバレッジ基準**:

- ロジック: 80%以上
- 新機能: 90%以上
- Critical パス: 100%

## ドキュメント

<!-- TODO: ドキュメント作成ルール、参照先を記載 -->

### API ドキュメント

OpenAPI/Swagger形式で記載:

```yaml
paths:
  /api/users/{id}:
    get:
      summary: ユーザー情報取得
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: ユーザー情報
```

### README

各ディレクトリに README.md を配置し、目的・使い方を記載

## デバッグ・トラブルシューティング

### ログ出力

<!-- TODO: ロギング方針、フォーマットを定義 -->

```typescript
// 開発環境
console.log('[INFO] ユーザー取得:', userId);
console.warn('[WARN] 警告メッセージ');
console.error('[ERROR] エラーメッセージ', error);

// 本番環境
logger.info('User retrieved', { userId });
logger.warn('Warning occurred', { context });
logger.error('Error occurred', { error, context });
```

### よくある問題

| 問題 | 解決策 |
|-----|------|
| <!-- TODO: 問題1 --> | <!-- TODO: 解決策1 --> |
| <!-- TODO: 問題2 --> | <!-- TODO: 解決策2 --> |

## パフォーマンス

<!-- TODO: パフォーマンス最適化ガイドラインを記載 -->

### フロントエンド最適化

- Code splitting: ルートごとに動的importを使用
- Image optimization: 適切なフォーマット・サイズを使用
- Bundle分析: `webpack-bundle-analyzer` で定期的に確認
- キャッシング: ブラウザ・CDLキャッシュ設定

### バックエンド最適化

- Query optimization: N+1問題を回避
- Indexing: 頻繁にフィルタリングされるカラムにインデックス
- Caching: Redis/Memcachedでホットデータをキャッシュ
- Rate limiting: 必要に応じてAPI呼び出し制限

## リソース・参考資料

- ドキュメント: {{DOCS_URL}}
- Figmaデザイン: {{FIGMA_URL}}
- チームWiki: {{WIKI_URL}}

## 関連スキル

- `/design-system` - 設計システム参照
- `/business-knowledge` - ドメイン知識参照
- `/codex-review` - コードレビュー

