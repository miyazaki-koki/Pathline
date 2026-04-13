# Tasks: Example Feature - ユーザープロフィール表示

## Task 1: UserProfile型定義

Requirement: 1.1

データモデル（UserProfile型）の定義とバリデーション。

### Task 1.1: 型定義とバリデーションスキーマ

ユーザープロフィール型を定義し、Zodスキーマでバリデーションを実装。

**TDD Test Scenarios**:
- ✓ Valid profile passes validation
- ✓ Invalid email is rejected
- ✓ Missing required fields are rejected
- ✓ Optional avatar URL is handled correctly

**Implementation**:
```typescript
// src/models/user.ts
// - Define UserProfile interface
// - Create userProfileSchema with Zod
// - Export type and schema
```

**Files to Create/Modify**:
- `src/models/user.ts` (create)
- `src/models/__tests__/user.test.ts` (create)

---

## Task 2: ProfileCardコンポーネント

Requirements: 1.1, 1.2

ユーザープロフィール情報を表示するコンポーネント。

### Task 2.1: プロフィール情報表示

名前、メール、アバター画像を表示。

**TDD Test Scenarios**:
- ✓ Renders user name correctly
- ✓ Renders user email correctly
- ✓ Displays avatar image when URL is provided

**Implementation**:
```typescript
// src/components/ProfileCard.tsx
// - Accept UserProfile props
// - Render name, email, avatar
// - Add edit button
```

**Files to Create/Modify**:
- `src/components/ProfileCard.tsx` (create)
- `src/components/__tests__/ProfileCard.test.tsx` (create)

### Task 2.2: アバターフォールバック

アバター画像の読み込み失敗時にプレースホルダーを表示。

**TDD Test Scenarios**:
- ✓ Shows placeholder when avatar URL is missing
- ✓ Shows placeholder when avatar fails to load
- ✓ Displays loaded avatar image correctly

**Implementation**:
```typescript
// src/components/ProfileCard.tsx (update)
// - Handle image onError event
// - Implement placeholder display logic
// - Add error boundary if needed
```

**Files to Create/Modify**:
- `src/components/ProfileCard.tsx` (update)
- `src/components/__tests__/ProfileCard.test.tsx` (update)

---

## Task 3: ProfileEditFormコンポーネント

Requirements: 2.1, 2.2, 2.3

プロフィール編集フォーム実装。

### Task 3.1: 編集フォームUI

フォーム入力フィールドと送信ボタン。

**TDD Test Scenarios**:
- ✓ Form renders with pre-filled user data
- ✓ Form fields are correctly populated
- ✓ Edit button enables form mode
- ✓ Cancel button returns to view mode

**Implementation**:
```typescript
// src/components/ProfileEditForm.tsx
// - Create form with input fields
// - Pre-fill with current user data
// - Add submit and cancel buttons
```

**Files to Create/Modify**:
- `src/components/ProfileEditForm.tsx` (create)
- `src/components/__tests__/ProfileEditForm.test.tsx` (create)

### Task 3.2: バリデーションと保存

フォームバリデーション、エラー表示、データ保存。

**TDD Test Scenarios**:
- ✓ Shows validation errors for invalid input
- ✓ Preserves user input when validation fails
- ✓ Submits valid data to API
- ✓ Shows success message after save
- ✓ Handles server validation errors gracefully

**Implementation**:
```typescript
// src/components/ProfileEditForm.tsx (update)
// - Implement form validation using schema
// - Handle submission logic
// - Display validation errors
// - Show success/error toasts
// - Clear errors on input change
```

**Files to Create/Modify**:
- `src/components/ProfileEditForm.tsx` (update)
- `src/components/__tests__/ProfileEditForm.test.tsx` (update)
- `src/lib/api.ts` (create, if needed)

---

## Summary

All tasks map to specific requirements and follow TDD (Test-Driven Development) approach.
Each task includes clear acceptance criteria and test scenarios to ensure spec compliance.
