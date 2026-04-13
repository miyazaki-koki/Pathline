---
description: Execute spec tasks using TDD methodology
allowed-tools: Bash, Read, Write, Edit, MultiEdit, Grep, Glob, LS, WebFetch, WebSearch
argument-hint: <feature-name> [task-numbers]
---

# Implementation Task Executor

<background_information>
- **Mission**: Execute implementation tasks using Test-Driven Development methodology based on approved specifications
- **Success Criteria**:
  - All tests written before implementation code
  - Code passes all tests with no regressions
  - Tasks marked as completed in tasks.md
  - Implementation aligns with design and requirements
</background_information>

<instructions>
## Core Task
Execute implementation tasks for feature **$1** using Test-Driven Development.

## Execution Steps

### Step 1: Load Context

**Read all necessary context**:
- `.kiro/specs/$1/spec.json`, `requirements.md`, `design.md`, `tasks.md`
- **Entire `.kiro/steering/` directory** for complete project memory

**Validate approvals**:
- Verify tasks are approved in spec.json (stop if not, see Safety & Fallback)

### Step 2: Select Tasks

**Determine which tasks to execute**:
- If `$2` provided: Execute specified task numbers (e.g., "1.1" or "1,2,3")
- Otherwise: Execute all pending tasks (unchecked `- [ ]` in tasks.md)

### Step 3: Create Test List (Canon TDD)

**Before writing any code, list all behavioral scenarios for the task:**
```
┌─────────────────────────────────────────────────────────┐
│ 📝 TEST LIST - Create BEFORE coding                     │
│                                                         │
│ For each task, identify:                                │
│   □ Happy path cases (normal successful operations)     │
│   □ Edge cases (boundaries, empty inputs, limits)       │
│   □ Error cases (invalid inputs, failures, exceptions)  │
│   □ Existing behavior that must NOT break               │
└─────────────────────────────────────────────────────────┘
```

**Example Test List:**
```
Task 1.1: Create API endpoint
  □ Valid request → Success response
  □ Missing required field → Error response
  □ Duplicate data → Conflict response
  □ Without auth → Unauthorized response
  □ Existing endpoints still work
```

### Step 4: Execute with TDD

**⚠️ CRITICAL: You MUST NOT write implementation code until a failing test exists.**

```
┌─────────────────────────────────────────────────────────┐
│ 🎯 ONE TEST AT A TIME (Kent Beck's Canon TDD)           │
│                                                         │
│ Do NOT convert multiple list items to tests at once.    │
│ Complete the full cycle for ONE test before the next.   │
└─────────────────────────────────────────────────────────┘
```

For each item in the test list, follow Kent Beck's TDD cycle **strictly in order**:

```
┌─────────────────────────────────────────────────────────┐
│  🔴 RED → 🟢 GREEN → 🔵 BLUE (REFACTOR)                 │
│                                                         │
│  RED:   Define behavior (test fails)                    │
│  GREEN: Implement behavior (minimal code to pass)       │
│  BLUE:  Improve quality (refactor while staying GREEN)  │
└─────────────────────────────────────────────────────────┘
```

#### 🔴 RED - Define Behavior
```
┌─────────────────────────────────────────────────────────┐
│ 🛑 STOP: DO NOT proceed to GREEN until:                 │
│    ✓ Test file created/updated                          │
│    ✓ Test describes EXPECTED BEHAVIOR (not impl detail) │
│    ✓ Test FAILS when run (implementation doesn't exist) │
└─────────────────────────────────────────────────────────┘
```

1. **Describe behavior as a test**
   - Focus on "what should happen" (not implementation details)
   - Example: `it('should return 404 when record not found')`
   - Example: `it('should create a new item with valid input')`

2. **Run test - it MUST fail**
   - Execute: `{{TEST_COMMAND}}`
   - Confirm failure reason is "implementation doesn't exist"
   - If test passes → test or existing code is wrong

3. **Checkpoint**: State `"🔴 RED: Test for [behavior] fails as expected"`

#### 🟢 GREEN - Implement Behavior
```
┌─────────────────────────────────────────────────────────┐
│ 🛑 STOP: DO NOT proceed to BLUE until:                  │
│    ✓ Implementation code written                        │
│    ✓ Test NOW PASSES                                    │
│    ✓ Only minimal code to make THIS test pass           │
└─────────────────────────────────────────────────────────┘
```

1. **Write minimal code to pass the test**
   - Focus only on making THIS test pass
   - Avoid over-engineering
   - Don't add features not covered by tests

2. **Run test - it MUST pass**
   - Execute same test command
   - Confirm test passes

3. **Checkpoint**: State `"🟢 GREEN: [behavior] implemented and test passes"`

#### 🔵 BLUE - Improve While Staying GREEN
```
┌─────────────────────────────────────────────────────────┐
│ 🎩 TWO HATS RULE (Kent Beck)                            │
│                                                         │
│ HAT 1 (GREEN): Make it work - any code that works       │
│ HAT 2 (BLUE):  Make it right - improve structure only   │
│                                                         │
│ ⚠️ NEVER wear both hats at once!                        │
│ "Make it run, then make it right." - Kent Beck          │
└─────────────────────────────────────────────────────────┘
```

1. **Improve code quality** (wearing BLUE hat only)
   - Enhance readability
   - Remove duplication (treat as hint, not command)
   - Apply appropriate design patterns
   - Do NOT add new functionality

2. **Run tests after each change**
   - If test fails → revert immediately
   - Always keep tests GREEN

3. **Checkpoint**: State `"🔵 BLUE: Refactoring complete, tests remain GREEN"`

#### ✅ VERIFY & REPEAT
1. Run full test suite: `{{TEST_COMMAND}}`
2. All tests pass (new and existing)
3. **If more items remain in test list**: Return to 🔴 RED for next item
4. **When test list is empty**: Update checkbox `- [ ]` → `- [x]` in tasks.md
5. State: `"✅ COMPLETE: Task X.X (N tests added)"`

### TDD Exceptions (Use Sparingly)

**When TDD is difficult** (UI components, integrations):
- Write implementation first, BUT immediately write tests after
- State explicitly: `"⚠️ TDD Exception: [reason]. Adding tests after implementation."`
- Tests are still MANDATORY, just order is flexible

```
┌─────────────────────────────────────────────────────────┐
│ ⚠️ TDD EXCEPTION RULES                                  │
│                                                         │
│ Even with TDD Exception, you MUST:                      │
│                                                         │
│ 1. Output: "⚠️ TDD Exception: [specific reason]"        │
│                                                         │
│ 2. IMMEDIATELY after implementation, write tests:       │
│    - Show actual test code (not just "tests added")     │
│    - Run the tests and output results                   │
│                                                         │
│ 3. Output: "🧪 Tests added: [test names]"               │
│    - List each test that was added                      │
│    - Show test execution results                        │
│                                                         │
│ ❌ NOT ALLOWED:                                         │
│    - "TDD Exception" without writing tests              │
│    - Skipping test execution after implementation       │
│    - Marking task complete without test proof           │
└─────────────────────────────────────────────────────────┘
```

**Valid TDD Exception Example:**
```
⚠️ TDD Exception: Configuration is declarative and difficult to unit test.

[Implementation code...]

🧪 Tests added:
- `handleActionPress calls handler with correct params`
- `Component receives param correctly`

Test execution:
$ {{TEST_COMMAND}}
PASS tests
  ✓ handleActionPress calls handler with correct params
```

### Common TDD Mistakes to Avoid (Kent Beck)

```
┌─────────────────────────────────────────────────────────┐
│ ❌ MISTAKES DURING RED                                  │
│    - Writing tests without assertions                   │
│    - Converting entire test list to tests at once       │
│    - Skipping the "test must fail" verification         │
│                                                         │
│ ❌ MISTAKES DURING GREEN                                │
│    - Making test pass by hardcoding expected values     │
│    - Mixing refactoring with making tests pass          │
│    - Copying computed values into expected assertions   │
│                                                         │
│ ❌ MISTAKES DURING BLUE                                 │
│    - Over-refactoring beyond current needs              │
│    - Premature abstraction                              │
│    - Adding new functionality (wear GREEN hat instead)  │
└─────────────────────────────────────────────────────────┘
```

## Critical Constraints

### 🚨 TDD is NON-NEGOTIABLE

- **TDD Order Enforcement**: Strictly follow Step 4 の 🔴 RED → 🟢 GREEN → 🔵 BLUE cycle
- **No Implementation Without Test**: Writing `.ts` before `.test.ts` fails is prohibited
- **Task Scope**: Implement only what the specific task requires
- **No Regressions**: Existing tests must continue to pass
- **Design Alignment**: Implementation must follow design.md specifications
- **Steering Alignment**: Apply domain-specific standards from `.kiro/steering/`

### 🔒 Checkpoint Output is MANDATORY

**Step 4で定義された各フェーズのCheckpoint出力は省略不可:**

- **No silent implementation**: `🔴 RED:` checkpoint を出力せずにコードを書くことは禁止
- **Checkpoint is proof**: Checkpoint出力がTDD遵守の証拠となる
- **TDD Exception also requires checkpoint**: TDD Exceptionを使う場合も `⚠️ TDD Exception:` を出力し、その後テストコードを示すこと

### 🧪 Test Suite Execution is MANDATORY

**Step 4のテスト実行に加え、以下のタイミングでのテスト実行を必須とする:**

| タイミング | 実行内容 | 出力 |
|-----------|---------|------|
| タスク開始前 | フルテストスイート実行、ベースライン記録 | `📋 Baseline: X tests passing` |
| タスク完了時 | フルテストスイート実行、リグレッション確認 | `✅ COMPLETE: X tests passing (Y new)` |

- **Baseline required**: コード変更前に現在のテスト数を記録
- **No silent completion**: フルテストスイートがパスするまでタスク完了とみなさない
- **Regression check**: 最終テスト実行でパス数が減少していないことを確認
</instructions>

## Tool Guidance
- **Read first**: Load all context before implementation
- **Test first**: Write tests before code
- Use **WebSearch/WebFetch** for library documentation when needed

## Output Description

Provide brief summary in the language specified in spec.json:

1. **Tasks Executed**: Task numbers and test results
2. **Status**: Completed tasks marked in tasks.md, remaining tasks count

**Format**: Concise (under 150 words)

## Safety & Fallback

### Error Scenarios

**Tasks Not Approved or Missing Spec Files**:
- **Stop Execution**: All spec files must exist and tasks must be approved
- **Suggested Action**: "Complete previous phases: `/kiro:spec-requirements`, `/kiro:spec-design`, `/kiro:spec-tasks`"

**Test Failures**:
- **Stop Implementation**: Fix failing tests before continuing
- **Action**: Debug and fix, then re-run

**TDD Order Violation**:
- **Self-Check**: If you wrote implementation before test, STOP
- **Corrective Action**:
  1. Delete or revert the implementation code
  2. Write the test first
  3. Confirm test fails
  4. Then re-implement
- **Report**: State "TDD violation detected. Writing test first."

### Task Execution

**Execute specific task(s)**:
- `/kiro:spec-impl $1 1.1` - Single task
- `/kiro:spec-impl $1 1,2,3` - Multiple tasks

**Execute all pending**:
- `/kiro:spec-impl $1` - All unchecked tasks

think
