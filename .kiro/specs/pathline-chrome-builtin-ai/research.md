# Research & Design Decisions — pathline-chrome-builtin-ai

## Summary
- **Feature**: `pathline-chrome-builtin-ai`
- **Discovery Scope**: Extension (Phase 2 の `CandidateProvider` パイプラインへの非同期 LLM 実装追加)
- **Key Findings**:
  - Chrome Built-in AI の現行 API は `LanguageModel` グローバル (当初予定した `window.ai` 名ではない)。`availability()` の戻り値は `"readily" | "after-download" | "downloading" | "unavailable"`
  - **サポート言語は en / ja / es** が現状の公式リスト。要件で予定していた中国語 (zh) は現時点で Chrome Built-in AI の対応言語に含まれない → ja 既定 + モデルに「入力言語に追従する」旨を指示する方式で多言語要件 (6.4) を満たす
  - `LanguageModel.create({ signal })` と `session.prompt(input, { signal })` の双方で `AbortSignal` が受理できるため、タイムアウト (要件 3.1) と再入力時中断 (要件 3.3) は標準の AbortController で実装可能
  - `initialPrompts` に system ロールを置くことでカテゴリ別 system prompt が一度のセッション作成で固定できる。`session.clone()` でコンテキスト初期化のコストを抑えられる

## Research Log

### Chrome Built-in AI (Prompt API / LanguageModel) の API 仕様
- **Context**: 要件 1 (可用性判定) と要件 2 (非同期生成) の実装前提を確定
- **Sources Consulted**: Chrome Developers 公式ドキュメント "Prompt API"
- **Findings**:
  - グローバル名: `LanguageModel` (例: `LanguageModel.availability()`, `LanguageModel.create()`)
  - `availability(options)` の戻り値:
    - `"readily"` = 即利用可能
    - `"after-download"` = モデル DL 後に利用可
    - `"downloading"` = DL 進行中
    - `"unavailable"` = 利用不可 (ハードウェア要件未満等)
  - セッション生成: `LanguageModel.create({ initialPrompts, expectedInputs, expectedOutputs, temperature, topK, signal })`
    - `temperature` / `topK` は Extensions コンテキストのみで受理される (本拡張は MV3 Content Script なので利用可能)
    - `initialPrompts` に `[{ role: "system", content: "..." }]` を置くと system prompt 固定化
    - `expectedInputs` / `expectedOutputs`: `[{ type: "text", languages: ["ja" | "en" | "es"] }]`
  - プロンプト実行: `session.prompt(input, { signal })` / `session.promptStreaming(input, { signal })`
  - セッション管理: `session.destroy()` で破棄、`session.clone()` で複製、`session.contextUsage` で使用量確認
  - メッセージ形式: `{ role: "system" | "user" | "assistant", content: string }` の配列
- **Implications**:
  - Phase 3a では streaming なしで `prompt()` を使用 (MVP では簡易化)。差替えタイミングは 1 回の完了で十分
  - セッションは **カテゴリ別に 1 つ** を事前生成してキャッシュし、`session.clone()` を使って都度新しいコンテキストに分岐 (要件 5.3)
  - 将来の streaming 対応は `promptStreaming` に差し替えるだけで済む構造にする

### 対応言語の現状
- **Context**: 要件 6 (多言語対応) — 日本語/英語/中国語
- **Findings**:
  - 現在の公式サポートは `en`, `ja`, `es`
  - `zh` は現時点未サポート。`expectedInputs` に `"zh"` を渡すと `availability()` で `unavailable` になる可能性が高い
- **Implications**:
  - 中国語入力でも "入力言語に追従した出力" を system prompt で指示する形で疑似対応 (品質は en/ja より落ちる可能性あり)
  - `expectedInputs.languages` は `["en", "ja"]` を既定セットとし、zh 入力はフォールバックで `ja` 既定セッションを利用 + system prompt で "respond in input's language" 指示
  - 要件 6.3 (中国語入力で中国語向けプロンプト) は厳密な「専用プロンプト」ではなく「中国語を含む混在入力に対応するプロンプト」と解釈

### AbortSignal とタイムアウト
- **Context**: 要件 3 (タイムアウト / キャンセル)
- **Findings**:
  - `LanguageModel.create({ signal })` : セッション作成自体も中断可能
  - `session.prompt(input, { signal })` : 生成中の推論を中断可能
  - `AbortSignal.timeout(2000)` で 2 秒タイムアウト用の signal を簡潔に作成可能
  - 複数の signal を束ねるには `AbortSignal.any([timeoutSignal, userAbortSignal])` (Modern browsers 対応済)
- **Implications**:
  - `AbortController` をリクエストごとに生成し、セッションの `prompt()` と外部 (再入力 / blur / Esc) の両方から abort() 呼び出し可能
  - タイムアウトは `AbortSignal.timeout(2000)` をそのまま利用
  - signal 合成は `AbortSignal.any()` で

### 既存 CandidateProvider との統合パス
- **Context**: 要件 4 (2 層差替え) と要件 8 (後方互換)
- **Sources Consulted**: `src/core/candidate.ts`, `src/controller/controller.ts` の provide 結果分岐
- **Findings**:
  - 既存 `CandidateProvider.provide()` は `Candidate | Promise<Candidate>` 型。Controller は `instanceof Promise` で分岐
  - 現行 Controller では **Promise 戻り値は実は使われていない** (ルールベース同期のみ)。Promise 経路を実装する必要がある
- **Implications**:
  - 新コンポジット `TwoLayerCandidateProvider` を作り、`provide()` で同期 Candidate を返しつつ **追加 API `provideAsync()` で Promise を返す** 形で Controller に 2 段階通知
  - もしくは、既存 `provide()` が Promise を返した場合に Controller が追従 render する実装を追加 (既存コード改修あり)
  - **採用**: 後者。Controller に「同期 Candidate を即 render → Promise で後続 render」のパスを明示実装。TwoLayerProvider は `provide()` で `PromiseWithSync<Candidate>` のような拡張型を返す

### 前置き語除去のヒューリスティック
- **Context**: 要件 2.7
- **Findings**:
  - LLM は依頼文生成時に「以下が改善案です:」「こちらは要約です:」等の前置きを返しがち
  - 日本語/英語の代表パターンを正規表現で除去可能
  - 完全除去は困難なので、1 回の検出試行で無理なら原文のまま返す
- **Implications**: シンプルな正規表現セットで 80% カバーを目指す。完璧主義に走らない

### セキュリティ・プライバシー
- **Context**: 要件 5 (プライバシー)
- **Findings**:
  - Chrome Built-in AI は完全にデバイス内で推論。ネットワーク送信なし (Google 公式)
  - 既存 `permissions: ["storage"]` のみで利用可能、追加パーミッション不要
- **Implications**: 要件 5.1 / 5.5 は API 自体の特性で自然達成

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| TwoLayer Provider (選定) | ルールベース同期 + LLM 非同期を同一 Provider に内包 | 既存 Controller の小改修で対応可、2 層差替えが明示的 | Controller がやや複雑化 | 採用 |
| 独立 LLM Provider + Controller 直結 | ルールと LLM を別々の Provider として Controller が両方呼ぶ | 責務分離明確 | Controller の変更範囲が大きい | 却下 |
| Worker/Service Worker 経由 | LLM 推論を別 worker で実行 | UI スレッド保護 | Content Script と Worker のメッセージング追加で複雑度増 | Phase 3b 以降に検討 |
| Streaming 対応 | `promptStreaming` で段階的更新 | 体感速度向上 | 実装量増、MVP では不要 | Phase 3a では保留 |

## Design Decisions

### Decision: TwoLayer Composite Provider + Controller の軽微改修
- **Context**: 要件 4 (2 層差替え) と要件 8 (後方互換)
- **Selected Approach**:
  - 新規 `LanguageModelProvider` (LLM 単独の非同期プロバイダ) を作る
  - 新規 `TwoLayerCandidateProvider` が内部でルールベース (`FlexibleCandidateProvider`) と `LanguageModelProvider` を保持
  - `provide()` は `{ immediate: Candidate, pending: Promise<Candidate | null> }` のペア型を返す
  - Controller の `evaluate()` で `immediate` を即 render、`pending` の resolve 後に hash が異なれば差替え render
- **Rationale**: 既存 `CandidateProvider` インターフェースを拡張せず、新しいコンポジット型を導入することで型安全に 2 層を表現
- **Trade-offs**: Controller の state に `pendingRequestId` を持つ必要あり (新しい input が来たら旧 pending を捨てる)
- **Follow-up**: Controller テストで旧 pending 無視の挙動を検証

### Decision: セッション管理 — カテゴリ別プールと clone()
- **Context**: 要件 5.3 (セッション再利用によるコスト抑制)
- **Selected Approach**: `LanguageModelProvider` 起動時に 5 カテゴリ分のベースセッションを lazy 生成 (最初に使うカテゴリの分だけ)。都度は `base.clone()` で短命な派生セッションを作り使い捨て。派生は `destroy()` で明示解放
- **Rationale**: system prompt の初期化コストを amortize しつつ、会話履歴で汚れない短命派生でプロンプト実行
- **Trade-offs**: `clone()` 自体に多少のコストあり。代替案として毎回 `create()` も検討したが、初期化コストの方が高い

### Decision: 多言語 — expectedInputs に en + ja を指定、システムプロンプトで入力言語追従
- **Context**: 要件 6 (多言語)
- **Selected Approach**:
  - `LanguageModel.availability({ expectedInputs: [{ type: "text", languages: ["en", "ja"] }], expectedOutputs: [{ type: "text", languages: ["en", "ja"] }] })` で可用性判定
  - system prompt に "Respond in the same language as the user's input." を含める
  - 日本語/英語は自動的に対応。中国語/その他言語は品質は保証できないが動作はする (モデル次第)
- **Rationale**: zh は現状サポート外のため、現実的に動く en/ja を宣言しつつプロンプトで追従を促す
- **Trade-offs**: zh 入力時の品質が不安定になる可能性 → ルールベースの方が良ければフォールバック (要件 6.5)

### Decision: タイムアウトは AbortSignal.timeout(2000) + ユーザー中断の signal を AbortSignal.any で合成
- **Context**: 要件 3
- **Selected Approach**: `AbortController` を発行、`AbortSignal.any([timeoutSignal, controller.signal])` で合成した signal を `prompt()` に渡す
- **Trade-offs**: `AbortSignal.any` は新しい API。対象 Chrome 138+ では標準サポート済なので問題なし

### Decision: 前置き語除去は正規表現ベースの 1-pass
- **Context**: 要件 2.7
- **Selected Approach**: 出力先頭の「以下(が|は)(改善|要約|整理|レビュー)(案|結果)?(です|:|：)?(\s|$)」「Here (is|are) ...」等の代表パターンを除去。マッチなしなら原文のまま
- **Trade-offs**: 完全除去はできないが 80% カバー。残りは UX 上許容

### Decision: 言語ミスマッチ検知 — 簡易ヒューリスティックで日本語入力に英語応答のみ検知
- **Context**: 要件 6.5
- **Selected Approach**: 入力が ja (日本語文字含む) かつ応答に日本語文字が 0 の場合のみフォールバック発動。それ以外 (en 入力 / 混在入力) は採用
- **Trade-offs**: 厳密ではないが、最も目立つ誤動作ケースを防げる

## Risks & Mitigations
- **R1: Chrome Built-in AI の API が変更される** — `LanguageModel` グローバルと availability 値を型定義で集約し、将来の変更時に 1 箇所の修正で済ませる。TypeScript の型ガードで runtime 不一致を検知
- **R2: モデル DL 未完了 / downloading 状態で長時間待たせる** — Phase 3a 範囲では DL をユーザー側で任せる (要件 2.3 で明示)。downloadable/downloading 時は LLM 経路を使わない
- **R3: LLM 応答が `---` 区切りを無視 / 入力テキストを省略** — system prompt で明示指示 + 出力に `---` ない場合は自動補完 (要件 2.6)
- **R4: 多数セッションのメモリリーク** — `destroy()` を session clone 使用後に必ず呼ぶ。Controller の dispose 時にもベースセッションを `destroy()`
- **R5: `AbortSignal.any` 非対応環境** — Chrome 138+ 前提のため問題なし。ただし polyfill 代替として手動合成ユーティリティを用意

## References
- Chrome Developers: "Prompt API" 公式ドキュメント (https://developer.chrome.com/docs/ai/prompt-api)
- 既存 Phase 2 実装: `src/core/flexibleProvider.ts`, `src/controller/controller.ts`
- Phase 1/2 設計: `.kiro/specs/pathline-input-assistant/design.md`, `.kiro/specs/pathline-flexible-recommendation/design.md`
