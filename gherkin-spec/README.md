# Megaforce - Gherkin Specification

## Overview

This repository contains a comprehensive Gherkin specification for **Megaforce**, an AI-powered content creation platform that combines multiple sources, writing personas, and output formats to generate context-aware content.

## Product Description

Megaforce is a sophisticated content creation platform that:

- Combines multiple sources (URLs, documents) for context
- Uses writing personas with style guides to match desired voice
- Supports multiple output formats and templates
- Optionally grounds content in a corpus of text
- Can expand content through deep research
- Uses a multi-stage workflow with AI critic review at each stage
- Requires user approval before proceeding to each major stage

## Core Workflow

The default content creation flow follows these stages:

1. **Output Type Selection** - User specifies desired content types
2. **Clarifying Questions** - System gathers tone, corpus/research preferences, and context
3. **Persona Selection** - User chooses writing style(s) to apply
4. **Plan Creation & Critic Review** - System creates plan, critic reviews iteratively, user approves
5. **Research & Outline** - System builds knowledge base, creates outline, critic reviews, user approves
6. **Content Generation** - System generates content (using sub-agents if needed), critic reviews, user approves/publishes

## Feature Files

This specification is organized into the following feature files:

### Core Content Creation Flow

1. **[01-output-type-selection.feature](01-output-type-selection.feature)**
   - Starting new content creation sessions
   - Selecting single or multiple output types
   - Handling custom output types
   - Template matching based on output type

2. **[02-clarifying-questions.feature](02-clarifying-questions.feature)**
   - Tone and style configuration
   - Corpus selection (documents, URLs, data sources)
   - Deep research configuration
   - Additional context gathering (audience, keywords, requirements)

3. **[03-persona-selection.feature](03-persona-selection.feature)**
   - Viewing and selecting writing personas
   - Creating custom personas with style guides
   - Using multiple personas for different outputs or blended styles
   - Persona preview and management

4. **[04-plan-creation-and-review.feature](04-plan-creation-and-review.feature)**
   - Initial plan generation
   - Iterative critic review and refinement
   - User approval and editing
   - Plan revision history
   - Handling multiple output types in plans

5. **[05-research-and-outline.feature](05-research-and-outline.feature)**
   - Deep research execution
   - Corpus processing and grounding
   - Knowledge base building
   - Outline creation and structure
   - Sources summary generation
   - Critic review of outlines
   - User approval and editing

6. **[06-content-generation.feature](06-content-generation.feature)**
   - Content generation section by section
   - Sub-agent orchestration for complex content
   - Clarification questions during generation
   - Critic review and iterative refinement
   - Multiple output type generation
   - User approval and publication
   - Export in multiple formats

### Supporting Features

7. **[07-session-management.feature](07-session-management.feature)**
   - Creating and managing content sessions
   - Auto-save and session recovery
   - Version history and comparison
   - Session sharing and collaboration
   - Project organization (tags, folders, search)
   - Import/export sessions

8. **[08-error-handling.feature](08-error-handling.feature)**
   - Network and connectivity issues
   - API errors and rate limiting
   - File upload validation
   - Data corruption recovery
   - Browser crash recovery
   - Quota management
   - Conflict resolution
   - Error reporting

9. **[09-template-management.feature](09-template-management.feature)**
   - Creating templates from scratch or sessions
   - Template library and marketplace
   - Template customization and reuse
   - Template sharing (team/public)
   - Variables and conditional sections
   - Template version control
   - Analytics and ratings

10. **[10-integrations.feature](10-integrations.feature)**
    - CMS integrations (WordPress, etc.)
    - Social media publishing
    - Cloud storage (Google Drive, etc.)
    - Research database access
    - Notification systems (Slack)
    - Analytics platforms
    - Webhook and API integrations

## Key Concepts

### Actor Roles

- **User** - Content creator using the platform
- **System** - Megaforce AI platform
- **Critic** - AI reviewer that provides feedback on plans, outlines, and content
- **Sub-agents** - Specialized agents spawned for parallel content generation

### Multi-Stage Approval Process

Each major stage requires user approval before proceeding:

1. Plan must be critic-approved, then user-approved
2. Outline must be critic-approved, then user-approved
3. Content must be critic-approved, then user-approved

### Critic Review Cycle

- System generates initial version
- Critic reviews and raises objections
- System revises addressing objections
- Cycle repeats until critic approves or max iterations reached (typically 5)
- User sees critic-approved version for final approval

### Content Grounding

Content can be grounded in:

- **Corpus** - User-provided documents and URLs (prioritized as primary sources)
- **Deep Research** - System-conducted research on the topic
- **Both** - Corpus as primary, research as supplementary

### Writing Personas

- Define voice, tone, and style for content
- Can include uploaded style guides
- Support blending multiple personas
- Can be saved and reused across sessions

## Gherkin Structure

Each feature file follows the standard Gherkin format:

```gherkin
Feature: [Feature Name]
  As a [role]
  I want [capability]
  So that [benefit]

  Background:
    Given [common preconditions]

  Scenario: [Specific scenario]
    Given [initial context]
    When [action occurs]
    Then [expected outcome]
    And [additional expectations]
```

### Common Gherkin Patterns Used

- **Background** - Shared setup for all scenarios in a feature
- **Scenario** - Individual test case
- **Given** - Preconditions and context
- **When** - Actions or events
- **Then** - Expected outcomes
- **And/But** - Additional steps
- **Tables** - Structured data in scenarios
- **Examples** - Scenario outlines with data tables (used sparingly)

## Usage

### For Product Managers

- Use these specifications to understand complete product behavior
- Reference scenarios when defining new features or changes
- Ensure acceptance criteria align with documented scenarios

### For Developers

- Implement features to satisfy scenario requirements
- Use scenarios as basis for automated tests
- Reference "Then" clauses for expected behavior

### For QA/Testers

- Convert scenarios directly into test cases
- Use as comprehensive test coverage documentation
- Verify that all scenarios pass before release

### For Stakeholders

- Read feature descriptions and scenarios in plain English
- Understand what the product does without technical jargon
- Provide feedback on requirements and edge cases

## Test Coverage

This specification covers:

- ✅ Happy path scenarios (standard user flows)
- ✅ Alternative paths (different user choices)
- ✅ Edge cases (unusual but valid scenarios)
- ✅ Error conditions (failures and recovery)
- ✅ Integration points (external systems)
- ✅ Data validation (input handling)
- ✅ Permission and security scenarios
- ✅ Performance considerations (timeouts, limits)

## Future Enhancements

Potential areas for additional specification:

- Analytics and reporting features
- Team collaboration and workspace management
- Advanced AI model configuration
- Content versioning and A/B testing
- SEO optimization features
- Accessibility and internationalization
- Mobile application scenarios
- API and developer platform

## Contributing

When adding new scenarios:

1. Follow existing Gherkin format and style
2. Place scenarios in appropriate feature file
3. Use clear, specific language
4. Include tables for structured data
5. Consider error and edge cases
6. Keep scenarios focused on single behaviors

## Format Conventions

- **File naming**: `NN-feature-name.feature` (numbered for ordering)
- **Indentation**: 2 spaces for scenario steps, 4 spaces for tables
- **Tables**: Use for structured lists, options, configurations
- **Examples**: Use for displaying what data looks like
- **Comments**: Use sparingly, let scenarios be self-documenting

## Validation

To validate these specifications:

1. Review for completeness (all features covered)
2. Check for consistency across files
3. Verify clarity (non-technical readers can understand)
4. Ensure testability (scenarios can be automated)
5. Confirm alignment with product vision

---

**Version**: 1.0
**Last Updated**: 2026-02-06
**Status**: Initial Comprehensive Specification
**Maintainer**: Product Team
