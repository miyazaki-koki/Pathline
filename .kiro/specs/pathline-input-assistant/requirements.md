# Requirements Document

## Project Description (Input)
Pathline - LLM入力支援Chrome拡張機能。ユーザーの雑な入力テキストをルールベースで5カテゴリ(Improve/Summarize/Clarify/Structure/Review)に分類し、LLM向けの依頼文テンプレートをインラインゴースト表示する。Tab確定、Arrow切替、Esc閉じる。textarea/contenteditable対応。Manifest V3、外部API不使用、ローカル処理のみ。体感100ms以下、候補安定性重視。

## Introduction
Pathlineは、ブラウザ上のテキスト入力欄に入力された雑なテキストから、ユーザーの意図をルールベースで推定し、LLMが理解しやすい依頼文へ収束させるChrome拡張機能である。候補は常に1つをインラインゴースト表示し、Tabで確定、矢印キーでカテゴリ切替、Escで非表示とする。MVPは外部API不使用のローカル処理に限定し、5つの意図カテゴリ(Improve/Summarize/Clarify/Structure/Review)を扱う。速度・安定性・フロー非中断を最優先とする。

## Requirements

### Requirement 1: 対象入力欄の検出と監視
**Objective:** LLMをブラウザで使うユーザーとして、一般的な入力欄で自動的にPathlineが有効化されるようにしたい。自分で設定せずに体験を得るため。

#### Acceptance Criteria
1. When ページがロードされ DOM が利用可能になる, the Pathline Content Script shall ページ内の `textarea` 要素および `contenteditable="true"` 要素を検出対象として監視を開始する。
2. When 対象入力欄が新たに DOM に追加される, the Pathline Content Script shall 動的に監視対象へ追加する。
3. When 対象入力欄がフォーカスを失う, the Pathline Content Script shall その入力欄に紐づく候補表示を非表示にする。
4. If 入力欄が `password` タイプまたは明示的に除外対象である, then the Pathline Content Script shall 当該要素の監視を行わない。
5. The Pathline Content Script shall 特定のLLMサービスに依存せず任意のWebサイトで動作する。

### Requirement 2: 入力内容に対するカテゴリスコアリング
**Objective:** ユーザーとして、自分の入力意図が自動的に適切なカテゴリに分類されるようにしたい。手動でテンプレートを選ばずに済むため。

#### Acceptance Criteria
1. When 監視対象入力欄の内容が変化する, the Pathline Scoring Engine shall 120〜200ms の debounce 後にスコアリング処理を実行する。
2. When スコアリングが実行される, the Pathline Scoring Engine shall Improve / Summarize / Clarify / Structure / Review の5カテゴリそれぞれに数値スコアを付与する。
3. When 入力文字数が 120 文字を超える, the Pathline Scoring Engine shall Summarize に +3、Structure に +1 を加算する。
4. When 入力に改行が含まれる, the Pathline Scoring Engine shall Structure に +2 を加算する。
5. When 入力に "?" または "？" が含まれる, the Pathline Scoring Engine shall Clarify に +2 を加算する。
6. When 入力に曖昧改善語(「いい感じ」「直して」「整えて」「改善」)が含まれる, the Pathline Scoring Engine shall Improve に +3 を加算する。
7. When 入力に明示キーワード「要約」が含まれる, the Pathline Scoring Engine shall Summarize に +5 を加算する。
8. When 入力に「レビュー」または「問題点」が含まれる, the Pathline Scoring Engine shall Review に +5 を加算する。
9. When 入力に「整理」または「まとめ」が含まれる, the Pathline Scoring Engine shall Structure に +4 を加算する。
10. When 入力に「どう思う」または「どうすれば」が含まれる, the Pathline Scoring Engine shall Clarify に +3 を加算する。
11. When 入力にコード記号(`{` `}` `(` `)` `;` `=` 等)が含まれる, the Pathline Scoring Engine shall Review に +3 を加算する。

### Requirement 3: カテゴリ状態の安定化
**Objective:** ユーザーとして、入力途中で候補カテゴリが頻繁に切り替わらない安定した体験をしたい。視覚的ノイズと認知負荷を避けるため。

#### Acceptance Criteria
1. While 現在のトップカテゴリが決定している, the Pathline Category State Machine shall 新カテゴリのスコア差が 2 以上、または 2 回連続で優勢となるまで現カテゴリを維持する。
2. When 明示キーワード(要約/レビュー/問題点/整理/まとめ等)を含む入力が検出される, the Pathline Category State Machine shall 安定化ルールを無視して即時にカテゴリを切り替える。
3. While カテゴリが維持されている, the Pathline Template Generator shall カテゴリは変更せず候補文面のみを洗練して更新してよい。
4. The Pathline Category State Machine shall 初期状態では最高スコアのカテゴリをトップカテゴリとする。

### Requirement 4: 候補テンプレート生成
**Objective:** ユーザーとして、決定されたカテゴリに応じた自然な依頼文テンプレートを得たい。そのままLLMに送れる品質の依頼文を得るため。

#### Acceptance Criteria
1. When トップカテゴリが Improve である, the Pathline Template Generator shall 「以下の文章を分かりやすく自然な表現に改善してください。」を基本テンプレとした候補文を生成する。
2. When トップカテゴリが Summarize である, the Pathline Template Generator shall 「以下の内容を簡潔に要約してください。」を基本テンプレとした候補文を生成する。
3. When トップカテゴリが Clarify である, the Pathline Template Generator shall 「以下の相談内容を整理し、答えやすい質問文に改善してください。」を基本テンプレとした候補文を生成する。
4. When トップカテゴリが Structure である, the Pathline Template Generator shall 「以下の内容を整理し、箇条書きで構造化してください。」を基本テンプレとした候補文を生成する。
5. When トップカテゴリが Review である, the Pathline Template Generator shall 「以下の内容をレビューし、問題点と改善案を提示してください。」を基本テンプレとした候補文を生成する。
6. The Pathline Template Generator shall 候補文にはユーザー入力テキストを区切り線(`---`)で囲んだ形で埋め込む。

### Requirement 5: インライン候補表示
**Objective:** ユーザーとして、候補が入力欄の近くに目立たず表示されるようにしたい。視線移動を最小にして入力フローを止めないため。

#### Acceptance Criteria
1. When 候補が生成される, the Pathline Inline Renderer shall 入力欄内または直下にゴースト表示または補助表示として候補文を 1 つのみ表示する。
2. While 候補が表示されている, the Pathline Inline Renderer shall 複数候補を同時並列表示しない。
3. If 同一内容の候補が再生成される, then the Pathline Inline Renderer shall 再描画を行わない。
4. If 入力テキスト長が最小しきい値(例: 4 文字)未満である, then the Pathline Inline Renderer shall 候補を表示しない。
5. The Pathline Inline Renderer shall 候補表示までの体感遅延が 100ms 前後となるよう動作する。

### Requirement 6: キーボード操作
**Objective:** ユーザーとして、マウスに持ち替えずキーボードだけで候補を確定・切替・破棄したい。入力フローを止めないため。

#### Acceptance Criteria
1. When ユーザーが候補表示中に Tab キーを押す, the Pathline Keyboard Handler shall 候補文を入力欄の内容として反映し候補表示を閉じる。
2. When ユーザーが候補表示中に ArrowDown を押す, the Pathline Keyboard Handler shall 次点カテゴリの候補に切り替えて表示する。
3. When ユーザーが候補表示中に ArrowUp を押す, the Pathline Keyboard Handler shall 前のカテゴリ候補に切り替えて表示する。
4. When ユーザーが候補表示中に Esc を押す, the Pathline Keyboard Handler shall 候補表示を閉じ、同一入力内容に対して再表示しない。
5. If 候補が表示されていない, then the Pathline Keyboard Handler shall Tab / Arrow / Esc の既定ブラウザ動作を妨げない。

### Requirement 7: 非機能要件(性能・安定性・プライバシー)
**Objective:** ユーザーとして、拡張機能が軽量で信頼でき、入力内容が外部に送られないことを保証されたい。業務や機微情報の入力でも安心して使うため。

#### Acceptance Criteria
1. The Pathline Extension shall MVP においてユーザー入力内容を外部サーバーへ送信しない。
2. The Pathline Extension shall すべての判定・テンプレ生成をローカルで同期的に完結させる。
3. While ユーザーが連続入力している, the Pathline Scoring Engine shall 差分が小さい場合は再評価をスキップする。
4. The Pathline Extension shall Chrome Extension Manifest V3 に準拠する。
5. Where ユーザー設定が保存される場合, the Pathline Extension shall ブラウザの local storage のみを使用し外部通信を行わない。

### Requirement 8: 拡張性
**Objective:** 将来の開発者として、カテゴリ・テンプレ・判定ロジックを差し替え可能な構造にしたい。Phase 2 以降の高度化に備えるため。

#### Acceptance Criteria
1. The Pathline Extension shall Scoring Engine と Category State Machine を疎結合モジュールとして実装する。
2. The Pathline Extension shall カテゴリ定義とテンプレート文面をコードから差し替え可能な構造で保持する。
3. Where 将来的に AI 候補生成が追加される場合, the Pathline Extension shall ルールベース候補を即時提示しつつ非同期候補を差し替え可能な構造を許容する。
