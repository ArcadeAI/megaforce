# Megaforce - Scenario Index

Quick index of all scenarios across feature files for easy reference.

## By Feature File

### 01-output-type-selection.feature

- User initiates new content creation session
- User selects single output type
- User selects multiple output types
- User provides custom output type
- User is unsure about output type
- No templates match selected output type

### 02-clarifying-questions.feature

- System asks about tone and style
- User chooses to use a specific corpus of data
- User chooses deep research
- User wants both corpus and research
- User uploads documents as corpus
- User provides URLs as corpus
- Invalid corpus sources provided
- Additional context and requirements
- Skipping optional clarifying questions

### 03-persona-selection.feature

- View available personas
- Select single persona
- Select multiple personas
- Create custom persona
- Upload persona style guide
- Preview persona writing style
- Use multiple personas for single output
- No persona selected
- Edit existing persona
- Delete custom persona

### 04-plan-creation-and-review.feature

- Initial plan generation
- Critic reviews plan and raises objections
- Iterative plan refinement
- Critic approves plan
- User approves plan without changes
- User requests plan modifications
- User makes direct edits to plan
- User rejects plan and requests restart
- Maximum critic iterations reached
- Plan includes multiple output types
- View plan revision history

### 05-research-and-outline.feature

- Execute research phase with deep research
- Ground research in provided corpus
- Combine corpus and deep research
- Build knowledge base iteratively
- Generate sources summary
- Create content outline
- Create outline for multiple outputs
- Critic reviews outline and raises concerns
- Iterative outline refinement
- Outline requires additional research
- User reviews outline and sources summary
- User approves outline without changes
- User requests outline modifications
- User edits outline directly
- Sources are insufficient
- View research progress in real-time
- Export knowledge base

### 06-content-generation.feature

- Begin content generation
- Generate simple single-output content
- Generate complex content with sub-agents
- Sub-agent requests clarification
- User provides clarification during generation
- User declines to provide clarification
- Complete first draft of content
- Critic reviews draft and raises issues
- Iterative content refinement
- Generate multiple output types
- Content generation encounters knowledge gap
- User reviews completed content
- User approves content without changes
- User requests content revisions
- User edits content directly
- Regenerate specific sections
- Export content in multiple formats
- Publish directly to integrated platform
- Track generation metrics
- Save generation as template
- Maximum critic iterations reached

### 07-session-management.feature

- Create new content session
- Auto-save session progress
- View all my sessions
- Resume incomplete session
- Name and organize sessions
- Duplicate existing session
- Delete session
- Archive completed session
- Export session for backup
- Import session from backup
- Session recovery after crash
- View session history and versions
- Compare two versions
- Set session privacy level
- Share session with collaborators
- Search across all sessions
- Session storage quota management

### 08-error-handling.feature

- Network connection lost during research
- API rate limit exceeded
- AI model returns error response
- Invalid file upload
- File upload size exceeds limit
- URL fetching fails
- Insufficient corpus data
- Research returns no results
- Critic and system in infinite disagreement
- Session data corruption
- Browser crash during content generation
- Quota exceeded during generation
- Concurrent edit conflict
- Invalid user input
- Timeout during long operation
- External service unavailable
- Insufficient permissions
- Session expired
- Unsupported browser or device
- Report error to support

### 09-template-management.feature

- View available templates
- Create new template from scratch
- Create template from existing session
- Use template to start new session
- Customize template before using
- Edit existing template
- Duplicate template
- Delete custom template
- Share template with team
- Publish template publicly
- Import template
- Export template
- Search and filter templates
- Favorite templates
- Template version control
- Template with variables
- Template with conditional sections
- Rate and review public template
- View template analytics

### 10-integrations.feature

- View available integrations
- Connect WordPress CMS
- Publish content to WordPress
- Connect Google Drive for corpus
- Use Google Drive documents as corpus
- Connect social media platforms
- Publish to multiple social media platforms
- Connect Slack for notifications
- Receive Slack notifications
- Connect research databases
- Enhanced research with database access
- Connect analytics platforms
- Disconnect integration
- Integration authentication expires
- Integration API error
- Webhook integration for custom platforms
- API key management
- Integration marketplace
- Data sync configuration
- Integration usage limits

---

## By User Goal

### Starting Content Creation

- User initiates new content creation session _(01)_
- Use template to start new session _(09)_
- Resume incomplete session _(07)_
- Duplicate existing session _(07)_

### Configuring Content

- User selects single/multiple output types _(01)_
- User chooses corpus vs research _(02)_
- System asks about tone and style _(02)_
- Select/create personas _(03)_

### Working with Plans

- Initial plan generation _(04)_
- Critic reviews and refines plan _(04)_
- User approves/edits plan _(04)_
- View plan revision history _(04)_

### Research and Knowledge

- Execute deep research _(05)_
- Ground in corpus _(05)_
- Build knowledge base _(05)_
- Export knowledge base _(05)_

### Content Generation

- Generate simple/complex content _(06)_
- Sub-agents for parallel generation _(06)_
- Clarification during generation _(06)_
- Critic review and refinement _(06)_

### Publishing and Export

- Export in multiple formats _(06)_
- Publish to WordPress _(10)_
- Publish to social media _(10)_
- Save as template _(06, 09)_

### Session Management

- Auto-save progress _(07)_
- View/search sessions _(07)_
- Version control and comparison _(07)_
- Share with collaborators _(07)_

### Error Recovery

- Network connection lost _(08)_
- Browser crash recovery _(08)_
- Session data corruption _(08)_
- Invalid input handling _(08)_

### Templates

- Create/edit templates _(09)_
- Browse template library _(09)_
- Share templates _(09)_
- Template with variables _(09)_

### Integrations

- Connect CMS/social media _(10)_
- Cloud storage integration _(10)_
- Research databases _(10)_
- Notifications _(10)_

---

## By Actor

### User Actions

- Initiate session
- Select options
- Provide input
- Upload files
- Approve/reject
- Edit content
- Publish content
- Manage sessions
- Configure integrations

### System Actions

- Generate plans
- Conduct research
- Build knowledge base
- Create outlines
- Generate content
- Auto-save
- Validate input
- Handle errors
- Manage integrations

### Critic Actions

- Review plans
- Review outlines
- Review content
- Raise objections
- Suggest improvements
- Approve work

### Sub-agent Actions

- Generate sections
- Request clarifications
- Complete assigned work

---

## By Priority

### P0 - Core Functionality (Must Have)

- User initiates new content creation session _(01)_
- User selects output types _(01)_
- System asks clarifying questions _(02)_
- Select personas _(03)_
- Plan creation and approval _(04)_
- Research and outline creation _(05)_
- Content generation _(06)_
- User approves content _(06)_
- Auto-save session progress _(07)_
- Basic error handling _(08)_

### P1 - Important Features (Should Have)

- Corpus upload and processing _(02)_
- Deep research _(05)_
- Critic review cycles _(04, 05, 06)_
- Sub-agent orchestration _(06)_
- Export in multiple formats _(06)_
- Resume sessions _(07)_
- Session organization _(07)_
- Template usage _(09)_
- Basic integrations (CMS, social) _(10)_

### P2 - Enhanced Features (Nice to Have)

- Custom personas _(03)_
- Multiple personas/blending _(03)_
- Session version control _(07)_
- Session sharing _(07)_
- Create templates _(09)_
- Template marketplace _(09)_
- Advanced integrations _(10)_
- Analytics _(10)_

### P3 - Advanced Features (Future)

- Template variables _(09)_
- Webhook integrations _(10)_
- Research database integration _(10)_
- Advanced collaboration _(07)_

---

## By Complexity

### Simple Scenarios (Quick Implementation)

- User selects single output type
- User uploads documents
- View available personas
- Select single persona
- User approves without changes
- Export to file
- View sessions list
- Auto-save

### Medium Scenarios (Moderate Effort)

- User provides custom output type
- Corpus processing
- Create custom persona
- Plan creation
- Outline creation
- Content generation (simple)
- Resume session
- Error handling basics
- Template usage

### Complex Scenarios (High Effort)

- Multiple output types
- Persona blending
- Critic review cycles
- Deep research integration
- Knowledge base building
- Sub-agent orchestration
- Version control and comparison
- Template with variables/conditionals
- Multi-platform integrations

---

## By Integration Points

### External Services

- WordPress publishing _(10)_
- Google Drive access _(10)_
- Social media publishing _(10)_
- Slack notifications _(10)_
- Research databases _(10)_
- Analytics platforms _(10)_
- Webhook endpoints _(10)_

### Internal Systems

- File storage _(02, 07)_
- User authentication _(01, 07)_
- Session database _(07)_
- Template library _(09)_
- Knowledge base _(05)_
- Critic system _(04, 05, 06)_

---

## By Test Type

### Happy Path

- Complete workflow scenarios in order _(01-06)_
- Standard user journeys
- Expected user behaviors

### Alternative Path

- User provides custom inputs
- User selects different options
- User edits generated content
- User uses templates

### Error Conditions

- All scenarios in file 08
- Invalid inputs
- Service failures
- Network issues
- Data corruption

### Edge Cases

- Maximum iterations reached
- No templates match
- Insufficient data
- Empty corpus
- Expired sessions
- Unsupported formats

---

## Search Tips

To find scenarios about a specific topic:

- **Approval**: Search files 04, 05, 06
- **Clarification**: Search files 02, 06
- **Collaboration**: Search file 07
- **Corpus**: Search files 02, 05, 10
- **Critic**: Search files 04, 05, 06
- **Error**: Search file 08
- **Export**: Search files 06, 07, 09
- **Integration**: Search file 10
- **Persona**: Search files 03, 04
- **Plan**: Search file 04
- **Outline**: Search file 05
- **Research**: Search files 02, 05, 10
- **Session**: Search file 07
- **Sub-agent**: Search file 06
- **Template**: Search files 01, 09
- **Upload**: Search files 02, 08

---

**Total Scenarios**: 150+

**Format**: Each entry shows scenario name and file number

- _(01)_ = File 01-output-type-selection.feature
- _(10)_ = File 10-integrations.feature
