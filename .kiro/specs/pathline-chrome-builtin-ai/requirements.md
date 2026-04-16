# Requirements Document

## Project Description (Input)
Chrome Built-in AI (Prompt API / LanguageModel) を使った非同期LLM候補生成を追加する Phase 3a。ルールベース候補を即時表示しつつ、Chrome Built-in AI が利用可能なら高品質候補を非同期で生成してゴーストを差し替える2層構造を実現する。Chrome 138+ の window.ai / LanguageModel API を利用。多言語 (日英中) 対応、完全ローカル処理 (外部通信なし)、既存 CandidateProvider のPromise戻り対応済構造を活用。利用不可環境 (未対応ブラウザ / モデル未DL) ではルールベースにフォールバック。backend は不要。体感速度を損なわないよう、LLM 生成は 2 秒タイムアウトでキャンセル可能。Phase 3b (WebLLM + Qwen2.5) は別スペックで後続。

## Introduction
Pathline Phase 3a として、Chrome Built-in AI (Prompt API / LanguageModel API) を用いた高品質 LLM 候補生成を追加する。Phase 2 のルールベース候補 (`FlexibleCandidateProvider`) を即時 (~20ms) に表示したうえで、Chrome Built-in AI が使える環境では同一入力に対する LLM 候補を **バックグラウンドで非同期生成し、同じゴースト表示を差し替える** 2 層構造で動作する。完全ローカル処理でプライバシーを維持しつつ、日英中の多言語で自然な依頼文を得る。Chrome Built-in AI が利用不可な環境 (未対応ブラウザ、モデル未 DL、ハードウェア要件未満) では Phase 2 動作のまま継続する。

## Requirements

### Requirement 1: Chrome Built-in AI 利用可否の判定
**Objective:** ユーザーとして、自分の環境で Chrome Built-in AI が使えるかを意識せず、使える場合は自動で高品質候補を受け取りたい。使えないときもルールベース体験が崩れないで済むため。

#### Acceptance Criteria
1. When Content Script が bootstrap される, the Pathline LLM Capability Detector shall `window.ai` および `LanguageModel` グローバル (Chrome の Prompt API) の存在を確認する。
2. When API の存在が確認できる, the Pathline LLM Capability Detector shall API の `availability()` 相当メソッドを呼び出し `available` / `downloadable` / `downloading` / `unavailable` の可用性ステータスを取得する。
3. If API が存在しない, then the Pathline LLM Capability Detector shall 可用性ステータスを `unavailable` として記録し以降 LLM 経路を使用しない。
4. If `availability()` 取得中に例外が発生する, then the Pathline LLM Capability Detector shall 可用性ステータスを `unavailable` として扱い警告ログのみ出力する。
5. The Pathline LLM Capability Detector shall 判定結果をセッション内キャッシュし、入力欄単位で毎回問い合わせない。

### Requirement 2: LLM 候補の非同期生成
**Objective:** ユーザーとして、入力に対して Chrome Built-in AI が生成した自然で文脈に沿った依頼文を得たい。ルールベースよりさらに質の高いプレビューを得るため。

#### Acceptance Criteria
1. When ルールベース候補が描画され、可用性ステータスが `available` である, the Pathline LLM Provider shall 同じ入力テキストとカテゴリに対する LLM 候補の非同期生成を開始する。
2. When LLM 候補生成が成功する, the Pathline LLM Provider shall 生成結果 `Candidate` を返却し、呼び出し元に差替えを許す。
3. When 可用性ステータスが `downloadable` または `downloading` である, the Pathline LLM Provider shall LLM 候補生成を試みず、ルールベース候補のまま維持する (Phase 3a 範囲では DL 起動しない)。
4. The Pathline LLM Provider shall 生成リクエストにおいてカテゴリ別のシステムプロンプトを用いて依頼文として妥当な出力を指示する。
5. The Pathline LLM Provider shall 入力テキストを `---` 区切りで埋め込んだユーザープロンプトで LLM に渡す。
6. The Pathline LLM Provider shall 生成出力に `---` 区切りを含まない場合、ルールベース形式に合わせて出力文末に `\n---\n{input}\n---` を自動付加する。
7. The Pathline LLM Provider shall 生成出力の先頭に LLM が付けがちな前置き語 (「こちらが」「以下が改善案」等) を検出し除去する。

### Requirement 3: タイムアウトとキャンセル
**Objective:** ユーザーとして、LLM の生成が遅いときでも入力体験が詰まらないようにしたい。ゴーストが長時間更新されず待たされるストレスを避けるため。

#### Acceptance Criteria
1. When LLM 候補生成が開始される, the Pathline LLM Provider shall 2000ms のタイムアウトを設定する。
2. If タイムアウトに達する, then the Pathline LLM Provider shall 進行中の生成を中断し (AbortSignal 等)、ルールベース候補のまま維持する。
3. When 同一入力欄に対する新しい入力が発生し再評価が走る, the Pathline LLM Provider shall 進行中の旧 LLM 生成リクエストを中断する。
4. When 入力欄が blur される, the Pathline LLM Provider shall 当該入力欄に紐づく進行中 LLM 生成を中断する。
5. If LLM 生成が例外を投げる, then the Pathline LLM Provider shall エラーをログ出力し、ルールベース候補を最終結果として維持する。

### Requirement 4: 2 層ゴースト差替え
**Objective:** ユーザーとして、最初にルールベース候補がすぐ見え、少し後に LLM 候補に差し替わる流れを自然に体験したい。体感速度を損なわずに品質向上を得るため。

#### Acceptance Criteria
1. When ルールベース候補が生成される, the Pathline Controller shall 100ms 以内にゴースト表示へ反映する (Phase 1/2 挙動を維持)。
2. When LLM 候補が利用可能として返却される, the Pathline Controller shall 当該入力欄のゴースト表示を LLM 候補に差し替える。
3. If LLM 候補のハッシュがルールベース候補のハッシュと同一である, then the Pathline Controller shall 差替えを行わない (再描画抑止)。
4. When LLM 候補差替え後にユーザーが ArrowDown / ArrowUp で cycle する, the Pathline Controller shall 新しいカテゴリに対してもルールベース → LLM の 2 層差替えを再実行する。
5. When LLM 候補差替え後にユーザーが Tab で確定する, the Pathline Controller shall 差替え済みの LLM 候補 (表示中のもの) を入力欄に反映する。
6. When LLM 候補差替え後にユーザーが Esc で dismiss する, the Pathline Controller shall 進行中 LLM 生成を中断し既存 dismiss 挙動を踏襲する。

### Requirement 5: プライバシーと非機能要件
**Objective:** ユーザーとして、Built-in AI 経由でも入力が外部に送信されない保証と、拡張機能の軽量性を維持したい。安心して業務入力にも使えるため。

#### Acceptance Criteria
1. The Pathline Extension shall Phase 3a 機能追加に伴う外部通信を一切行わない。
2. The Pathline Extension shall LLM 候補生成時のシステムプロンプト・ユーザープロンプトをコンソール以外に漏出しない。
3. The Pathline Extension shall Chrome Built-in AI セッションを入力欄単位で生成せず、カテゴリ別に再利用してメモリ・初期化コストを抑える。
4. The Pathline Extension shall LLM 機能追加による gzip バンドルサイズ増分を +2KB 以内に抑える。
5. The Pathline Extension shall Manifest V3 構成と既存 `permissions` を維持する (新規パーミッション追加は行わない)。

### Requirement 6: 多言語対応
**Objective:** ユーザーとして、日本語に限らず英語・中国語での入力でも高品質な依頼文を得たい。業務・学習で多言語を扱う場面をカバーするため。

#### Acceptance Criteria
1. When 入力テキストの主要言語が日本語と判定される, the Pathline LLM Provider shall 日本語向けのシステムプロンプトで候補を生成する。
2. When 入力テキストの主要言語が英語と判定される, the Pathline LLM Provider shall 英語向けのシステムプロンプトで候補を生成する。
3. When 入力テキストの主要言語が中国語と判定される, the Pathline LLM Provider shall 中国語向けのシステムプロンプトで候補を生成する。
4. If 主要言語判定が不可能または対応外言語である, then the Pathline LLM Provider shall 既定で日本語プロンプトを用い LLM に入力言語への追従を指示する。
5. The Pathline LLM Provider shall 生成された候補が入力言語と著しく異なる場合 (例: 日本語入力に英語応答) に検知し、ルールベース候補へフォールバックする。

### Requirement 7: ユーザー設定による LLM 有効/無効化
**Objective:** ユーザーとして、LLM 候補が好みに合わない場合やバッテリー節約のため、機能を無効化できるようにしたい。自分の利用状況に合わせて選べるため。

#### Acceptance Criteria
1. The Pathline Extension shall `chrome.storage.local` に `llm: "auto" | "off"` 設定を読み書きする。
2. When 設定が `auto` である, the Pathline Controller shall Chrome Built-in AI が `available` な場合に LLM 候補生成を有効化する。
3. When 設定が `off` である, the Pathline Controller shall LLM 候補生成を一切行わない。
4. When 設定が未定義または不正値である, the Pathline Controller shall 既定を `auto` として扱う。
5. When 設定が `auto` → `off` に変更される, the Pathline Controller shall 進行中の LLM 生成を中断する。

### Requirement 8: 既存実装との後方互換性
**Objective:** 既存 Phase 1/2 のユーザー体験と実装に影響を与えずに Phase 3a を導入したい。リグレッションを防ぐため。

#### Acceptance Criteria
1. The Pathline Extension shall Chrome Built-in AI が `unavailable` の環境で Phase 2 の挙動を維持する。
2. The Pathline Extension shall 既存 Phase 1/2 のテスト (合計 124 件) を全て pass 状態で維持する。
3. The Pathline Extension shall 既存 `CandidateProvider` インターフェースを変更せず、新プロバイダを差し替え可能な形で実装する。
4. The Pathline Extension shall 既存 `GhostRenderer` の再描画抑止 (hash dirty check) をそのまま利用する。
5. The Pathline Extension shall 既存 `classic` / `flexible` モード切替に加え、LLM 有効化を直交する独立スイッチとして扱う。
