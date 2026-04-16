# Implementation Plan — Pathline Flexible Recommendation

> Phase 2 拡張。既存 `CandidateProvider` を差し替える形で、特徴抽出 + 部品組み立てによる柔軟な依頼文生成を導入する。
> `(P)` マーカーは同じ Major タスク配下で並行可能。要件 ID は `requirements.md` の `N.M` 形式。

---

- [x] 1. Feature スキーマと静的定義を整備
- [x] 1.1 特徴量の型とスキーマを 1 箇所に集約
  - `TargetKind` / `Tone` / `OutputFormat` / `LengthHint` / `Features` を定義
  - empty 状態の既定値を定数として提供
  - `CategoryId` との依存関係なし (純粋な value types)
  - **Test scenarios**:
    - ✓ 既定 Features は `empty=true` かつ全フィールド既定値
    - ✓ `focus` は readonly 配列で最大 3 件
    - ✓ 未知の TargetKind がコンパイルエラーになる (型テスト)
  - _Requirements: 1.8, 6.1_

- [x] 1.2 辞書とパターン定義を作成
  - 対象種別 / トーン / 形式 / 長さ制約ごとにキーワード辞書を readonly 配列で定義
  - 焦点候補抽出用の正規表現 (英数字記号 / カタカナ / 鍵括弧) を定義
  - 長さ上限 (16 文字) ・件数上限 (3 件) を定数化
  - **Test scenarios**:
    - ✓ 各辞書は空配列でない (最低 1 件)
    - ✓ 重複キーワードが含まれない
    - ✓ 正規表現が期待通りに文字列をマッチする (サニティチェック)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 6.1_

---

- [x] 2. RuleBasedFeatureExtractor を実装
- [x] 2.1 (P) 対象種別推定の Extractor ロジック
  - code / prose / meeting_minutes / spec / proposal / question / unknown の 7 分類
  - コード判定は連続記号 (2 文字以上) と予約語で判定 (単独記号での誤検知を避ける)
  - 議事録 / 仕様 / 提案は専用キーワード (辞書) で判定
  - 質問は `?` / `？` / 「どう」を含む場合
  - **Test scenarios**:
    - ✓ `function f(){ return 1 }` → code
    - ✓ 「議事録」「決定事項」含む → meeting_minutes
    - ✓ 「仕様」「要件」含む → spec
    - ✓ 「提案」「案として」含む → proposal
    - ✓ 「どうすればいい？」 → question
    - ✓ 単独の `;` のみ → code 判定されない (誤検知防止)
    - ✓ 最小しきい値未満の入力 → unknown (empty)
  - _Requirements: 1.1, 1.8_

- [x] 2.2 (P) トーン / 出力形式 / 長さ制約の推定
  - トーン: 「です/ます」連続 2 件以上で formal、「だよ」「じゃん」で casual、それ以外 neutral
  - 形式: 「箇条書き」「リストで」で bullets、「表で」「テーブル」で table、「コード」対象かつ「書いて」で code
  - 長さ: 「簡潔に」「短く」「N行で」「N文字以内」で concise、「詳しく」「丁寧に」「網羅的」で detailed
  - **Test scenarios**:
    - ✓ 「です/ます」2 件以上 → formal
    - ✓ 「です/ます」1 件のみ → neutral (しきい値)
    - ✓ 「だよ」含む → casual
    - ✓ 「箇条書き」含む → bullets
    - ✓ 「表で」含む → table
    - ✓ 「簡潔に」含む → concise
    - ✓ 「3行で」含む → concise
    - ✓ 「詳しく」含む → detailed
    - ✓ 該当語なし → 既定値
  - _Requirements: 1.2, 1.3, 1.4, 1.5_

- [x] 2.3 (P) 焦点候補語の抽出
  - 正規表現で「英数字 + ドット/アンダースコア」「カタカナ連続」「鍵括弧内」から候補抽出
  - 1 語 4-16 文字に制限、重複除去
  - 出現頻度順で上位 3 件
  - **Test scenarios**:
    - ✓ 「`UserService` をレビュー」 → focus=["UserService"]
    - ✓ 「サービス、ユーザー、コンポーネント」 → focus=["サービス","ユーザー","コンポーネント"]
    - ✓ 「"認証フロー"を整理」 → focus=["認証フロー"]
    - ✓ 候補 4 件以上 → 上位 3 件のみ
    - ✓ 3 文字以下の語 → 除外
    - ✓ 17 文字以上の語 → 除外
    - ✓ 重複する語 → 1 件にまとめる
  - _Requirements: 1.6_

- [x] 2.4 Extractor の統合と性能計測
  - FeatureExtractor ポートの実装クラスをまとめる
  - 入力先頭 10_000 文字切出しを共通化
  - `empty=true` の early return を実装 (4 文字未満)
  - 1000 文字入力で 5ms 以内に完了することを計測
  - **Test scenarios**:
    - ✓ 4 文字未満入力 → empty Features
    - ✓ 10_001 文字入力 → 先頭 10_000 のみ評価 (焦点語は先頭部分からのみ抽出)
    - ✓ 同一入力 → 同一 Features (参照透過性)
    - ✓ 1000 文字入力で extract() が 5ms 以内に完了
  - _Requirements: 1.7, 1.8, 6.4_

---

- [x] 3. PartsTable の構築
- [x] 3.1 スロット / PartCandidate 型の定義
  - `SlotId` 固定値 (intro / focus / constraint / format / closing)
  - `PartCandidate` の型 (id / text / when / priority)
  - プレースホルダ展開のユーティリティ (`${focus}` → features.focus の「、」連結)
  - **Test scenarios**:
    - ✓ プレースホルダなしの text はそのまま返る
    - ✓ `${focus}` が features.focus で置換される
    - ✓ focus が空の場合、「${focus}」を含む部品は採用されない (when 評価側で除外)
  - _Requirements: 2.1, 6.2_

- [x] 3.2 (P) Improve / Summarize カテゴリの部品候補
  - 各カテゴリで intro / focus / constraint / format / closing の候補を定義
  - improve: 自然な表現への改善、focus 語があれば「特に X」、concise で「簡潔に」
  - summarize: 要約、bullets/table 対応、長さ制約対応
  - `when` 条件は features のフィールドに基づく純関数
  - **Test scenarios**:
    - ✓ improve の各スロットに最低 1 件の fallback 候補がある
    - ✓ summarize の bullets/table/concise/detailed パスで該当候補が選択される
    - ✓ 各候補の `text` は句点で終わる (連結時の整形維持)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

- [x] 3.3 (P) Clarify / Structure / Review カテゴリの部品候補
  - clarify: 相談整理、質問明確化、focus 語の取り込み
  - structure: 箇条書き / 表 / 階層化、detailed/concise 分岐
  - review: コード / 提案 / 仕様の対象別前置き、レビュー観点 (問題点 / 改善案)
  - **Test scenarios**:
    - ✓ 各カテゴリの各スロットに最低 1 件の fallback がある
    - ✓ review + target=code で「以下のコード」が intro に選ばれる
    - ✓ structure + format=bullets で箇条書き指定が format スロットに入る
    - ✓ clarify + focus 非空で「特に X について」等が focus スロットに入る
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

- [x] 3.4 PartsTable の統合と不変条件の検証
  - 全カテゴリ × 全スロットを Readonly な 2 次元テーブルとして export
  - 全 25 セル (5 cat × 5 slot) に候補配列が存在することを型と実行時テストで保証
  - 優先度 (priority) の昇降順が破綻していないことを確認
  - **Test scenarios**:
    - ✓ テーブルの 25 セルすべてが定義されている
    - ✓ 各セルは空配列でない (最低 1 件の fallback)
    - ✓ 各候補の id がカテゴリ × スロット内で一意
  - _Requirements: 2.1, 6.2_

---

- [x] 4. RecommendationComposer の実装
- [x] 4.1 スロット選択アルゴリズム
  - 各スロットで `when(features) === true` の候補を priority 降順で 1 件選択
  - 該当なしはスロット skip
  - スロット順 (intro → focus → constraint → format → closing) は固定
  - **Test scenarios**:
    - ✓ when がすべて false のスロットは skip される
    - ✓ when=true が複数 → priority 最大が選ばれる
    - ✓ priority 同点 → id 辞書順で決定論的に選ぶ
  - _Requirements: 2.1, 3.1, 3.3, 3.4_

- [x] 4.2 部品連結と text 埋め込み
  - 選ばれた部品の text を順に結合 (プレースホルダ展開済み)
  - 末尾に `\n---\n${text}\n---` を付与
  - features.empty=true の場合は MVP 互換の基本テンプレにフォールバック
  - **Test scenarios**:
    - ✓ 各カテゴリで features.empty=true → 既存 `buildTemplate` と同一出力
    - ✓ 通常時は `{連結部品}\n---\n{text}\n---` 形式
    - ✓ text が複数行でも `---` 区切りが維持される
    - ✓ 同入力 → 同出力 (決定論性)
    - ✓ 1 部品のみ features が変化 → 対応スロットのみ差し替え、他は同一
  - _Requirements: 2.1, 2.10, 2.11, 3.1, 3.3, 3.4_

- [x] 4.3 代表入力のスナップショットテスト
  - 30 件の代表入力 (5 カテゴリ × 6 バリエーション) で compose 結果をスナップショット化
  - フィクスチャは `src/core/compose/__fixtures__/` に配置
  - **Test scenarios**:
    - ✓ 30 件すべてでスナップショット一致
    - ✓ スナップショットファイルの hash が git 管理で追跡可能
  - _Requirements: 2.1, 3.4_

---

- [x] 5. FlexibleCandidateProvider の実装と統合
- [x] 5.1 FlexibleCandidateProvider クラスを実装
  - `CandidateProvider` インターフェースを実装
  - コンストラクタで `FeatureExtractor` と `RecommendationComposer` を DI
  - `provide(req)` で extract → compose → hash 計算 (fnv1a) → Candidate を返す
  - 既存 hash 生成関数 (`candidate.ts` の FNV-1a) を再利用または同等再実装
  - **Test scenarios**:
    - ✓ 通常入力で Candidate を同期返却
    - ✓ hash は `category + body` から決定論的
    - ✓ 同一 req → 同一 Candidate
    - ✓ text だけ変わる → hash 変わる
    - ✓ 既存 `CandidateProvider` 型に型レベルで適合
  - _Requirements: 2.1, 3.2, 5.1_

- [x] 5.2 既存 Controller のデフォルト Provider を差し替え
  - `createController()` の `deps.provider` 既定値を `FlexibleCandidateProvider` のインスタンスに変更
  - 既存の `RuleBasedCandidateProvider` は `export` を維持し classic mode で使用可能に
  - 既存 69 テストが引き続き pass することを確認
  - **Test scenarios**:
    - ✓ DI なしで `createController()` を呼ぶと FlexibleProvider が使われる
    - ✓ deps.provider を明示注入すればそれが優先される
    - ✓ 既存 controller テスト 7 件が pass
  - _Requirements: 2.1, 5.1, 5.2, 5.5_

---

- [x] 6. SettingsStore と mode 切替
- [x] 6.1 SettingsStore を実装
  - `chrome.storage.local` から `{ mode }` を読み出す
  - 値が無い / 不正な場合は `flexible` 既定
  - `chrome.storage.onChanged` を購読し listener に通知
  - テストでは chrome API をモック
  - **Test scenarios**:
    - ✓ storage に `mode=classic` あり → mode=classic を返す
    - ✓ storage 値なし → mode=flexible
    - ✓ 不正値 (例: 空文字) → mode=flexible にフォールバック
    - ✓ storage 変更で onChange listener が呼ばれる
    - ✓ storage 読み込み例外 → mode=flexible で続行、warn ログのみ
  - _Requirements: 5.3_

- [x] 6.2 Controller に mode 判定を組み込む
  - `bootstrap()` で SettingsStore.load() を await、mode に応じて Provider を選択
  - 初回は flexible を仮定して即起動、storage 解決後に必要なら Provider を入れ替え
  - storage 変更時は既存セッションの Provider を差し替え、dismissedHash をクリア
  - **Test scenarios**:
    - ✓ mode=classic で bootstrap → 以降の provide 呼び出しが RuleBasedProvider 経由
    - ✓ mode=flexible で bootstrap → FlexibleProvider 経由
    - ✓ 起動後に storage が classic に変更 → 以降の provide が切り替わる
    - ✓ mode 切替で次回 evaluate 時の hash が更新される (同一 text でも再描画される)
  - _Requirements: 5.3_

---

- [x] 7. 統合テストと非機能検証
- [x] 7.1 (P) パイプライン統合テスト
  - Extractor + Composer + FlexibleProvider を結合したケース
  - 「議事録を要約して」「このコードをレビューしてください」等の代表入力で期待語句が body に含まれるか検証
  - **Test scenarios** (対応 IT-ID):
    - ✓ IT-401 summarize: 「議事録を要約」 → body に「議事録」「要約」「簡潔」等
    - ✓ IT-402 review: 「この `UserService` をレビュー」 → body に「コード」「問題点」「UserService」
    - ✓ IT-403 structure: 「複数行のメモを箇条書きで」 → body に「箇条書き」「整理」
  - _Requirements: 2.1, 2.2, 2.4, 2.7, 2.9_

- [x] 7.2 (P) Controller + FlexibleProvider の E2E 統合
  - happy-dom 上で textarea に入力 → ghost 描画が FlexibleProvider 経由になることを検証
  - 既存 Phase 1 動作 (Tab 確定 / Esc dismiss / cycle 切替) が Phase 2 でも崩れないことを確認
  - **Test scenarios**:
    - ✓ textarea に 4 文字以上入力 → ghost 表示
    - ✓ Tab 確定 → 候補文が反映され、再度 ghost は出ない
    - ✓ ArrowDown で category が切り替わり、新しい FlexibleProvider 候補が描画される
    - ✓ Esc で消え、同一 text では再表示されない
  - _Requirements: 2.1, 5.1, 5.5_

- [x] 7.3 (P) mode=classic 切替の統合テスト
  - storage をモックで `mode=classic` にセットし、Controller を bootstrap
  - 生成される body が MVP 時代の固定テンプレ (`buildTemplate` 出力) と一致することを確認
  - **Test scenarios**:
    - ✓ mode=classic で「これを要約して」 → `buildTemplate("summarize", text)` と同一 body
    - ✓ mode=flexible で同一入力 → Flexible 版 body (要約 + 簡潔等) で classic と異なる
  - _Requirements: 5.3_

- [x] 7.4 性能計測とバンドルサイズ検証 (gzip 合計: 6.89 KB)
  - Extractor + Composer + Provider の合計処理時間を 1000 文字入力で計測 (目標 < 10ms)
  - Extractor 単体の性能も別途計測 (目標 < 5ms)
  - `pnpm build` 後の gzip サイズ増分を記録 (目標 +3KB 以内)
  - **Test scenarios**:
    - ✓ PT-201 provide(): 1000 文字で < 10ms
    - ✓ PT-202 extract(): 1000 文字で < 5ms
    - ✓ バンドルサイズ増分 <= +3KB (gzip)
  - _Requirements: 1.7, 4.1, 4.5_

- [ ]* 7.5 手動テストチェックリスト
  - MT-201: 代表 5 シナリオで ghost 表示の自然さを目視 (改善/要約/明確化/整理/レビュー)
  - MT-202: storage を直接編集して classic ↔ flexible の切替動作を確認
  - MT-203: 既存 Phase 1 の挙動 (Tab / Esc / 位置判定) に回帰がないことを確認
  - **Test scenarios**:
    - ✓ 5 シナリオで不自然な表現 (重複名詞 / 句読点崩れ) がない
    - ✓ classic 切替が即時反映される (次回入力から)
    - ✓ 位置判定 (上下自動切替) が従来通り
  - _Requirements: 5.5_
