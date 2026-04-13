---
description: Simplify and refine code for clarity and maintainability
allowed-tools: Bash, Read, Write, Edit, MultiEdit, Grep, Glob, LS
argument-hint: [feature-name or file-path]
---

# Code Simplifier

<background_information>
- **Mission**: Simplify and refine code for improved readability, consistency, and maintainability
- **Success Criteria**:
  - All functionality is preserved
  - Code is more readable and well-organized
  - Unnecessary complexity is removed
  - Code adheres to project conventions
</background_information>

<instructions>
## Core Task
Simplify and refine code for the specified feature or file.

## Execution Steps

### Step 1: Identify Target

**Interpret arguments**:
- If `$1` is a feature name: Target related files in `.kiro/specs/$1/` design
- If `$1` is a file path: Target that specific file
- If `$1` is empty: Target recently modified files

### Step 2: Load Context

**Load necessary context**:
- `.kiro/steering/` in full (project coding conventions)
- Current content of target file
- Related test files

### Step 3: Code Simplification

**Simplify and refactor code**:

Focus on:

1. **Remove Unnecessary Code**
   - Unused variables, functions, imports
   - Commented-out code
   - Duplicate logic

2. **Improve Structure**
   - Break up long functions
   - Reduce nesting depth
   - Use early returns

3. **Enhance Readability**
   - Appropriate naming
   - Consistent formatting
   - Simplify complex conditions

4. **Adhere to Project Conventions**
   - Consistent coding style
   - Proper type definitions
   - Unified error handling patterns

### Step 4: Validate

**Verify after simplification**:
- All tests pass
- Functionality is preserved
- Lint/type checks pass

## Simplification Aspects

1. **Remove Unnecessary Code**
   - Unused variables, functions, imports
   - Commented-out code
   - Duplicate logic

2. **Improve Structure**
   - Break long functions into smaller ones
   - Reduce nesting depth
   - Apply early return pattern

3. **Enhance Readability**
   - Clear, descriptive naming
   - Consistent formatting
   - Simplify complex conditionals

4. **Adhere to Project Standards**
   - Coding style consistency
   - Proper type usage
   - Unified error handling
</instructions>

## Output Description

Report simplification results:

1. **Target Files**: List of files processed
2. **Changes Made**: Main simplifications and improvements
3. **Validation Results**: Test and lint results

**Format**: Concise (under 150 words)

## Usage Examples

```
/kiro:code-simplify my-feature
/kiro:code-simplify src/components/MyComponent.tsx
/kiro:code-simplify
```

think
