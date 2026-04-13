# Task Generation Rules

## Core Principles

### 1. Natural Language Descriptions
Focus on capabilities and outcomes, not code structure.

**Describe**:
- What functionality to achieve
- Business logic and behavior
- Features and capabilities
- Domain language and concepts
- Data relationships and workflows

**Avoid**:
- File paths and directory structure
- Function/method names and signatures
- Type definitions and interfaces
- Class names and API contracts
- Specific data structures

**Rationale**: Implementation details (files, methods, types) are defined in design.md. Tasks describe the functional work to be done.

### 2. Task Integration & Progression

**Every task must**:
- Build on previous outputs (no orphaned code)
- Connect to the overall system (no hanging features)
- Progress incrementally (no big jumps in complexity)
- Validate core functionality early in sequence
- Respect architecture boundaries defined in design.md (Architecture Pattern & Boundary Map)
- Honor interface contracts documented in design.md
- Use major task summaries sparingly—omit detail bullets if the work is fully captured by child tasks.

**End with integration tasks** to wire everything together.

### 3. Flexible Task Sizing

**Guidelines**:
- **Major tasks**: As many sub-tasks as logically needed (group by cohesion)
- **Sub-tasks**: 1-3 hours each, 3-10 details per sub-task
- Balance between too granular and too broad

**Don't force arbitrary numbers** - let logical grouping determine structure.

### 4. Requirements Mapping

**End each task detail section with**:
- `_Requirements: X.X, Y.Y_` listing **only numeric requirement IDs** (comma-separated). Never append descriptive text, parentheses, translations, or free-form labels.
- For cross-cutting requirements, list every relevant requirement ID. All requirements MUST have numeric IDs in requirements.md. If an ID is missing, stop and correct requirements.md before generating tasks.
- Reference components/interfaces from design.md when helpful (e.g., `_Contracts: AuthService API`)

### 5. Code-Only Focus

**Include ONLY**:
- Coding tasks (implementation)
- Testing tasks (unit, integration, E2E)
- Technical setup tasks (infrastructure, configuration)

**Exclude**:
- Deployment tasks
- Documentation tasks
- User testing
- Marketing/business activities

### 6. Domain-Specific Standards

**When generating tasks, consider domain-specific standards from `.kiro/steering/`**:

<!-- TODO: Customize this table for your project domains -->

| Domain | Steering File | Task Considerations |
|--------|---------------|---------------------|
| **Architecture** | `tech.md` | Technology selections, library patterns, version compatibility |
| **Project Structure** | `structure.md` | File organization, module patterns, naming conventions |
| **UI/Design** | `design.md` | Component patterns, accessibility, responsive design |
| **Testing** | `testing.md` | Test framework, coverage requirements, test patterns |

**Consult steering files when generating tasks** to ensure generated work aligns with project standards and conventions.

### 7. TDD-Ready Task Definitions (Canon TDD)

**Every implementation task MUST include test scenarios** to enable Test-Driven Development:

```
┌─────────────────────────────────────────────────────────┐
│ 📝 TEST SCENARIOS - Required for each task             │
│                                                         │
│ Each task should define:                                │
│   ✓ Happy path (expected successful behavior)          │
│   ✓ Edge cases (boundaries, empty, limits)             │
│   ✓ Error cases (invalid input, failures)              │
└─────────────────────────────────────────────────────────┘
```

**Task Format with Test Scenarios**:
```markdown
- [ ] 1.1 Create customer registration API
  - Accept customer data and persist to database
  - Return created customer with generated ID
  - **Test scenarios**:
    - ✓ Valid data → 201 Created with customer object
    - ✓ Missing required field → 400 Bad Request
    - ✓ Duplicate email → 409 Conflict
    - ✓ Unauthorized request → 401 Unauthorized
  - _Requirements: 1.1, 1.2_
```

**Rationale**: Test scenarios defined at task generation enable:
- Implementers to write tests FIRST (RED phase)
- Clear acceptance criteria for task completion
- Behavioral focus over implementation details

### Mandatory Test Coverage

Every feature implementation MUST include test tasks. Test tasks are NOT optional.

**Required Test Tasks**:
1. **Unit Tests** (required)
   - Individual functions, methods, components
   - Happy path, edge cases, error cases coverage

2. **Integration Tests** (required)
   - API integration, Repository/Service layer tests
   - Cross-component interaction tests

3. **E2E Tests** (specification only, code optional)
   - Full user flow scenario tests
   - Document steps and expected results

4. **Manual Tests** (specification required)
   - UI/UX visual confirmation items
   - Browser/device compatibility
   - Document checklist and expected results

**Task Format for Tests**:
```markdown
- [ ] X. Test Implementation
- [ ] X.1 Unit Tests
  - Target: [feature/module name]
  - Coverage: happy path, error cases, edge cases
  - _Requirements: X.X_

- [ ] X.2 Integration Tests
  - Target: [integration points]
  - Coverage: API integration, data flow
  - _Requirements: X.X_

- [ ] X.3 E2E/Manual Test Specification
  - E2E scenarios: [user flows]
  - Manual checklist: [confirmation items]
  - _Requirements: X.X_
```

## Task Hierarchy Rules

### Maximum 2 Levels
- **Level 1**: Major tasks (1, 2, 3, 4...)
- **Level 2**: Sub-tasks (1.1, 1.2, 2.1, 2.2...)
- **No deeper nesting** (no 1.1.1)
- If a major task would contain only a single actionable item, collapse the structure and promote the sub-task to the major level (e.g., replace `1.1` with `1.`).
- When a major task exists purely as a container, keep the checkbox description concise and avoid duplicating detailed bullets—reserve specifics for its sub-tasks.

### Sequential Numbering
- Major tasks MUST increment: 1, 2, 3, 4, 5...
- Sub-tasks reset per major task: 1.1, 1.2, then 2.1, 2.2...
- Never repeat major task numbers

### Parallel Analysis (default)
- Assume parallel analysis is enabled unless explicitly disabled (e.g. `--sequential` flag).
- Identify tasks that can run concurrently when **all** conditions hold:
  - No data dependency on other pending tasks
  - No shared file or resource contention
  - No prerequisite review/approval from another task
- Validate that identified parallel tasks operate within separate boundaries defined in the Architecture Pattern & Boundary Map.
- Confirm API/event contracts from design.md do not overlap in ways that cause conflicts.
- Append `(P)` immediately after the task number for each parallel-capable task:
  - Example: `- [ ] 2.1 (P) Build background worker`
  - Apply to both major tasks and sub-tasks when appropriate.
- If sequential mode is requested, omit `(P)` markers entirely.
- Group parallel tasks logically (same parent when possible) and highlight any ordering caveats in detail bullets.
- Explicitly call out dependencies that prevent `(P)` even when tasks look similar.

### Checkbox Format
```markdown
- [ ] 1. Major task description
- [ ] 1.1 Sub-task description
  - Detail item 1
  - Detail item 2
  - _Requirements: X.X_

- [ ] 1.2 Sub-task description
  - Detail items...
  - _Requirements: Y.Y_

- [ ] 1.3 Sub-task description
  - Detail items...
  - _Requirements: Z.Z, W.W_

- [ ] 2. Next major task (NOT 1 again!)
- [ ] 2.1 Sub-task...
```

## Requirements Coverage

**Mandatory Check**:
- ALL requirements from requirements.md MUST be covered
- Cross-reference every requirement ID with task mappings
- If gaps found: Return to requirements or design phase
- No requirement should be left without corresponding tasks

Use `N.M`-style numeric requirement IDs where `N` is the top-level requirement number from requirements.md (for example, Requirement 1 → 1.1, 1.2; Requirement 2 → 2.1, 2.2), and `M` is a local index within that requirement group.

Document any intentionally deferred requirements with rationale.
