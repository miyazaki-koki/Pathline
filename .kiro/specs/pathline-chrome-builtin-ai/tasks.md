## Implementation Plan — Pathline Chrome Built-in AI (Phase 3a)

> Phase 3a: Chrome Built-in AI を用いた非同期 LLM 候補生成を Phase 2 の上に 2 層差替え構造で載せる。`(P)` マーカーは同一 Major タスク配下で並行可能な純関数 / 独立モジュール。要件 ID は `requirements.md` の `N.M` 形式。

---

- [ ] 1. LLM 可用性判定レイヤーの整備
- [ ] 1.1 可用性ステータス型と定数の定義
  - `readily` / `after-download` / `downloading` / `unavailable` の列挙と既定値を 1 箇所に集約
  - `CapabilityOptions` の inputLanguages / outputLanguages 既定 (ja, en)
  - **Test scenarios**:
    - ✓ 既定値が `unavailable` ではなく `null` (未判定状態) で初期化される
    - ✓ 未知の値はコンパイルエラーになる (型テスト)
  - _Requirements: 1.1, 1.5_

- [ ] 1.2 LanguageModel グローバル存在確認と availability 取得
  - `LanguageModel` (および `window.ai`) の有無を安全に参照
  - 存在時のみ `availability()` を await して結果を返す
  - 結果をインスタンス内にキャッシュし 2 回目以降は実 API を呼ばない
  - 例外は握り潰し `unavailable` 扱い + 一度だけ warn
  - **Test scenarios**:
    - ✓ API 不在 → `unavailable`
    - ✓ `availability()` が `readily` → `readily`
    - ✓ `availability()` が throw → `unavailable`、warn 1 回
    - ✓ 2 回目の `detect()` は実 API を呼ばない (モックの call count=1)
    - ✓ 一度 `unavailable` に落ちた後は `readily` に回復しない
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

---

- [ ] 2. プロンプト生成と言語判定の純関数層
- [ ] 2.1 (P) 言語判定器の実装
  - ひらがな / カタカナ比率で `ja` 判定
  - ASCII ラテン文字のみなら `en`
  - 上記以外 (漢字のみ / 中国語混在等) は `other`
  - 判定は決定論的 (同入力 → 同出力)
  - **Test scenarios**:
    - ✓ 「議事録を要約してほしい」 → `ja`
    - ✓ 「Please summarize this document.」 → `en`
    - ✓ 「请总结一下」 → `other`
    - ✓ 空文字 → `other` または既定値
    - ✓ 日英混在で日本語比率優位 → `ja`
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 2.2 (P) カテゴリ × 言語別プロンプトテンプレート
  - 5 カテゴリ × (ja / en / other) の system prompt を定義
  - system prompt にカテゴリの主動詞と「入力言語に合わせる」「前置き語を付けない」指示を含める
  - user prompt は `---\n{text}\n---` 形式で入力を包む
  - `other` は既定を日本語にし、LLM に入力言語への追従を指示
  - **Test scenarios**:
    - ✓ 全 15 組合せで文字列が空でない
    - ✓ 同一 (category, lang) で同一出力 (決定論)
    - ✓ `improve` の system に「改善」、`summarize` に「要約」等の主動詞が含まれる
    - ✓ `en` の system は英語文で構成される
    - ✓ user prompt が `---\n{text}\n---` で包まれる
    - ✓ `other` は ja 既定 + 「respond in input's language」相当の指示を含む
  - _Requirements: 2.4, 2.5, 6.1, 6.2, 6.3, 6.4_

- [ ] 2.3 (P) 出力サニタイザ
  - 日英の前置き語 (「こちらが」「以下が」「Here is」「Sure,」等) を regex で先頭から除去
  - 出力が `---\n{text}\n---` を含まなければ `${body}\n---\n${text}\n---` を付加
  - 入力 lang=ja かつ出力に日本語文字が 0 の場合 `accepted=false`
  - それ以外は `accepted=true`
  - **Test scenarios**:
    - ✓ 「こちらが改善文です。～」 → 前置きが除去される
    - ✓ 「Here is the revised text: ～」 → 前置きが除去される
    - ✓ framing 未含有 → `\n---\n{text}\n---` が付加される
    - ✓ framing 既存 → 二重付加されない
    - ✓ ja 入力に英語応答 → `accepted=false`
    - ✓ ja 入力に日本語応答 → `accepted=true`
    - ✓ en 入力に英語応答 → `accepted=true` (言語一致チェックは ja のみ厳格)
  - _Requirements: 2.6, 2.7, 6.5_

---

- [ ] 3. セッションプールと LLM プロバイダ
- [ ] 3.1 カテゴリ別セッションプールの実装
  - カテゴリ (5 種) ごとにベースセッションを lazy 生成し内部保持
  - `get(category)` で同一ベースを返す (2 回目以降 `create()` を呼ばない)
  - 生成時に失敗したカテゴリは以降 `get()` でも同エラーを即返す (再試行しない)
  - `dispose()` で全ベースセッションを `destroy()`
  - **Test scenarios**:
    - ✓ 同カテゴリを 2 回 `get()` → create は 1 回のみ
    - ✓ 別カテゴリはそれぞれ独立した create
    - ✓ `create()` が throw → 以降同カテゴリで同一エラー (再 create なし)
    - ✓ `dispose()` → 全ベースで `destroy()` が呼ばれる
    - ✓ clone 派生 session のライフサイクル (try/finally 経由の destroy) が守られる
  - _Requirements: 5.3_

- [ ] 3.2 LanguageModelProvider の非同期 generate
  - Capability が `readily` でなければ即 `null`
  - 入力言語を判定し SessionPool から base → `clone()` で派生セッションを取得
  - `AbortSignal.timeout(2000)` と外部 AbortSignal を `AbortSignal.any` で合成
  - `session.prompt(userPrompt, { signal })` を await、OutputSanitizer で整形
  - `accepted=false` または例外 / AbortError は `null`
  - try/finally で派生 session を確実に `destroy()`
  - 成功時は `fnv1a(category + body)` で hash 化した Candidate を返却
  - **Test scenarios**:
    - ✓ readily で prompt 成功 → Candidate を返す (hash 決定論)
    - ✓ readily 以外 → `null`
    - ✓ 2 秒タイムアウト → `null` + AbortError を warn しない
    - ✓ 外部 abort → `null`
    - ✓ prompt が throw → `null` + warn 1 回
    - ✓ 言語ミスマッチで Sanitizer 拒否 → `null`
    - ✓ 成功 / 失敗いずれも派生 session が `destroy()` される
  - _Requirements: 2.1, 2.2, 2.7, 3.1, 3.2, 3.5, 6.1, 6.2, 6.3, 6.4, 6.5_

---

- [ ] 4. SettingsStore 拡張 (`llm` キー)
- [ ] 4.1 `llm: "auto" | "off"` の読み書きと既定値
  - `chrome.storage.local` に `mode` と独立した `llm` キーを追加
  - 未定義 / 不正値は `auto` にフォールバック
  - 既存 `mode` の読み書きに影響しない (Phase 2 テストを破壊しない)
  - **Test scenarios**:
    - ✓ storage に `llm=off` → `off`
    - ✓ storage に `llm=auto` → `auto`
    - ✓ storage 未定義 → `auto`
    - ✓ 不正値 (例: 空文字 / 数値) → `auto`
    - ✓ `mode` は従来通り独立して読み書きできる
  - _Requirements: 7.1, 7.4, 8.5_

- [ ] 4.2 `llm` 変更通知 listener
  - `chrome.storage.onChanged` 購読で `llm` の変更を listener に通知
  - 変更時は `{ mode, llm }` の最新スナップショットを渡す
  - **Test scenarios**:
    - ✓ storage で `llm` が `auto → off` に変わると listener が呼ばれる
    - ✓ `mode` 変更時のみは `llm` listener を呼ばなくても良いが、`Settings` 全体を渡す契約は維持する
    - ✓ `dispose()` 後は listener が呼ばれない
  - _Requirements: 7.5, 8.5_

---

- [ ] 5. TwoLayerCandidateProvider のコンポジット
  - ルールベース (`FlexibleCandidateProvider`) の結果を `immediate` に設定
  - `llm=off` または capability `readily` でない → `pending = Promise.resolve(null)`
  - それ以外 → `pending = llmProvider.generate(req, signal)`
  - 既存 `CandidateProvider` 型を壊さず、`TwoLayerCandidate` を返す新インターフェースを別名で提供
  - **Test scenarios**:
    - ✓ 通常経路 → `immediate` は同期 Rule 出力、`pending` は LLM 結果
    - ✓ `llm=off` → `pending` は `null` resolve
    - ✓ capability `unavailable` → `pending` は `null` resolve
    - ✓ capability `downloadable` / `downloading` → `pending` は `null` resolve (DL を起動しない)
    - ✓ 同一 req を 2 回呼ぶと `immediate` は決定論
    - ✓ LLM 例外時も `immediate` は必ず valid
  - _Requirements: 2.1, 2.3, 4.2, 8.1, 8.3_

---

- [ ] 6. Controller 改修 — 2 層差替えと pending 管理
- [ ] 6.1 pending 追跡と LLM 候補差替え render
  - Session state に `pendingController: AbortController | null` と `visibleCandidate: Candidate | null` を追加
  - `evaluate()` で `immediate` を従来通り即 render し、`visibleCandidate` を更新
  - `pending` resolve 時、非 null かつ hash が `visibleCandidate.hash` と異なれば差替え render
  - `null` / AbortError は差替えなし
  - **Test scenarios**:
    - ✓ pending 解決 (LLM 成功) → render が 2 回 (immediate + LLM)
    - ✓ pending が null → render 1 回のみ
    - ✓ LLM hash == immediate hash → render 1 回のみ
    - ✓ AbortError resolve → 差替えなし、warn なし
    - ✓ render 順序が必ず immediate → LLM
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 6.2 再入力 / blur / Esc / cycle での pending 中断と再起動
  - 新しい `evaluate()` 開始前に古い `pendingController.abort()`
  - blur / dismiss (Esc) / teardown でも abort
  - ArrowDown / ArrowUp cycle 時も新しいカテゴリで 2 層経路を再実行 (前回の pending は abort)
  - **Test scenarios**:
    - ✓ 連続入力で 2 回目 evaluate 開始時に前回 controller.abort() が呼ばれる
    - ✓ blur で pending.abort() が呼ばれる
    - ✓ Esc で pending.abort() が呼ばれる (ghost 非表示と併せて)
    - ✓ cycle で前の pending を abort し、新カテゴリの immediate + pending が走る
    - ✓ teardown で全セッションの pending が abort
  - _Requirements: 3.3, 3.4, 4.4, 4.6_

- [ ] 6.3 Tab 確定時の `visibleCandidate` 使用
  - `commit` ハンドラで現在表示中の `visibleCandidate` を `target.setText` に渡す
  - 未解決の pending があれば commit 前に abort
  - commit 後は従来通り `dismissedHash` / `committed` を設定
  - **Test scenarios**:
    - ✓ LLM 差替え後に Tab → setText は LLM 候補 body で呼ばれる
    - ✓ LLM 差替え前に Tab → setText は immediate 候補 body で呼ばれる
    - ✓ commit 時に pending がまだなら abort される
    - ✓ commit 後は同一 text での再表示が抑止される (既存挙動維持)
  - _Requirements: 4.5_

- [ ] 6.4 設定 (`llm`) に基づく経路分岐と onChange 反応
  - bootstrap 時に `settings.load()` を待ち `llm` を反映
  - `llm=off` の間は TwoLayerProvider が常に `pending=null` を返すため LLM 経路が走らない
  - storage 変更で `llm` が `auto → off` に変わったら、全セッションの進行中 pending を即 abort
  - `llm` は既存 `mode` (classic/flexible) と独立 (直交スイッチ)
  - **Test scenarios**:
    - ✓ `llm=auto` + capability readily → LLM 差替えが起こる
    - ✓ `llm=off` → LLM 差替えが起こらない (render 1 回)
    - ✓ `llm=auto → off` onChange → 進行中 pending が abort される
    - ✓ `mode=classic` と `llm=auto` の組み合わせ → classic rule + LLM の 2 層が成立
    - ✓ `llm` 未定義 / 不正値 → auto 相当で動作
  - _Requirements: 7.2, 7.3, 7.5, 8.5_

---

- [ ] 7. 統合テスト・E2E・非機能検証
- [ ] 7.1 (P) TwoLayerProvider + 実 FlexibleProvider + モック LLM の結合テスト
  - 代表入力で immediate が Rule 出力、pending がモック LLM 出力であることを確認
  - **Test scenarios** (対応 IT-ID):
    - ✓ IT-501 「議事録を要約」 → immediate は要約テンプレ、pending はモック LLM body
    - ✓ IT-501' 同入力で 2 回 provide() → immediate は決定論、pending の signal が別インスタンス
  - _Requirements: 2.1, 2.3, 4.2_

- [ ] 7.2 (P) Controller + TwoLayerProvider の happy-dom E2E
  - 入力 → immediate 即 render → 2 秒以内に LLM render → Tab 確定で LLM body が反映される一連の流れ
  - **Test scenarios** (対応 IT-ID):
    - ✓ IT-502 入力 → render 2 回 (immediate, LLM)
    - ✓ IT-502' LLM 差替え後に Tab → textarea.value が LLM body
    - ✓ IT-502'' LLM 差替え中に Esc → 差替えなし、pending abort
    - ✓ cycle 後も 2 層経路が再実行される
  - _Requirements: 4.1, 4.2, 4.4, 4.5, 4.6_

- [ ] 7.3 (P) `llm=off` / capability unavailable の統合テスト
  - モック settings と capability を off / unavailable にセットして controller を bootstrap
  - **Test scenarios** (対応 IT-ID):
    - ✓ IT-503 `llm=off` → render 1 回 (immediate のみ)、LLM 呼び出しなし
    - ✓ capability `unavailable` → render 1 回、Phase 2 挙動と同一
    - ✓ `llm=auto → off` 切替直後に進行中 pending が abort される
  - _Requirements: 7.2, 7.3, 7.5, 8.1_

- [ ] 7.4 性能計測とバンドルサイズ検証
  - immediate 描画は 100ms 以内 (debounce + 処理時間)
  - LLM 生成はモック環境で 2 秒タイムアウト遵守 (時間切れで `null` が返る) を確認
  - `pnpm build` 後の gzip 増分が +2KB 以内
  - **Test scenarios** (対応 PT-ID):
    - ✓ PT-301 ルール描画 < 100ms (既存計測を維持)
    - ✓ PT-302 LLM タイムアウトで 2 秒以内に `null` resolve
    - ✓ PT-303 gzip 増分 ≤ +2KB
  - _Requirements: 4.1, 5.4_

- [ ] 7.5 セキュリティ / プライバシー非機能検証
  - 外部通信が発生しないことをソース検査で確認 (`fetch` / `XMLHttpRequest` / `WebSocket` の新規使用なし)
  - プロンプト文字列を warn / info ログに含めていないことを grep で確認
  - `manifest.json` の permissions 差分がないことを確認
  - **Test scenarios**:
    - ✓ LLM 層のソースに `fetch(` / `XMLHttpRequest` / `WebSocket` が含まれない
    - ✓ warn / console 出力にユーザー入力や system prompt 本文が含まれない (モック経由で検査)
    - ✓ `manifest.json` の permissions 配列が Phase 2 と同一
  - _Requirements: 5.1, 5.2, 5.5_

- [ ]* 7.6 手動テストチェックリスト
  - MT-301: 実 Chrome 138+ で入力 → ルール即時 → LLM 差替えの目視
  - MT-302: ネットワーク切断状態で同シナリオを実行 (完全ローカル確認)
  - MT-303: DevTools で `chrome.storage.local.set({ llm: "off" })` → LLM 経路が止まる
  - **Test scenarios**:
    - ✓ 差替えが視覚的に自然 (ちらつきが許容範囲)
    - ✓ オフライン状態でも LLM 経路が同様に動作
    - ✓ `llm=off` が即時反映される
  - _Requirements: 4.2, 5.1, 7.3_

- [ ] 7.7 Phase 1/2 リグレッション確認
  - 既存 124 テスト (+Phase 2 追加分) が全件 pass の状態を維持
  - GhostRenderer の hash dirty check に変更がない
  - `CandidateProvider` 型は無変更 (新コンポジット型は別名で提供)
  - **Test scenarios**:
    - ✓ 既存テストスイートが全件 pass (CI green)
    - ✓ GhostRenderer のテストが無変更で pass
    - ✓ `CandidateProvider` interface に破壊的変更がないことを型テストで確認
  - _Requirements: 8.2, 8.3, 8.4_
