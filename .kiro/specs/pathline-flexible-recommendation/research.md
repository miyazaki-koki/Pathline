# Research & Design Decisions — pathline-flexible-recommendation

## Summary
- **Feature**: `pathline-flexible-recommendation`
- **Discovery Scope**: Extension (Phase 1 で構築済みの `CandidateProvider` ポートに新実装を差し込む)
- **Key Findings**:
  - 既存 `CandidateProvider` が同期/非同期両対応の戻り値型 (`Candidate | Promise<Candidate>`) を持つため、新コンポーザの差し替えは API 互換のまま実装できる
  - 5 部品 (前置き / 焦点指定 / 制約 / 出力形式 / 締め) のテーブル駆動で「テンプレ感」を弱めつつ決定論性を維持できる。形態素解析は不要、文字列パターンと小規模辞書で 10ms 以内に収まる
  - 既存 `Candidate.hash` を再描画抑止キーに使っているため、安定化要件 (3.2) は同一入力 + 同一カテゴリ + 同一特徴量で同じ body を返す純関数性で自然に満たせる

## Research Log

### 既存 Candidate Provider の差し替え可能性
- **Context**: 既存パイプラインへの非破壊導入 (要件 5.1, 5.2)
- **Sources Consulted**: `src/core/candidate.ts`, `src/controller/controller.ts` の commit / cycle ハンドラ
- **Findings**:
  - `CandidateProvider.provide(req)` は `Candidate | Promise<Candidate>` を返す。Controller は `instanceof Promise` で分岐。
  - `Candidate.hash` は `body` から決定論的に算出 (FNV-1a)。GhostRenderer の dirty check はこの hash のみに依存。
  - Controller は `Candidate.body` をそのまま `setText` する (commit 時)。category 表示はヘッダーで利用。
- **Implications**: 新実装 `FlexibleCandidateProvider` を `RuleBasedCandidateProvider` と並列に置き、Controller の DI で差し替えるだけで完了。

### 入力特徴抽出のスコープ
- **Context**: 要件 1 (特徴抽出) を 5ms 以内で実現
- **Findings**:
  - 形態素解析 (kuromoji 等) は ~500KB の辞書ロードが必要で MV3 Content Script のサイズ制約 (要件 4.5: +3KB 以内) と相反。除外。
  - 文字列パターン + 小規模日本語辞書 (~30 語) で対象種別 / トーン / 出力形式 / 長さ制約は 90% カバー可能 (経験則ベース)。
  - 焦点候補語は正規表現で「英数字 + 記号」「カタカナ連続」「鍵括弧」を抽出 → 上位 3 件。
- **Implications**: 純粋な文字列処理で実装。辞書は型安全な readonly 配列に集約 (要件 6.1)。

### 部品組み立てのアルゴリズム
- **Context**: 要件 2 (動的組み立て) と要件 3 (安定化)
- **Findings**:
  - 各カテゴリに対し 5 部品の候補集合を持ち、特徴量に応じて 0..1 件を選択。null は無視して連結。
  - 部品順は固定 (前置き → 焦点 → 制約 → 出力形式 → 締め)。順序固定が要件 3.1 を直接実現。
  - 同一 (category, text, features) → 同一文。features は category と独立に算出されるため、category が変わらず features も変わらなければ body 同一 → hash 同一 → 再描画なし (要件 3.2)。
- **Implications**: Composer は純関数 `compose(category, text, features) -> body`。features は値オブジェクトで `===` 比較不要、構造的に決定論。

### Phase 3 (AI 候補) との層分離
- **Context**: 要件 6.3
- **Findings**:
  - `CandidateProvider` は既に `Promise<Candidate>` 戻り値対応。AI 実装はこの非同期パスを使う。
  - Phase 2 のルールベース実装は同期で即時候補を返し、後続の AI 候補で hash が変わったら GhostRenderer が差し替える流れになる (Controller 側で futureWork)。
- **Implications**: 本フェーズは同期実装に集中。Composer は将来の "ヒント生成器 (features → 部品候補)" として AI 実装でも再利用できる構造にする。

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| Table-driven Composition (選定) | 部品候補テーブル + 特徴量による選択関数 | 決定論・テスト容易・サイズ小・差し替え可能 | 表現の自由度は中程度 | Phase 2 範囲の品質目標に十分 |
| Template DSL | 簡易 DSL を解釈して文を生成 | 柔軟性高 | パーサ実装でサイズ増、デバッグ困難 | 却下 |
| 形態素解析ベース | kuromoji 等で品詞解析後に抽出 | 抽出精度高 | 辞書サイズ +500KB で要件 4.5 違反 | 却下 |
| 単一巨大関数 | switch 文で生成 | 速い | 拡張不可、要件 6.1/6.2 違反 | 却下 |

## Design Decisions

### Decision: テーブル駆動 + 純関数で Composer を実装
- **Context**: 要件 2 (動的組み立て) と要件 3 (決定論) を両立しつつ、要件 4 (10ms 以内) と要件 6 (拡張性) を満たす。
- **Alternatives Considered**:
  1. 形態素解析ベース — 辞書サイズ NG
  2. 単一巨大関数 — 拡張性 NG
- **Selected Approach**: カテゴリ × 部品スロット の 2 次元テーブル `Record<CategoryId, Record<SlotId, PartCandidate[]>>` から、特徴量に基づき 0..1 件選択して連結。
- **Rationale**: バンドル増分は数 KB に抑えられ、ロジックは純関数で単体テストしやすい。テーブル追加で容易に表現拡張可能。
- **Trade-offs**: 部品数の組合せ爆発リスクはあるが、MVP では各スロット 3〜5 候補に留めることで管理可能。

### Decision: Feature Extractor をポート化
- **Context**: 要件 6.4 (拡張性)
- **Selected Approach**: `FeatureExtractor` インターフェースを定義し、MVP 実装 `RuleBasedFeatureExtractor` を差し替え可能に。
- **Trade-offs**: 抽象化のオーバーヘッドはあるが、Phase 3 で AI ベース抽出器に差し替える際の改修範囲を最小化できる。

### Decision: クラシックモードは設定スイッチで切替
- **Context**: 要件 5.3
- **Selected Approach**: `chrome.storage.local` から `mode: "classic" | "flexible"` を読む。MVP では `flexible` をデフォルト、`classic` 選択時は既存 `RuleBasedCandidateProvider` を使う。
- **Trade-offs**: 設定 UI は本フェーズ非実装 (デフォルト flexible で出荷、storage 直編集で切替可)。

### Decision: hash は body 文字列から FNV-1a で算出 (既存踏襲)
- **Context**: 既存 GhostRenderer の dirty check と互換
- **Rationale**: 同じ body なら同じ hash → 再描画なし。安定化要件 (3.2) を自然に満たす。

## Risks & Mitigations
- **R1: 部品の組合せで不自然な文 (例: 前置き + 焦点で重複した名詞)** — テストフィクスチャに代表入力を 30 件用意し、回帰検査。
- **R2: 焦点候補語が個人情報の可能性** — 抽出は表示用ではなく文面組込のみ、外部送信なしなのでプライバシー影響は限定的。ただし長さ上限 (1 語 16 文字) を設けて極端な貼付を抑制。
- **R3: 辞書語の偏り (日本語のみ想定)** — 英文入力時はフォールバックでカテゴリ既定文を返す (要件 2.11)。Phase 3 で多言語対応。
- **R4: features が頻繁にトグル** — 安定化のため、特徴抽出にもしきい値 (例: トーン語 2 件以上で `formal` 確定) を設ける。

## References
- Phase 1 設計: `.kiro/specs/pathline-input-assistant/design.md`
- 既存実装: `src/core/candidate.ts`, `src/core/template.ts`, `src/core/categories.ts`, `src/controller/controller.ts`
