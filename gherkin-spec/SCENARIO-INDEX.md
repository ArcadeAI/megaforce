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
- User initiates new content creation session *(01)*
- Use template to start new session *(09)*
- Resume incomplete session *(07)*
- Duplicate existing session *(07)*

### Configuring Content
- User selects single/multiple output types *(01)*
- User chooses corpus vs research *(02)*
- System asks about tone and style *(02)*
- Select/create personas *(03)*

### Working with Plans
- Initial plan generation *(04)*
- Critic reviews and refines plan *(04)*
- User approves/edits plan *(04)*
- View plan revision history *(04)*

### Research and Knowledge
- Execute deep research *(05)*
- Ground in corpus *(05)*
- Build knowledge base *(05)*
- Export knowledge base *(05)*

### Content Generation
- Generate simple/complex content *(06)*
- Sub-agents for parallel generation *(06)*
- Clarification during generation *(06)*
- Critic review and refinement *(06)*

### Publishing and Export
- Export in multiple formats *(06)*
- Publish to WordPress *(10)*
- Publish to social media *(10)*
- Save as template *(06, 09)*

### Session Management
- Auto-save progress *(07)*
- View/search sessions *(07)*
- Version control and comparison *(07)*
- Share with collaborators *(07)*

### Error Recovery
- Network connection lost *(08)*
- Browser crash recovery *(08)*
- Session data corruption *(08)*
- Invalid input handling *(08)*

### Templates
- Create/edit templates *(09)*
- Browse template library *(09)*
- Share templates *(09)*
- Template with variables *(09)*

### Integrations
- Connect CMS/social media *(10)*
- Cloud storage integration *(10)*
- Research databases *(10)*
- Notifications *(10)*

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
- User initiates new content creation session *(01)*
- User selects output types *(01)*
- System asks clarifying questions *(02)*
- Select personas *(03)*
- Plan creation and approval *(04)*
- Research and outline creation *(05)*
- Content generation *(06)*
- User approves content *(06)*
- Auto-save session progress *(07)*
- Basic error handling *(08)*

### P1 - Important Features (Should Have)
- Corpus upload and processing *(02)*
- Deep research *(05)*
- Critic review cycles *(04, 05, 06)*
- Sub-agent orchestration *(06)*
- Export in multiple formats *(06)*
- Resume sessions *(07)*
- Session organization *(07)*
- Template usage *(09)*
- Basic integrations (CMS, social) *(10)*

### P2 - Enhanced Features (Nice to Have)
- Custom personas *(03)*
- Multiple personas/blending *(03)*
- Session version control *(07)*
- Session sharing *(07)*
- Create templates *(09)*
- Template marketplace *(09)*
- Advanced integrations *(10)*
- Analytics *(10)*

### P3 - Advanced Features (Future)
- Template variables *(09)*
- Webhook integrations *(10)*
- Research database integration *(10)*
- Advanced collaboration *(07)*

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
- WordPress publishing *(10)*
- Google Drive access *(10)*
- Social media publishing *(10)*
- Slack notifications *(10)*
- Research databases *(10)*
- Analytics platforms *(10)*
- Webhook endpoints *(10)*

### Internal Systems
- File storage *(02, 07)*
- User authentication *(01, 07)*
- Session database *(07)*
- Template library *(09)*
- Knowledge base *(05)*
- Critic system *(04, 05, 06)*

---

## By Test Type

### Happy Path
- Complete workflow scenarios in order *(01-06)*
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
- *(01)* = File 01-output-type-selection.feature
- *(10)* = File 10-integrations.feature
