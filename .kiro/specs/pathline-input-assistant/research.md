# Research & Design Decisions — pathline-input-assistant

## Summary
- **Feature**: `pathline-input-assistant`
- **Discovery Scope**: New Feature (Greenfield, ただし境界が閉じた拡張機能のため Light Discovery で実施)
- **Key Findings**:
  - Chrome Extension Manifest V3 の Content Script のみで完結する構成が最適。背景処理 (Service Worker) は MVP 範囲では不要。
  - `textarea` と `contenteditable` で値取得/書込 API が異なるため、Input Adapter 層でインターフェースを統一する必要がある。
  - ゴースト表示は `textarea` には overlay 方式、`contenteditable` には inline span 方式が現実的。DOM 置換ではなく "表示専用レイヤー" を採用することで副作用を抑える。

## Research Log

### Chrome Extension Manifest V3 の制約
- **Context**: MV3 準拠の要件 (7.4)、外部通信禁止 (7.1) のもとで構成を決める。
- **Sources Consulted**: chrome.com/docs/extensions/develop/migrate (一般知識), MV3 Content Script / Service Worker モデル。
- **Findings**:
  - Content Script は各タブに独立注入され、DOM アクセスが可能。`matches: ["<all_urls>"]` で汎用動作を実現できる。
  - MVP では Service Worker (Background) は不要。設定値は `chrome.storage.local` を同期的ラッパ経由で利用。
  - `host_permissions` は `<all_urls>` を設定するが、入力内容は外部送信しない旨を `privacy_policy` に明記予定。
- **Implications**: 単一の Content Script バンドル構成で済む。パーミッション最小化のため `permissions` は `storage` のみ。

### textarea / contenteditable の差異
- **Context**: 対象入力欄検出 (1.1) と候補反映 (6.1) を統一 API で扱いたい。
- **Findings**:
  - `textarea.value` は文字列。`selectionStart/End` でキャレット制御可能。`input` イベントで値変更を検知。
  - `contenteditable` は `element.innerText` / `textContent` で内容取得、`Selection`/`Range` でキャレット制御。`input` / `compositionend` / MutationObserver の併用で変更を検知。
  - パスワード欄は `input[type=password]`。`contenteditable` 側で機微フラグはないため、明示的除外ルール (data 属性など) を用意。
- **Implications**: `InputTarget` を抽象化するアダプタを定義し、スコアリング層以降は文字列 API に統一。

### ゴースト表示の DOM 戦略
- **Context**: 既存ページへの侵襲を最小化しつつ 100ms 体感で描画 (5.5)。
- **Findings**:
  - `textarea` 上のインライン着色は不可能なため、`position: absolute` で textarea と同スタイルを複製した overlay を重ね、未入力部分に候補文を薄色表示するのが定石。
  - `contenteditable` では末尾に `span.pathline-ghost[contenteditable=false]` を挿入。`user-select:none` と caret 非侵襲を保証。
  - Shadow DOM 採用はスタイル衝突対策としては有効だが、テキスト計測 (overlay 方式) では host スタイル継承が必要なため MVP では通常 DOM + 高 specificity CSS で対応。
- **Implications**: Renderer は戦略パターンで `TextareaOverlayRenderer` / `ContentEditableInlineRenderer` の 2 実装を持たせる。

### スコアリング/安定化アルゴリズム設計
- **Context**: 要件 2/3 を満たす決定論的で O(n) なロジックが必要。
- **Findings**:
  - 5 カテゴリ × 11 ルールは正規表現と文字列一致の和で計算可能。120ms debounce で 1 タイプあたり 1 回評価。
  - カテゴリ安定化は「スコア差 >= 2 または 2 連続優勢」。明示キーワードは bypass。実装上は状態マシンで `currentTop`, `challengerCount` を保持。
  - 入力差分が前回と <= 1 文字なら再評価スキップ (7.3) — ただし改行/記号追加など構造変化トリガは強制評価。
- **Implications**: Scoring Engine は純関数 `score(text): ScoreVector`。State Machine が履歴 (直近 N 件のスコアと currentTop) を持つ。

### パフォーマンス目標 100ms
- **Context**: 体感遅延 100ms (5.5)。debounce 120–200ms を前提。
- **Findings**:
  - debounce が 150ms 固定だと「停止してから 150ms 後に描画」となり目標と矛盾しうる → 要件は "debounce 後の処理自体は同期で速い" を意味すると解釈。描画 (score → template → render) 自体は < 20ms を目標とする。
  - 同一候補の再描画抑止 (5.3) でレイアウトスラッシュを防ぐ。
- **Implications**: パフォーマンス予算を debounce 150ms + 処理 20ms 以内と定義し、計測フックを埋め込む。

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| Single Content Script (選定) | Content Script 内に全モジュールを積み、DI で結線 | シンプル、MV3 準拠、外部通信ゼロ | 複数タブで状態共有できない (MVP では不要) | 採用 |
| Content Script + Service Worker | 判定処理を SW に逃がす | SW で共有キャッシュ可能 | 同期経路が増えレイテンシ悪化、MV3 SW は揮発 | 却下 |
| Shadow DOM 隔離 | Renderer を Shadow DOM 内に閉じ込める | スタイル衝突完全回避 | textarea overlay で host フォント計測不可 | 部分採用せず |

## Design Decisions

### Decision: レイヤード疎結合アーキテクチャの採用
- **Context**: 要件 8 (拡張性) — Scoring Engine と State Machine を疎結合、カテゴリ/テンプレ差し替え可能。
- **Alternatives Considered**:
  1. 単一クラスで全処理 — 素早いが将来の AI 候補生成差し替えが困難。
  2. レイヤード疎結合 (DOM / Scoring / State / Template / Renderer / Keyboard) — 責務明確。
- **Selected Approach**: 6 レイヤーの疎結合モジュール + `CandidateProvider` インターフェース抽象化 (将来の非同期 AI 候補差し替えに対応)。
- **Rationale**: Phase 3 でルールベース候補と AI 生成候補の二層構造を無改造で導入できる。
- **Trade-offs**: コード量が増えるが MVP 範囲でも可読性と単体テスト容易性で回収できる。
- **Follow-up**: `CandidateProvider` が同期/非同期両対応できる API 形を確定する。

### Decision: カテゴリ/テンプレの外部データ化
- **Context**: 8.2 テンプレ差し替え可能。
- **Selected Approach**: `categories.ts` に静的 readonly オブジェクトとして定義、Template Generator がこれを読み込む。ビルド時差し替え可。
- **Rationale**: MVP では動的ロード不要。将来 `chrome.storage` からの上書きに拡張容易。
- **Trade-offs**: 実行時編集は不可 (Phase 2 で追加)。

### Decision: Ghost Renderer の 2 戦略実装
- **Context**: textarea と contenteditable の実装差異。
- **Selected Approach**: `GhostRenderer` 共通インターフェース + Strategy 2 種 (`TextareaOverlayRenderer`, `ContentEditableInlineRenderer`).
- **Trade-offs**: 2 系統のスタイル同期ロジックが必要。CSS の specificity と `!important` の併用で host 干渉を最小化。

## Risks & Mitigations
- **R1: ゴースト overlay が host の CSS により位置ズレ** — textarea の `getComputedStyle` を毎フォーカス時に複製、`resize`/`scroll` イベントで追従。
- **R2: スコアルール不安定でカテゴリ頻繁切替** — 安定化ルール + 明示キーワード bypass を厳密に単体テスト。
- **R3: MV3 ポリシー変更** — `manifest.json` を最小構成に保ち、`host_permissions` を `<all_urls>` のみに。
- **R4: キーイベントが既存ページの Tab/Esc ハンドラと衝突** — 候補表示中のみ `preventDefault` + `stopImmediatePropagation`。非表示時は完全にパススルー (6.5)。

## References
- Chrome Developers: Manifest V3 overview (公式) — 採用バージョンと制約の根拠
- MDN: `contenteditable`, `Selection`, `Range` — DOM 操作の正準仕様
- MDN: `textarea` の selection API — キャレット制御
