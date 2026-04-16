# Requirements Document

## Project Description (Input)
入力テキストに対して固定テンプレートを当てはめるのではなく、入力内容を解析して文脈に応じた柔軟で質の高い依頼文を提案する。MVPで作ったImprove/Summarize/Clarify/Structure/Reviewの5カテゴリ分類は維持しつつ、テンプレ文の機械的ラップから脱却し、入力の特徴(具体性・対象・トーン・出力形式の希望など)に応じて文面を動的に組み立てる。MVPの制約(外部API不使用、ローカル処理、Manifest V3、体感100ms以下)は維持。Phase2位置付けで、ルールベースの拡張で実現可能な範囲を狙う。

## Introduction
Pathline Phase 2 として、固定テンプレート文面の機械的なラップから脱却し、入力テキストから抽出した特徴 (対象種別・トーン・具体性・出力形式の希望・既出制約など) に応じて依頼文を動的に組み立てる。5カテゴリ分類 (Improve / Summarize / Clarify / Structure / Review) は MVP から維持しつつ、各カテゴリ内で複数のテンプレ部品 (前置き / 焦点指定 / 制約句 / 出力形式句 / 締め句) を組み合わせて自然な依頼文を生成する。外部 API 不使用 / ローカル同期処理 / 体感 100ms 以下の MVP 制約は維持し、Phase 3 で追加される非同期 AI 候補に対しては即時のルールベース候補を提示する役割を担う。

## Requirements

### Requirement 1: 入力特徴量の抽出
**Objective:** ユーザーとして、自分の入力に潜む意図のヒント (対象が何か、どんな出力を望むか、トーンなど) が自動的に拾われ、結果の依頼文に反映されるようにしたい。テンプレ任せでない自分の文脈に沿った提案を得るため。

#### Acceptance Criteria
1. When 候補生成が必要となる, the Pathline Feature Extractor shall 入力テキストから対象種別 (コード / 文章 / 議事録 / 仕様 / 提案 / 質問 / その他) を 1 種類推定する。
2. When 候補生成が必要となる, the Pathline Feature Extractor shall 入力テキストから希望トーン (フォーマル / カジュアル / 中立) を推定する。
3. When 候補生成が必要となる, the Pathline Feature Extractor shall 入力テキストから希望出力形式 (自由文 / 箇条書き / 表 / コード / 不明) を推定する。
4. When 入力に「簡潔に」「短く」「3行で」「N文字以内」等の長さ指定語が含まれる, the Pathline Feature Extractor shall 長さ制約特徴を `concise` として記録する。
5. When 入力に「詳しく」「丁寧に」「網羅的に」等の詳細化指定語が含まれる, the Pathline Feature Extractor shall 長さ制約特徴を `detailed` として記録する。
6. When 入力に固有名詞や英数字記号で示される対象 (URL / ファイル名 / 関数名 / 製品名と推測される語) が含まれる, the Pathline Feature Extractor shall それらを焦点候補として最大 3 件抽出する。
7. The Pathline Feature Extractor shall 抽出処理を同期かつ 5ms 以内 (1000 文字入力時) で完了する。
8. The Pathline Feature Extractor shall 入力が空または最小しきい値未満の場合は特徴量を抽出せず空集合を返す。

### Requirement 2: 動的な依頼文の組み立て
**Objective:** ユーザーとして、カテゴリ別の固定テンプレ 1 文ではなく、自分の入力内容を踏まえた具体的な依頼文を受け取りたい。LLMにそのまま投げて期待通りの出力を得るため。

#### Acceptance Criteria
1. When トップカテゴリと特徴量が確定する, the Pathline Recommendation Composer shall 「前置き / 焦点指定 / 制約句 / 出力形式句 / 締め句」の 5 部品を組み合わせて依頼文を生成する。
2. When 対象種別が `code` と推定される, the Pathline Recommendation Composer shall コードを対象とする旨を前置きに含める (例: 「以下のコード」)。
3. When 対象種別が `meeting_minutes` と推定される, the Pathline Recommendation Composer shall 議事録を対象とする旨を前置きに含める (例: 「以下の議事録」)。
4. When 焦点候補が 1 件以上抽出されている, the Pathline Recommendation Composer shall 焦点指定句に該当語を組み込む (例: 「特に X に注目して」)。
5. When 長さ制約特徴が `concise` である, the Pathline Recommendation Composer shall 出力形式句に簡潔さを示す表現を含める (例: 「簡潔に」「3行程度で」)。
6. When 長さ制約特徴が `detailed` である, the Pathline Recommendation Composer shall 出力形式句に詳細さを示す表現を含める (例: 「網羅的に」「具体例を含めて」)。
7. When 希望出力形式が `bullets` である, the Pathline Recommendation Composer shall 出力形式句に箇条書き指定を含める。
8. When 希望出力形式が `table` である, the Pathline Recommendation Composer shall 出力形式句に表形式指定を含める。
9. When カテゴリが Improve / Summarize / Clarify / Structure / Review のいずれかである, the Pathline Recommendation Composer shall 当該カテゴリの基本動詞 (改善 / 要約 / 整理 / 構造化 / レビュー) を依頼の主動詞として用いる。
10. The Pathline Recommendation Composer shall 生成文に必ずユーザー入力テキストを `---` 区切りで埋め込む。
11. If 特徴量が空集合である, then the Pathline Recommendation Composer shall MVP 同等の基本テンプレ文を出力する (後方互換動作)。

### Requirement 3: 提案品質の安定化
**Objective:** ユーザーとして、入力途中で提案文の構造や言い回しが激しく変動しないようにしたい。視覚的ノイズと認知負荷を避けるため。

#### Acceptance Criteria
1. While トップカテゴリが維持されている, the Pathline Recommendation Composer shall 同じカテゴリ内では部品構成順序 (前置き → 焦点 → 制約 → 出力形式 → 締め) を変更しない。
2. When 入力差分が部品の選択結果に影響しない範囲に収まる, the Pathline Recommendation Composer shall 直前生成文と同一の文面を返し、再描画ハッシュを変えない。
3. When 部品選択が変化した結果、文面が変わる, the Pathline Recommendation Composer shall 変化点が最小限 (1〜2部品) であるよう優先度に従って差し替える。
4. The Pathline Recommendation Composer shall 同一入力 + 同一カテゴリに対し決定論的に同一出力を返す (純関数性)。

### Requirement 4: 非機能要件の維持
**Objective:** Phase 2 でも MVP の体感速度・プライバシー・配布形態を維持したい。プロダクトの信頼性とユーザー安心感を損なわないため。

#### Acceptance Criteria
1. The Pathline Extension shall Feature Extractor + Recommendation Composer の合計処理時間を 1000 文字入力時に 10ms 以内に収める。
2. The Pathline Extension shall Phase 2 機能の追加による外部通信を一切行わない。
3. The Pathline Extension shall すべての特徴抽出・文面生成をローカル同期処理で実装する。
4. The Pathline Extension shall Manifest V3 構成と既存 `permissions` (storage のみ) を維持する。
5. The Pathline Extension shall ビルドサイズ増分を gzip 後 +3KB 以内に抑える。

### Requirement 5: 既存実装との後方互換性
**Objective:** 既存ユーザーと既存実装パイプラインに影響を与えずに Phase 2 を導入したい。リグレッションを防ぐため。

#### Acceptance Criteria
1. The Pathline Extension shall 既存 `CandidateProvider` インターフェースを変更せず、新コンポーザを `CandidateProvider` の新実装として差し替え可能とする。
2. The Pathline Extension shall 既存 ScoringEngine と CategoryStateMachine の API を変更しない。
3. When ユーザー設定 (将来) で「クラシック (固定テンプレ)」モードが選択されている, the Pathline Extension shall MVP 同等の固定テンプレ生成器を使用する。
4. The Pathline Extension shall 既存の 5 カテゴリ ID (improve / summarize / clarify / structure / review) と表示ラベルを変更しない。
5. The Pathline Extension shall 既存テスト (Phase 1 の 69 テスト) をすべて pass 状態で維持する。

### Requirement 6: 拡張性と将来対応
**Objective:** 将来の開発者として、特徴量の追加やテンプレ部品の差し替えを最小コストで行えるようにしたい。Phase 3 (AI 候補追加) でも組み合わせ可能なベースを得るため。

#### Acceptance Criteria
1. The Pathline Extension shall 特徴量定義 (Feature schema) を 1 箇所に集約し、新規特徴の追加でコンポーザ側を破壊的に書き換えない構造を提供する。
2. The Pathline Extension shall テンプレ部品 (前置き / 焦点 / 制約 / 出力形式 / 締め) をカテゴリ別の差し替え可能なデータとして保持する。
3. Where Phase 3 で AI 候補生成が追加される場合, the Pathline Extension shall ルールベース候補を即時提示しつつ非同期 AI 候補で差し替え可能な構造を許容する。
4. The Pathline Extension shall 特徴抽出器を入れ替え可能なポートとして定義する (将来の高度化に対応)。
