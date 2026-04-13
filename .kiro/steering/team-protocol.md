# Team Protocol & Organization

## Hierarchical Agent Structure

All development follows a hierarchical structure ensuring clarity, efficiency, and quality:

```
User (Owner/Product Manager)
    ↓
Team Lead (AI Agent coordinating work)
    ↓
Engineers (Implementation agents)
```

### Roles & Responsibilities

#### User / Owner
- **Authority**: Final decision-maker on requirements and priorities
- **Responsibilities**:
  - Define and validate requirements
  - Approve designs and technical decisions
  - Review and merge completed work
  - Resolve blocking issues

#### Team Lead
- **Authority**: Coordinate work, enforce standards, and resolve conflicts
- **Responsibilities**:
  - Decompose requirements into implementation tasks
  - Assign tasks to engineers
  - Maintain code quality standards
  - Enforce TDD discipline
  - Review designs and implementations
  - Unblock engineers when needed
  - Report progress to User

#### Engineers
- **Authority**: Implementation autonomy within assigned scope
- **Responsibilities**:
  - Write code following TDD practices
  - Implement assigned tasks completely
  - Execute tests and validate coverage
  - Request review when task complete
  - Communicate blockers to Team Lead

## Test-Driven Development (TDD) Enforcement

### TDD Philosophy

All development follows Test-Driven Development (TDD) discipline:

1. **RED**: Write failing tests first (test scenarios from task definition)
2. **GREEN**: Write minimal code to pass tests
3. **REFACTOR**: Improve code while keeping tests green

### TDD Requirements

- ✓ **Tests defined before code**: Every task includes test scenarios
- ✓ **No code without tests**: Code committed without tests is rejected
- ✓ **Red-Green-Refactor cycle**: Follow TDD pattern strictly
- ✓ **Coverage maintained**: New code maintains {{COVERAGE_TARGET}}% coverage
- ✓ **All test types**: Unit, Integration, and E2E tests required
- ✓ **Tests pass locally**: Engineer must run {{TEST_COMMAND}} before submitting

### Test Execution Checklist

Before marking a task complete:

```
- [ ] Written unit tests for new functions/methods
- [ ] Written integration tests for API/service interactions
- [ ] All tests pass locally: {{TEST_COMMAND}}
- [ ] Coverage meets {{COVERAGE_TARGET}}% requirement
- [ ] Test names are descriptive (should... when...)
- [ ] Edge cases and error paths tested
- [ ] No flaky or skipped tests
- [ ] Mock fixtures match real data patterns
```

## Task Completion & Gating

### Completion Criteria

A task is **ONLY** considered complete when:

1. **Implementation Complete**
   - All functionality implemented as specified
   - Code follows project standards and conventions
   - No placeholder code or TODOs left

2. **Tests Pass**
   - All unit tests passing
   - All integration tests passing
   - Coverage meets {{COVERAGE_TARGET}}% minimum
   - No flaky tests

3. **Code Review Approved**
   - Team Lead reviews and approves
   - Design follows architectural boundaries
   - Error handling implemented
   - No security or performance issues

4. **Documentation Updated**
   - Comments added for complex logic
   - Type definitions clear and complete
   - README/docs updated if applicable

### Task Submission

When submitting a task for review:

```
- [ ] {{TEST_COMMAND}} passes locally
- [ ] Coverage: {{COVERAGE_TARGET}}% or higher
- [ ] Code follows naming conventions
- [ ] No TypeScript errors
- [ ] {{LINT_COMMAND}} passes
- [ ] {{FORMAT_COMMAND}} completes
- [ ] All test scenarios from task definition covered
- [ ] Branch ready for review
```

### Review Gates

**Team Lead must verify**:
- [ ] Tests cover all scenarios from task definition
- [ ] Implementation matches design.md specifications
- [ ] No circular dependencies introduced
- [ ] Error handling follows project standards
- [ ] Performance acceptable for acceptance criteria
- [ ] Security concerns addressed
- [ ] Code is maintainable and readable

**Rejection Criteria** (Task sent back to engineer):
- ❌ Tests don't pass or coverage below {{COVERAGE_TARGET}}%
- ❌ Test scenarios from task definition not covered
- ❌ Code violates architectural boundaries
- ❌ Error handling incomplete
- ❌ Documentation missing or outdated

## Communication Protocol

### Daily Standup (if team-based)

Format: Status, Blockers, Help Needed

```
Engineer A:
  Status: Completed user authentication service (Task 2.1)
  Tests: 12 unit tests, 4 integration tests, 95% coverage ✓
  Blockers: None
  Next: Working on password reset flow (Task 2.2)

Engineer B:
  Status: In progress on email validation
  Tests: Red phase - wrote 8 test scenarios
  Blockers: Need clarification on acceptance criteria for invalid domains
  Next: Implement green phase after Team Lead clarifies
```

### Blocking Issues

When blocked:

1. **Document the issue**: What's blocking, what was tried
2. **Request help**: Tag Team Lead with specific question
3. **Propose solutions**: Suggest alternatives or next steps
4. **Wait for unblock**: Don't work around; wait for decision

### Code Review Comments

- **For rejections**: Explain **why** it doesn't meet standards (reference this doc)
- **For requests**: Be specific about what needs to change
- **For approval**: Note what was good

Example:
```
Review Comment:
❌ Tests for error handling incomplete
   Task definition specifies 3 error scenarios:
   - Invalid email format
   - Duplicate user exists
   - Database connection error
   
   Only found tests for first 2. Please add test for DB error case.
   Reference: testing.md - Test Scenarios Required section
```

## Architectural Boundaries

### Domain Isolation

Teams own clear domain boundaries:

```
User Interface Domain
    ↓ (Public API contract)
Business Logic Domain
    ↓ (Public API contract)
Data/Repository Domain
```

### Boundary Rules

- ✓ **Unidirectional imports**: Inner layers don't import outer layers
- ✓ **Well-defined interfaces**: All boundaries have explicit contracts
- ✓ **No circular dependencies**: Use dependency inversion if needed
- ✓ **Test at boundaries**: Integration tests verify contracts

### Parallel Development

Tasks can run in parallel when:
- Different architectural domains
- No shared database operations
- Clear interfaces between them
- No merge conflicts expected

Teams coordinate on:
- Interface contracts (API signatures, data formats)
- Data schema changes
- Shared service modifications
- Performance-critical code

## Code Quality Standards

### Linting & Formatting

**Before submitting code**:

```bash
{{LINT_COMMAND}}  # Fix any style issues
{{FORMAT_COMMAND}}  # Auto-format code
```

Violations block code review until fixed.

### Type Safety

- ✓ No `any` types without documented justification
- ✓ All function parameters typed
- ✓ All return types specified
- ✓ All external API data types defined
- ✓ Run {{TYPE_CHECK}} locally before submitting

### Naming Conventions

Follow project standards from `.kiro/steering/structure.md`:

| Type | Convention | Enforced |
|------|-----------|----------|
| Files | camelCase or PascalCase | {{LINT_COMMAND}} |
| Classes | PascalCase | {{LINT_COMMAND}} |
| Functions | camelCase | {{LINT_COMMAND}} |
| Constants | UPPER_SNAKE_CASE | {{LINT_COMMAND}} |
| Booleans | is/has/can prefix | Code review |

### Performance Standards

<!-- TODO: Define performance expectations -->

- API response time target: {{API_TARGET_TIME}}ms
- Bundle size limit: {{BUNDLE_SIZE_LIMIT}}KB
- First contentful paint target: {{FCP_TARGET}}s
- Test execution time: {{TEST_TIME_LIMIT}}s for unit tests

## Escalation & Conflict Resolution

### Issue Escalation Path

1. **Between Engineers**: Direct discussion
2. **Design Conflict**: Team Lead decision
3. **Policy Violation**: Team Lead enforces
4. **Blocked by User**: Team Lead escalates to User
5. **Architectural Change**: User approval required

### Unresolved Disagreements

- Team Lead mediates technical disagreements
- User makes final decisions on requirements
- Decisions are documented with rationale
- No work proceeds without agreement

## Performance Management

### Task Assignment

- **Fair distribution**: Balance workload across team
- **Growth opportunities**: Assign challenging tasks
- **Mentoring**: Senior engineers support junior engineers

### Evaluation Criteria

Engineers are evaluated on:

1. **Code Quality**
   - Tests pass consistently
   - Code follows standards
   - Coverage maintained

2. **Task Completion**
   - Tasks completed on time
   - No quality shortcuts
   - Blocker communication

3. **Collaboration**
   - Peer code reviews helpful
   - Clear communication
   - Willing to help team

4. **Learning & Growth**
   - Improving skills
   - Asking good questions
   - Contributing ideas

## Firing Rules

Engineer is removed from project if:

1. **TDD Discipline Broken**
   - Consistently shipping code without tests
   - Coverage below {{COVERAGE_TARGET}}% after warnings
   - Ignoring test failures

2. **Quality Standards Violated**
   - Code with security vulnerabilities after warnings
   - Circular dependencies introduced
   - No error handling despite feedback

3. **Communication Failure**
   - Blocking issues not reported
   - Refusing to incorporate feedback
   - Hostile or uncooperative behavior

4. **Repeated Task Rejection**
   - More than 3 rejections for same issue
   - Ignoring documented standards
   - Unwillingness to learn

### Process

1. **First Offense**: Formal warning, expectations clarified
2. **Second Offense**: Put on probation, daily check-ins
3. **Third Offense**: Removed from project

## Documentation & Knowledge

### Code Comments

- Comment **why**, not **what**
- Explain complex algorithms
- Document workarounds and hacks
- Reference external documentation

### Architecture Decisions

- Record in `.kiro/specs/research.md`
- Include: Decision, alternatives, rationale, impacts
- Make decisions visible to team

### Knowledge Sharing

- Pair programming on complex tasks
- Design reviews before implementation
- Post-mortems on production issues
- Documentation updates for patterns

## Continuous Improvement

### Retrospectives

Monthly or after major feature:

- What went well?
- What could improve?
- Action items for next period
- Document in project notes

### Standard Evolution

Standards can change when:
- User requests improvement
- Team consensus for change
- Feedback shows standard not working
- Technology landscape shifts

Changes must be:
- Documented with rationale
- Applied to future tasks
- Backfilled in critical code (optional)
- Communicated to all team members
