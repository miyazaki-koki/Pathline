---
name: feature-design
description: 機能設計パターン集。画面設計、コンポーネント設計、データフロー、型定義パターンの標準テンプレート。
allowed-tools: Read, Glob, Grep
---

# 機能設計パターン

<!-- TODO: 機能設計の標準パターンをこのドキュメントで定義 -->

プロジェクト内で頻繁に出現する機能設計パターンを集約し、一貫性と開発効率を確保します。

## ディレクトリ構造テンプレート

<!-- TODO: プロジェクト固有のディレクトリ構成に調整 -->

```
features/
├── feature-name/
│   ├── components/
│   │   ├── FeatureList.tsx
│   │   ├── FeatureDetail.tsx
│   │   └── FeatureForm.tsx
│   ├── hooks/
│   │   ├── useFeatureList.ts
│   │   ├── useFeatureDetail.ts
│   │   └── useFeatureForm.ts
│   ├── services/
│   │   └── featureService.ts
│   ├── types/
│   │   └── feature.ts
│   ├── utils/
│   │   └── featureUtils.ts
│   ├── tests/
│   │   ├── feature.test.ts
│   │   └── FeatureList.test.tsx
│   ├── constants/
│   │   └── feature.constants.ts
│   └── index.ts
```

## 画面設計パターン

<!-- TODO: 各パターンをプロジェクトに合わせてカスタマイズ -->

### 1. リスト表示画面パターン

**目的**: データ一覧を表示し、検索・フィルタリング・ソートが可能

**ファイル構成**:

```
FeatureList.tsx
├── Header（検索・フィルタ入力）
├── Toolbar（表示オプション、アクション）
├── Table/Grid（データ表示）
└── Pagination（ページネーション）
```

**型定義**:

```typescript
// types/feature.ts
export interface Feature {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface ListQueryParams {
  page: number;
  pageSize: number;
  sortBy?: 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, unknown>;
}

export interface ListResponse {
  items: Feature[];
  total: number;
  page: number;
  pageSize: number;
}
```

**コンポーネント実装パターン**:

```typescript
// components/FeatureList.tsx
interface Props {
  onRowClick?: (feature: Feature) => void;
}

export function FeatureList({ onRowClick }: Props) {
  const [params, setParams] = useState<ListQueryParams>({
    page: 1,
    pageSize: 20,
  });

  const { data, isLoading, error } = useFeatureList(params);

  const handleSearch = (query: string) => {
    setParams(prev => ({
      ...prev,
      search: query,
      page: 1,
    }));
  };

  return (
    <div>
      <SearchBar onSearch={handleSearch} />
      {error && <ErrorMessage error={error} />}
      <Table items={data?.items ?? []} isLoading={isLoading} />
      <Pagination {...params} onChange={setParams} />
    </div>
  );
}
```

### 2. 詳細表示画面パターン

**目的**: 単一データの詳細情報を表示

**ファイル構成**:

```
FeatureDetail.tsx
├── Header（タイトル、アクション）
├── Tabs（セクション分け）
├── Content（詳細情報）
└── Footer（アクションボタン）
```

**型定義**:

```typescript
// types/feature.ts
export interface FeatureDetail extends Feature {
  description: string;
  tags: string[];
  owner: {
    id: string;
    name: string;
    email: string;
  };
  metadata: Record<string, unknown>;
}
```

**コンポーネント実装パターン**:

```typescript
// components/FeatureDetail.tsx
interface Props {
  id: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function FeatureDetail({ id, onEdit, onDelete }: Props) {
  const { data, isLoading, error } = useFeatureDetail(id);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return <NotFound />;

  return (
    <div>
      <DetailHeader item={data} onEdit={onEdit} onDelete={onDelete} />
      <DetailTabs data={data} />
      <DetailFooter item={data} />
    </div>
  );
}
```

### 3. フォーム入力画面パターン

**目的**: データの作成・編集を行う

**ファイル構成**:

```
FeatureForm.tsx
├── FormLayout（複数フィールド）
├── Sections（フィールドグループ）
├── Validation（バリデーション表示）
└── Actions（送信・キャンセル）
```

**型定義**:

```typescript
// types/feature.ts
export interface FeatureFormData {
  name: string;
  description: string;
  status: 'active' | 'inactive';
  tags: string[];
}

export interface FormValidationError {
  field: keyof FeatureFormData;
  message: string;
}
```

**コンポーネント実装パターン**:

```typescript
// components/FeatureForm.tsx
interface Props {
  initialData?: FeatureFormData;
  onSubmit: (data: FeatureFormData) => Promise<void>;
  onCancel: () => void;
}

export function FeatureForm({ initialData, onSubmit, onCancel }: Props) {
  const form = useForm<FeatureFormData>({
    defaultValues: initialData,
    resolver: zodResolver(featureFormSchema),
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await onSubmit(data);
    } catch (error) {
      form.setError('root', { message: '送信に失敗しました' });
    }
  });

  return (
    <form onSubmit={handleSubmit}>
      <FormField name="name" label="名前" />
      <FormField name="description" label="説明" />
      <FormActions onCancel={onCancel} />
    </form>
  );
}
```

## コンポーネント設計パターン

<!-- TODO: よく使用するコンポーネント設計パターンを記載 -->

### 制御コンポーネント vs 非制御コンポーネント

**制御コンポーネント** - 親が値を管理:

```typescript
interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function Input({ value, onChange }: Props) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
```

**非制御コンポーネント** - コンポーネント自体が値を管理:

```typescript
export function Input() {
  const ref = useRef<HTMLInputElement>(null);

  const getValue = () => ref.current?.value;

  return <input ref={ref} />;
}
```

### コンポーネント分割規則

- **50行以上** → 分割を検討
- **複数の責務** → 責務ごとに分割
- **再利用可能** → 専用コンポーネント化

## データフローパターン

<!-- TODO: アプリケーションのデータ管理方針を定義 -->

### フェッチ & キャッシング

```typescript
// hooks/useFeatureList.ts
export function useFeatureList(params: ListQueryParams) {
  const queryKey = ['features', params];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => featureService.list(params),
    staleTime: 5 * 60 * 1000, // 5分
  });

  return { data, isLoading, error };
}
```

### フォーム状態管理

```typescript
// hooks/useFeatureForm.ts
export function useFeatureForm(onSubmit: (data: FeatureFormData) => Promise<void>) {
  const [errors, setErrors] = useState<FormValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (data: FeatureFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } catch (error) {
      setErrors([{ field: 'root', message: error.message }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submit, errors, isSubmitting };
}
```

### エラーハンドリング

```typescript
// utils/errorHandler.ts
export function handleError(error: unknown): ErrorContext {
  if (error instanceof ValidationError) {
    return {
      type: 'validation',
      message: error.message,
      fields: error.fields,
    };
  }

  if (error instanceof ApiError) {
    return {
      type: 'api',
      message: error.message,
      statusCode: error.statusCode,
    };
  }

  return {
    type: 'unknown',
    message: 'エラーが発生しました',
  };
}
```

## 型定義パターン

<!-- TODO: 型安全性を確保するための型定義パターンを記載 -->

### API レスポンス型

```typescript
// types/api.ts
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

### エラー型

```typescript
// types/error.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends Error {
  constructor(
    public fields: Record<string, string>,
  ) {
    super('Validation failed');
    this.name = 'ValidationError';
  }
}
```

### 条件付き型

```typescript
// types/conditions.ts
export type ValueOf<T> = T[keyof T];

export type ReadOnly<T> = {
  readonly [K in keyof T]: T[K];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
```

## テストパターン

<!-- TODO: テストケースの標準パターンを記載 -->

### ユニットテスト

```typescript
// tests/feature.test.ts
describe('featureService', () => {
  describe('validate', () => {
    it('should pass validation for valid data', () => {
      const data: FeatureFormData = {
        name: 'Test Feature',
        description: 'Description',
        status: 'active',
        tags: [],
      };

      expect(() => featureService.validate(data)).not.toThrow();
    });

    it('should throw error for empty name', () => {
      const data = { ...validData, name: '' };

      expect(() => featureService.validate(data)).toThrow();
    });
  });
});
```

### コンポーネントテスト

```typescript
// tests/FeatureList.test.tsx
describe('FeatureList', () => {
  it('should display items', async () => {
    const { getByText } = render(<FeatureList />);

    await waitFor(() => {
      expect(getByText('Feature 1')).toBeInTheDocument();
    });
  });

  it('should call onRowClick when row is clicked', async () => {
    const onRowClick = vi.fn();
    const { getByText } = render(<FeatureList onRowClick={onRowClick} />);

    await waitFor(() => {
      const row = getByText('Feature 1');
      fireEvent.click(row);
      expect(onRowClick).toHaveBeenCalled();
    });
  });
});
```

## セキュリティパターン

<!-- TODO: セキュリティベストプラクティスを記載 -->

### 入力バリデーション

```typescript
import { z } from 'zod';

const featureFormSchema = z.object({
  name: z.string().min(1, '名前は必須です').max(100),
  description: z.string().max(1000),
  tags: z.array(z.string()).max(10),
});
```

### 認証・認可

```typescript
// utils/auth.ts
export function requireAuth(handler: Handler): Handler {
  return async (req, res) => {
    const user = await getCurrentUser(req);
    if (!user) {
      throw new UnauthorizedError();
    }
    return handler(req, res, user);
  };
}
```

## 関連スキル

- `/design-system` - UI設計システム
- `/development-guide` - 開発ガイド全般
- `/business-knowledge` - ドメイン知識

