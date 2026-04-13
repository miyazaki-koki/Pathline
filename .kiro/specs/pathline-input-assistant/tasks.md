# Implementation Plan — Pathline Input Assistant

> Canon TDD で進める。各サブタスクの **Test scenarios** を test list としてそのまま RED → GREEN → BLUE に流す。
> `(P)` マーカーは同じ Major タスク配下で並行実行可能なタスクに付与。
> 要件 ID は `requirements.md` の `N.M` 形式 (N: 大項目, M: Acceptance Criteria 番号)。

---

- [ ] 1. プロジェクト初期化と MV3 土台
- [ ] 1.1 Chrome 拡張 MV3 プロジェクトを Vite + @crxjs で立ち上げる
  - TypeScript strict / `noUncheckedIndexedAccess` を有効化
  - `manifest.json` を MV3 で定義し、`host_permissions: ["<all_urls>"]`、`permissions: ["storage"]`、Content Script エントリ登録
  - ESLint (typescript-eslint) + Prettier + `no-restricted-globals` (fetch/XMLHttpRequest/WebSocket 禁止) を設定
  - Vitest + happy-dom のテスト環境を構築
  - **Test scenarios**:
    - ✓ `pnpm build` で `dist/` に content script と manifest が出力される
    - ✓ ESLint が `fetch` 使用コードでエラーを出す
    - ✓ Vitest が happy-dom 環境で `document` を参照できる
  - _Requirements: 7.1, 7.4_

- [ ] 1.2 カテゴリ定義とテンプレ文面の静的マスタを作成
  - 5 カテゴリ (improve / summarize / clarify / structure / review) を readonly 配列として定義
  - 各カテゴリに label と基本テンプレート文を持たせる
  - `CategoryId` を discriminated union として型固定
  - **Test scenarios**:
    - ✓ 5 カテゴリすべてが定義されている
    - ✓ テンプレ文は要件 4.1–4.5 の文言と完全一致
    - ✓ 未知の `CategoryId` をコンパイルエラーにできる (型テスト)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 8.2_

---

- [ ] 2. ロジック層: スコアリングと安定化
- [ ] 2.1 (P) ScoringEngine を純関数として実装
  - 入力文字列を受け取り `ScoreVector` を返す
  - 要件 2.3–2.11 の 9 ルールを適用 (文字数 / 改行 / `?` / 曖昧改善語 / 明示キーワード / コード記号)
  - 明示キーワード (要約 / レビュー / 問題点 / 整理 / まとめ / どう思う / どうすれば) 検出時は `explicit: true` を立てる
  - 10_000 文字超の入力は先頭のみ評価
  - `topCategory` は決定論的に選択 (同点時は定義順で解決)
  - **Test scenarios**:
    - ✓ 120 文字超 → summarize +3, structure +1
    - ✓ 改行含む → structure +2
    - ✓ `?` / `？` 含む → clarify +2
    - ✓ 「いい感じ」「直して」「整えて」「改善」 → improve +3
    - ✓ 「要約」 → summarize +5 & explicit=true
    - ✓ 「レビュー」「問題点」 → review +5 & explicit=true
    - ✓ 「整理」「まとめ」 → structure +4 & explicit=true
    - ✓ 「どう思う」「どうすれば」 → clarify +3 & explicit=true
    - ✓ `{ } ( ) ; =` 等 → review +3
    - ✓ 空文字 → 全カテゴリ 0
    - ✓ 10_001 文字入力 → 先頭 10_000 のみ評価
    - ✓ 同一入力に対し常に同一 ScoreVector を返す (参照透過)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11_

- [ ] 2.2 (P) CategoryStateMachine を実装
  - 入力欄ごとの現トップカテゴリと challenger カウントを保持
  - `reduce(vec)` でスコア差 ≥2 または 2 連続優勢で切替、explicit は即切替、それ以外は維持
  - `cycle(+1/-1)` で順序配列を循環 (ArrowUp/Down 用)
  - 手動 cycle 後は manualLock を立て、次の explicit 入力または `reset()` まで自動切替をロック
  - **Test scenarios**:
    - ✓ 初期状態で `vec.topCategory` を採用
    - ✓ 差 ≥2 で切替
    - ✓ 2 連続で challenger 優勢 → 切替
    - ✓ 差 <2 かつ 1 回のみ → 維持
    - ✓ explicit=true → 即切替 & カウントリセット
    - ✓ cycle(+1) で次カテゴリへ
    - ✓ cycle(-1) は末尾から先頭へ循環
    - ✓ manualLock 中は reduce で自動切替が発生しない
    - ✓ explicit 入力で manualLock が解除される
  - _Requirements: 3.1, 3.2, 3.4, 6.2, 6.3, 8.1_

- [ ] 2.3 TemplateGenerator を実装
  - `build(category, text)` でカテゴリ別テンプレ + `---\n{text}\n---` を生成
  - 未知カテゴリは型でコンパイル不可
  - 同カテゴリ内では同テンプレ枠で text のみ差し替え
  - **Test scenarios**:
    - ✓ 5 カテゴリそれぞれで要件 4.1–4.5 の文言を先頭に持つ
    - ✓ 入力テキストが `---` で囲まれる (4.6)
    - ✓ text が複数行でも区切り線が崩れない
    - ✓ text が空文字の場合の挙動が決定的
  - _Requirements: 3.3, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ] 2.4 CandidateProvider ポートと Rule-Based 実装を作成
  - `CandidateProvider` インターフェース (同期/非同期両対応の戻り値型) を定義
  - MVP 実装 `RuleBasedCandidateProvider` は TemplateGenerator を同期呼び出しし、`body` + FNV-1a 32bit ハッシュを返す
  - **Test scenarios**:
    - ✓ 同一 (category, text) で同一 hash を返す
    - ✓ text が変わると hash が変わる
    - ✓ category が変わると hash が変わる
    - ✓ Promise を返すダミー実装に差し替えても型が通る (将来拡張性)
  - _Requirements: 5.3, 8.3_

---

- [ ] 3. DOM 層: 入力欄監視と入出力アダプタ
- [ ] 3.1 (P) DomWatcher を実装 (textarea / contenteditable 検出)
  - 初回スキャンと MutationObserver による動的追加/削除の追従
  - 除外判定: `input[type=password]`, `data-pathline="off"`, `aria-hidden="true"` 祖先
  - 同一要素への重複 attach を WeakSet で防止
  - attach/detach をリスナーで通知
  - **Test scenarios**:
    - ✓ 既存 textarea を 1 回だけ attach する
    - ✓ 後から追加された contenteditable を attach する
    - ✓ password input は attach しない
    - ✓ `data-pathline="off"` を持つ要素は attach しない
    - ✓ 削除された要素に対し detach が発火する
  - _Requirements: 1.1, 1.2, 1.4, 1.5_

- [ ] 3.2 (P) InputAdapter を実装 (textarea / contenteditable 統一 API)
  - `getText` / `setText` / `getCaretOffset` / `focus` / `onInput` / `onBlur` / `onFocus` を両種で統一提供
  - textarea: `value` と `selectionStart` を使用。React 管理 textarea には `nativeInputValueSetter` 経由で反映
  - contenteditable: `textContent` と `Selection`/`Range` を使用。`compositionstart`/`compositionend` 中は onInput を抑止
  - setText 後に `input` イベントを dispatch
  - **Test scenarios**:
    - ✓ textarea で getText / setText が往復する
    - ✓ contenteditable で getText / setText が往復する
    - ✓ IME 変換中は onInput が発火しない
    - ✓ setText が `input` イベントを発火する
    - ✓ React controlled textarea でも value が反映される (jsdom/happy-dom モックで検証)
    - ✓ blur/focus リスナーが発火する
  - _Requirements: 1.1, 1.3, 6.1_

---

- [ ] 4. View 層: GhostRenderer 2 戦略実装
- [ ] 4.1 (P) TextareaOverlayRenderer を実装
  - `position: absolute` の overlay div を textarea と同一フォント/パディング/border で重ね、未入力部分に候補文を薄色描画
  - `getComputedStyle` を focus 時と `window.resize`/scroll で再同期
  - 高 specificity CSS + `pl-*` 名前空間でホスト干渉を最小化
  - `textContent` のみを使用し XSS を防止
  - **Test scenarios**:
    - ✓ focus 時に overlay が textarea と同位置に重なる
    - ✓ スクロール時に overlay が追従する
    - ✓ hide() で overlay が DOM から除去される
    - ✓ 候補文が `textContent` で挿入される (innerHTML 未使用)
    - ✓ `aria-hidden="true"` が付与される
  - _Requirements: 5.1, 5.2_

- [ ] 4.2 (P) ContentEditableInlineRenderer を実装
  - 末尾に `span.pl-ghost[contenteditable=false][aria-hidden=true]` を挿入
  - `user-select: none` でキャレット侵襲を防ぐ
  - hide() で span を除去
  - **Test scenarios**:
    - ✓ render 後に ghost span が 1 つだけ存在する
    - ✓ ghost span は `contenteditable=false` を持つ
    - ✓ hide() で ghost span が除去される
    - ✓ `textContent` のみで描画される
  - _Requirements: 5.1, 5.2_

- [ ] 4.3 GhostRenderer ファサード (戦略振分け + 再描画抑止)
  - InputTarget.kind に応じて 2 戦略を選択
  - 同一 `candidate.hash` なら no-op (再描画抑止)
  - 1 target に 1 ghost のみ保持 (WeakMap で target→ghost state)
  - **Test scenarios**:
    - ✓ textarea target で overlay 戦略が使われる
    - ✓ contenteditable target で inline 戦略が使われる
    - ✓ 同一 hash で連続 render しても DOM 書込が発生しない
    - ✓ 異なる hash で render すると置き換わる
    - ✓ isVisible が描画状態を正しく返す
  - _Requirements: 5.1, 5.2, 5.3_

---

- [ ] 5. Input 層: KeyboardHandler
- [ ] 5.1 KeyboardHandler を実装 (Tab/Arrow/Esc + IME/非表示ガード)
  - `keydown` を capture phase で購読
  - visible===true のときのみ `preventDefault` + `stopImmediatePropagation`
  - `isComposing===true` の間は何もしない
  - Tab → commit, ArrowUp → cycle(-1), ArrowDown → cycle(+1), Esc → dismiss
  - **Test scenarios**:
    - ✓ visible=true で Tab → commit action が発火し preventDefault される
    - ✓ visible=false で Tab → ネイティブ動作 (preventDefault しない)
    - ✓ ArrowDown → cycle(+1) action
    - ✓ ArrowUp → cycle(-1) action
    - ✓ Esc → dismiss action & preventDefault
    - ✓ IME 変換中 (isComposing=true) は何もしない
    - ✓ 非対象キー (a, 1 等) は常にパススルー
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

---

- [ ] 6. Orchestration 層: PathlineController
- [ ] 6.1 PathlineController で全レイヤーを結線
  - DomWatcher の attach/detach に応じてセッション (state machine / ghost / handler) を生成/破棄
  - 入力ごとに 150ms debounce でスコア → 状態遷移 → テンプレ → render のパイプラインを実行
  - 入力欄ごとに `WeakMap` でセッションを保持
  - blur で候補を hide (要件 1.3)
  - **Test scenarios**:
    - ✓ attach された textarea に入力すると 150ms 後に ghost が表示される
    - ✓ blur で ghost が消える
    - ✓ Tab で candidate が textarea.value に反映される
    - ✓ ArrowDown でカテゴリが次に切り替わる
    - ✓ 入力欄 2 つそれぞれで独立した状態が保たれる
  - _Requirements: 1.3, 2.1, 6.1_

- [ ] 6.2 Controller に差分ガードと最小長しきい値を実装
  - `MIN_LENGTH = 4` 未満は ghost を出さず hide
  - 直前評価テキストとの diff が 1 文字以下かつ構造記号 (改行/記号) 変化がない場合は再評価スキップ
  - 明示キーワード検出時は debounce を 50ms に短縮 (即応)
  - **Test scenarios**:
    - ✓ 3 文字入力では ghost が表示されない
    - ✓ 4 文字以上で ghost が表示される
    - ✓ 1 文字追加のみなら再評価がスキップされる
    - ✓ 改行追加は構造変化として再評価される
    - ✓ 「要約」入力は 50ms 以内に候補が切り替わる
  - _Requirements: 5.4, 7.2, 7.3_

- [ ] 6.3 Esc dismiss と同一入力の再抑止を実装
  - Esc で hide + 現 text の FNV-1a ハッシュを `dismissedHash` に保存
  - 次の入力で text ハッシュが `dismissedHash` と一致する間は render しない
  - text が変わったら抑制解除
  - **Test scenarios**:
    - ✓ Esc 後、同一 text では再表示されない
    - ✓ text が 1 文字変わると再表示される
    - ✓ blur→再 focus しても同一 text なら抑制が維持される
    - ✓ 別の入力欄には影響しない
  - _Requirements: 6.4_

---

- [ ] 7. エントリポイントと Manifest の最終結線
- [ ] 7.1 Content Script エントリ `content.ts` で Controller を bootstrap
  - `document.readyState` を考慮した初期化
  - Controller のシングルトン化 (同一ページで 2 重起動防止)
  - dev ビルドでのみ `performance.mark` 計測を有効化
  - **Test scenarios**:
    - ✓ DOMContentLoaded 後に bootstrap が走る
    - ✓ 同一ページで 2 度 import されても Controller は 1 つ
    - ✓ prod ビルドで performance.mark が無効化される
  - _Requirements: 7.1, 7.4, 7.5_

---

- [ ] 8. 統合テストと品質ゲート
- [ ] 8.1 (P) DOM 統合テスト (GhostRenderer + InputAdapter)
  - textarea overlay 描画/消去の end-to-end 検証
  - contenteditable inline span 描画/消去の検証
  - 同一 hash 2 回 render で DOM 書込 0 を計測
  - 動的に追加された textarea も attach されることを検証
  - password input が除外されることを検証
  - React 管理 textarea への setText が state に反映されることを検証
  - **Test scenarios** (対応する IT-ID):
    - ✓ IT-301 textarea 描画→hide
    - ✓ IT-302 contenteditable 描画→hide
    - ✓ IT-303 同一 hash 再描画抑止
    - ✓ IT-304 MutationObserver 動的追加
    - ✓ IT-305 Esc 後同一 text で再表示なし
    - ✓ IT-306 React controlled textarea の setText
    - ✓ IT-307 password 除外
  - _Requirements: 1.1, 1.2, 1.4, 5.1, 5.2, 5.3, 6.4_

- [ ] 8.2 (P) E2E テスト仕様 (Playwright、コードは任意)
  - E2E-001: textarea で Improve 候補を Tab 確定するフロー
  - E2E-002: contenteditable で ArrowDown 切替 → Esc 閉じるフロー
  - **Test scenarios**:
    - ✓ 拡張ロード済みのテストページで textarea に「これいい感じに直して」を入力→ 150ms 待機→ Tab → textarea.value が候補全文になる
    - ✓ contenteditable に 120 字超の議事録を入力→ ArrowDown でカテゴリ変化→ Esc で候補消去、同 text で再表示されない
  - _Requirements: 6.1, 6.2, 6.4_

- [ ] 8.3 (P) 手動テスト仕様チェックリスト
  - MT-001 ゴースト位置 (textarea スクロール追従)
  - MT-002 ゴースト装飾 (薄色・非選択)
  - MT-003 Edge / Brave での同等動作
  - MT-004 スクリーンリーダーで読み上げられない (`aria-hidden`)
  - MT-005 日本語文言崩れなし
  - **Test scenarios**:
    - ✓ 各項目を実機で目視確認し結果を記録
  - _Requirements: 5.1, 5.2, 7.4_

- [ ] 8.4 パフォーマンス計測 (PT-001/002)
  - debounce 後の score → render パイプライン時間を計測 (目標 < 20ms @ 1000 文字)
  - 同一 hash 再描画抑止で DOM 書込 0 を確認
  - 計測結果を `research.md` の追記に反映
  - **Test scenarios**:
    - ✓ 1000 文字入力で処理時間 < 20ms (dev ビルド計測)
    - ✓ 同一 hash で `MutationObserver` が 0 件の変更しか観測しない
  - _Requirements: 5.5, 7.2, 7.3_

- [ ]* 8.5 セキュリティ静的検査
  - ESLint `no-restricted-globals` で `fetch`/`XMLHttpRequest`/`WebSocket` 禁止が維持されていることを CI で確認
  - `innerHTML` 使用を検出する ESLint ルールを追加
  - **Test scenarios**:
    - ✓ `fetch(...)` を含むコードをテストしてエラーが出る
    - ✓ `innerHTML =` がエラーになる
  - _Requirements: 7.1_
