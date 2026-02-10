# Megaforce - Quick Reference Guide

## Core Workflow Summary

```
Start Session
    ↓
1. Select Output Type(s)
    ↓
2. Answer Clarifying Questions
   - Tone/Style
   - Corpus or Deep Research
   - Additional Context
    ↓
3. Select Persona(s)
    ↓
4. Plan Creation
   → Critic Review (iterative)
   → User Approval
    ↓
5. Research & Outline
   → Build Knowledge Base
   → Create Outline
   → Critic Review (iterative)
   → User Approval
    ↓
6. Content Generation
   → Generate Content
   → Spawn Sub-agents (if needed)
   → Critic Review (iterative)
   → User Approval/Publication
```

## Feature Quick Links

| Feature              | File                                  | Key Scenarios                               |
| -------------------- | ------------------------------------- | ------------------------------------------- |
| Output Selection     | `01-output-type-selection.feature`    | Single/multiple outputs, custom types       |
| Clarifying Questions | `02-clarifying-questions.feature`     | Tone, corpus, research, context             |
| Personas             | `03-persona-selection.feature`        | Select, create, blend personas              |
| Plan & Critic        | `04-plan-creation-and-review.feature` | Plan creation, critic review, user approval |
| Research & Outline   | `05-research-and-outline.feature`     | Research, knowledge base, outline           |
| Content Generation   | `06-content-generation.feature`       | Generate, sub-agents, finalize              |
| Sessions             | `07-session-management.feature`       | Save, resume, organize, share               |
| Error Handling       | `08-error-handling.feature`           | Recovery, validation, errors                |
| Templates            | `09-template-management.feature`      | Create, use, share templates                |
| Integrations         | `10-integrations.feature`             | Connect external platforms                  |
| MCP API              | `11-mcp-api.feature`                  | Programmatic access via MCP tools           |

## Common User Journeys

### Journey 1: Quick Blog Post

1. Select "blog post" output
2. Choose "casual" tone, enable deep research
3. Select existing persona
4. Approve generated plan
5. Approve outline after research
6. Approve final content
7. Export to WordPress

**Files**: 01 → 02 → 03 → 04 → 05 → 06 → 10

---

### Journey 2: Multi-format Campaign

1. Select "blog post" + "social media thread"
2. Provide corpus documents, choose "professional" tone
3. Select different personas for each output
4. Review and edit plan
5. Approve outline with knowledge base
6. Monitor sub-agents generating content
7. Approve both outputs
8. Publish to multiple platforms

**Files**: 01 → 02 → 03 → 04 → 05 → 06 → 10

---

### Journey 3: Template-based Content

1. Browse templates library
2. Select "Product Launch Post" template
3. Customize template variables
4. Plan auto-generated from template
5. Quick approve outline
6. Generate and publish

**Files**: 09 → 01 → 02 → 03 → 04 → 05 → 06

---

### Journey 4: AI-Driven Content via MCP (One-Shot)

1. AI client connects to Megaforce MCP server
2. Calls `create_content` with corpus, rules, persona, and `auto_approve: true`
3. Pipeline runs end-to-end automatically
4. Content returned in requested format

**Files**: 11

---

### Journey 5: AI-Driven Content via MCP (Step-by-Step)

1. AI client calls `create_session`
2. Calls `set_output_type`, `answer_questions`, `select_persona`
3. Calls `generate_plan`, reviews result, calls `approve_plan`
4. Calls `start_research`, reviews outline, calls `approve_outline`
5. Calls `generate_content`, reviews result, calls `approve_content`
6. Calls `export_content` with desired format

**Files**: 11

---

### Journey 6: Resume Previous Work

1. View saved sessions
2. Select incomplete session
3. Resume from last checkpoint (e.g., outline approval)
4. Continue workflow from there

**Files**: 07 → 05/06 (depending on stage)

---

## Critic Review Process

```
System creates draft
    ↓
Critic reviews
    ↓
Has objections? ──Yes──→ System revises ──→ Loop back to Critic
    ↓ No
Critic approves
    ↓
Present to User
```

**Max iterations**: 5
**Applies to**: Plans, Outlines, Content

## Data Sources

### Corpus Options

- Upload documents (PDF, DOCX, TXT, MD)
- Provide URLs
- Connect to cloud storage (Google Drive, etc.)
- Use previous corpus from saved sessions

### Research Options

- Deep research: System researches topic autonomously
- Research databases: Academic/authoritative sources
- Both: Corpus as primary + research as supplementary

## Persona Types

| Persona Attribute | Description                           |
| ----------------- | ------------------------------------- |
| Name              | Identifier                            |
| Writing Style     | Key characteristics                   |
| Tone              | Professional, casual, technical, etc. |
| Vocabulary Level  | Technical vs accessible               |
| Perspective       | 1st person, 3rd person                |
| Sample Output     | Examples of voice                     |

## Export Formats

- **Markdown** - Plain text with formatting
- **HTML** - Web-ready
- **DOCX** - Microsoft Word
- **PDF** - Formatted document
- **Plain Text** - No formatting
- **JSON** - Structured data with metadata

## Integration Categories

| Category      | Examples               | Primary Use          |
| ------------- | ---------------------- | -------------------- |
| CMS           | WordPress, Ghost       | Publishing           |
| Social Media  | Twitter, LinkedIn      | Distribution         |
| Storage       | Google Drive, Dropbox  | Corpus sources       |
| Research      | Google Scholar, PubMed | Deep research        |
| Notifications | Slack, Email           | Updates              |
| Analytics     | Google Analytics       | Performance tracking |

## Error Recovery Strategies

| Error Type      | Recovery Action                        |
| --------------- | -------------------------------------- |
| Network loss    | Auto-save → Retry → Resume             |
| Invalid file    | Reject → Explain → Allow replacement   |
| API failure     | Retry with backoff → Fallback          |
| Quota exceeded  | Save progress → Notify → Offer upgrade |
| Browser crash   | Auto-save → Detect → Offer restore     |
| Concurrent edit | Lock → Detect conflict → Merge options |

## Session States

- **Initial** - Just created
- **In Progress** - Working through stages
- **Awaiting Approval** - User review required
- **Generating** - Content being created
- **Complete** - Finalized
- **Archived** - Moved to archive

## Stage Gates (User Approval Required)

1. ✋ **After Plan Creation** - User must approve plan before research
2. ✋ **After Outline Creation** - User must approve outline before content generation
3. ✋ **After Content Generation** - User must approve before publication

## Keyboard Shortcuts (Future Implementation)

Consider adding shortcuts for:

- `Ctrl/Cmd + S` - Save session
- `Ctrl/Cmd + Enter` - Approve current stage
- `Ctrl/Cmd + E` - Edit current item
- `Ctrl/Cmd + K` - Search
- `Esc` - Cancel operation

## Best Practices

### For Users

1. Provide clear, specific context in clarifying questions
2. Use templates for repeated content types
3. Save successful configurations as templates
4. Enable auto-save (default)
5. Review critic feedback carefully
6. Provide corpus when domain-specific content is needed

### For Administrators

1. Monitor integration health
2. Set appropriate rate limits
3. Regularly backup session data
4. Review error logs
5. Update integration credentials before expiration
6. Maintain template library quality

## Limits and Quotas (Example Values)

| Resource          | Limit         | Configurable |
| ----------------- | ------------- | ------------ |
| File upload size  | 50 MB         | Per plan     |
| Corpus documents  | 100 files     | Per plan     |
| Session storage   | 10 GB         | Per user     |
| Active sessions   | Unlimited     | -            |
| Critic iterations | 5             | System-wide  |
| Sub-agents        | 10 concurrent | Per session  |

## Support and Troubleshooting

### Common Issues

- **Plan keeps getting rejected** → Provide more specific requirements
- **Research returns no results** → Broaden search terms or provide corpus
- **Content doesn't match persona** → Review persona style guide
- **Integration fails** → Check credentials and permissions
- **Session won't load** → Check auto-save timestamp, contact support

### Getting Help

1. Check error message for specific guidance
2. Review relevant feature file scenarios
3. Search knowledge base
4. Contact support with session ID
5. Report bugs via error reporting feature

---

**Quick Start**: Begin at `01-output-type-selection.feature` and follow the numbered files sequentially to understand the complete workflow.

**Need Details?** Each feature file contains comprehensive scenarios with edge cases and error conditions.
