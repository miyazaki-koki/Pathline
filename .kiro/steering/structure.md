# Project Structure & Organization

## Overview

This document defines the directory structure, file organization, and code organization principles for {{PROJECT_NAME}}.

## Directory Structure

### Root Level

```
{{PROJECT_NAME}}/
├── .kiro/                    # AI/Agent coordination files (not deployed)
├── .github/                  # GitHub specific files
├── src/                      # Source code
├── tests/                    # Test files
├── public/                   # Static assets
├── dist/                     # Build output (generated, not committed)
├── node_modules/             # Dependencies (generated, not committed)
├── package.json              # Project metadata and dependencies
├── tsconfig.json             # TypeScript configuration
├── {{CONFIG_FILES}}          # Other configuration files
├── README.md                 # Project documentation
└── LICENSE                   # License file
```

### Source Code Organization

<!-- TODO: Define src/ directory structure -->

```
src/
├── {{DOMAIN_1}}/             # Feature/domain directory
│   ├── components/           # Domain-specific components
│   ├── services/             # Domain-specific services
│   ├── types/                # Domain-specific types
│   ├── hooks/                # Domain-specific hooks
│   └── index.ts              # Public API exports
│
├── {{DOMAIN_2}}/             # Another feature/domain
│   ├── ...
│
├── shared/                   # Cross-cutting concerns
│   ├── components/           # Reusable UI components
│   ├── utils/                # Utility functions
│   ├── types/                # Common type definitions
│   ├── hooks/                # Reusable hooks
│   ├── services/             # Shared services
│   └── constants/            # Constants used across app
│
└── {{APP_ENTRY}}.{{EXT}}     # Application entry point
```

### Test Organization

<!-- TODO: Define test directory structure -->

```
tests/
├── unit/                     # Unit tests
│   └── {{DOMAIN_1}}/
│       ├── services.test.ts
│       ├── utils.test.ts
│       └── ...
│
├── integration/              # Integration tests
│   └── {{DOMAIN_1}}/
│       ├── {{feature}}.test.ts
│       └── ...
│
├── e2e/                      # End-to-end tests
│   ├── {{user-journey}}.test.ts
│   └── ...
│
└── fixtures/                 # Test data and mocks
    └── {{DOMAIN_1}}/
```

## Naming Conventions

### Files

<!-- TODO: Define file naming rules -->

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `UserProfile.tsx` |
| Utilities | camelCase | `formatDate.ts` |
| Types/Interfaces | PascalCase | `UserProfile.ts` |
| Constants | UPPER_SNAKE_CASE | `API_TIMEOUT.ts` |
| Tests | `*.test.ts` or `*.spec.ts` | `UserProfile.test.ts` |

### Directories

<!-- TODO: Define directory naming rules -->

- Feature/domain directories: `{{feature-name}}/` (kebab-case)
- Component subdirectories: `components/`, `hooks/`, `utils/`, `services/`
- Keep directory names lowercase and descriptive

### Code Identifiers

<!-- TODO: Define code naming conventions -->

| Type | Convention | Example |
|------|-----------|---------|
| Classes | PascalCase | `UserService` |
| Functions | camelCase | `formatUserName()` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| Variables | camelCase | `isLoading` |
| Interfaces | PascalCase | `IUserRepository` or `UserRepository` |
| Type aliases | PascalCase | `UserId = string` |
| Booleans | `is/has/can` prefix | `isActive`, `hasError`, `canEdit` |

## Import Organization

<!-- TODO: Define import style and organization -->

### Import Order
1. External libraries (npm packages)
2. Internal absolute imports
3. Relative imports
4. Side effects (CSS, etc.)

### Example
```{{LANGUAGE}}
import React from 'react';
import { useQuery } from 'react-query';

import { UserService } from '@/services/UserService';
import { useAuthContext } from '@/contexts/AuthContext';

import { UserCard } from './UserCard';

import './UserProfile.css';
```

### Absolute vs Relative Imports
- **Absolute imports**: For cross-domain dependencies and shared modules
- **Relative imports**: Within the same domain (3+ levels deep, use relative)
- **Path aliases**: Configure `{{ALIAS_PREFIX}}` for absolute imports (e.g., `@/`, `src/`)

## Public API Exports

<!-- TODO: Define public API pattern -->

Each domain/feature should export its public API through an `index.ts` file:

```
src/users/
├── components/
├── services/
├── types/
└── index.ts          # Export public API
```

### Index.ts Pattern
```{{LANGUAGE}}
// src/users/index.ts
export { UserCard } from './components/UserCard';
export { UserService } from './services/UserService';
export type { User, UserId } from './types';
```

## Code Principles

### Single Responsibility
- Each file has one clear purpose
- Each component/function does one thing well
- Separate concerns (UI, logic, types)

### No Circular Dependencies
- Imports flow in one direction
- Use dependency inversion (interfaces/abstractions) when needed
- Structure directories to prevent circular imports

### Domain Isolation
- Features don't directly import from unrelated domains
- Cross-domain communication through well-defined interfaces
- Shared code lives in `shared/` directory

### Type Safety
- All files use {{TYPE_SYSTEM}} for type checking
- No `any` types without documented justification
- Export types alongside implementations

## Configuration Files

<!-- TODO: Document configuration file locations and purposes -->

| File | Purpose | Customizable |
|------|---------|-------------|
| `package.json` | Dependencies and scripts | Yes |
| `tsconfig.json` | TypeScript configuration | {{TSCONFIG_CUSTOMIZABLE}} |
| `{{CONFIG_FILE_1}}` | {{PURPOSE_1}} | {{CUSTOMIZABLE}} |
| `{{CONFIG_FILE_2}}` | {{PURPOSE_2}} | {{CUSTOMIZABLE}} |

## Environment & Build Outputs

### Build Artifacts
- Output directory: `{{OUTPUT_DIR}}`
- Do not commit build output to version control
- Generated files in `.gitignore`

### Environment Configuration
- Environment variables: {{ENV_VAR_LOCATION}}
- Development environment: {{DEV_ENV_SETUP}}
- Production environment: {{PROD_ENV_SETUP}}

## Documentation Location

- API documentation: {{DOC_LOCATION_API}}
- Component documentation: {{DOC_LOCATION_COMPONENTS}}
- Architecture decisions: `.kiro/steering/`
- Specifications: `.kiro/specs/`

## Performance Considerations

<!-- TODO: Document relevant performance patterns -->

- Code splitting: {{CODE_SPLITTING_STRATEGY}}
- Lazy loading: {{LAZY_LOADING_PATTERN}}
- Asset optimization: {{ASSET_OPTIMIZATION}}
