Feature: Content Generation and Finalization
  As a content creator
  I want the system to generate high-quality content based on the approved outline
  So that I can review and publish well-crafted content

  Background:
    Given I have approved the outline
    And the knowledge base is complete
    And I am in the content generation stage

  Scenario: Begin content generation
    Given the system is ready to generate content
    When content generation starts
    Then the system should:
      | Generation Activity                        |
      | Process outline section by section         |
      | Apply selected persona writing style       |
      | Reference knowledge base for accuracy      |
      | Include proper citations                   |
      | Maintain consistent tone throughout        |
      | Track generation progress                  |
    And show real-time progress to the user

  Scenario: Generate simple single-output content
    Given the outline has standard complexity
    And only one output type is required
    When the system generates content
    Then content should be created section by section
    And each section should:
      | Section Generation Requirements        |
      | Follow outline structure               |
      | Cover all planned key points           |
      | Use persona writing style              |
      | Include relevant citations             |
      | Maintain logical flow                  |
      | Match estimated section length         |
    And be ready for critic review

  Scenario: Generate complex content with sub-agents
    Given the outline is complex with multiple parallel sections
    Or multiple output types are required
    When the system determines sub-agents are needed
    Then the system should:
      | Sub-agent Orchestration                    |
      | Identify sections that can be parallelized |
      | Spawn sub-agents for independent sections  |
      | Provide each sub-agent with relevant context|
      | Monitor sub-agent progress                 |
      | Collect completed sections                 |
      | Integrate sections into cohesive content   |
      | Ensure consistency across sub-agent output |
    And coordinate sub-agents efficiently

  Scenario: Sub-agent requests clarification
    Given a sub-agent is generating a section
    When the sub-agent encounters ambiguity
    And needs clarification from the user
    Then the sub-agent should:
      | Clarification Request Process         |
      | Pause generation of that section      |
      | Formulate specific question           |
      | Present question to user with context |
      | Wait for user response                |
      | Resume generation with clarification  |
    And other sub-agents should continue working

  Scenario: User provides clarification during generation
    Given I receive a clarification question
    When I provide an answer
    Then the sub-agent should incorporate my answer
    And resume generation immediately
    And the system should update context for related sections
    And log the clarification for future reference

  Scenario: User declines to provide clarification
    Given I receive a clarification question
    When I choose not to answer or defer
    Then the sub-agent should make a reasonable assumption
    And mark the section as "pending user review"
    And continue generation
    And highlight the assumption in the content

  Scenario: Complete first draft of content
    Given all sections have been generated
    When the system assembles the complete draft
    Then the draft should include:
      | Draft Components                    |
      | All sections in outline order       |
      | Proper transitions between sections |
      | Consistent formatting               |
      | All citations and references        |
      | Metadata (word count, etc.)         |
    And be ready for critic review

  Scenario: Critic reviews draft and raises issues
    Given the first draft is complete
    When the critic reviews the content
    And identifies issues such as:
      | Content Issue Type                          |
      | Factual inaccuracies                        |
      | Style inconsistencies                       |
      | Weak arguments or logic                     |
      | Poor transitions                            |
      | Missing key points from outline             |
      | Citation problems                           |
      | Tone not matching persona                   |
      | Excessive length or insufficient depth      |
    Then the critic should document specific issues
    And suggest concrete improvements
    And the system should revise the content

  Scenario: Iterative content refinement
    Given the critic has raised issues with content
    When the system revises the content
    Then the revision should address each issue
    And maintain overall coherence
    And the critic should review the revised content
    And this cycle should continue until:
      | Termination Condition          |
      | Critic approves content        |
      | Maximum iterations reached (5) |
    And track all revisions

  Scenario: Generate multiple output types
    Given the plan includes multiple output types
    When content generation begins
    Then each output should be generated:
      | Multi-output Generation Approach      |
      | Using its own outline                 |
      | With its assigned persona             |
      | Sharing the same knowledge base       |
      | Maintaining message consistency       |
    And all outputs go through critic review
    And are presented together to the user

  Scenario: Content generation encounters knowledge gap
    Given content generation is in progress
    When the system identifies missing information
    Then the system should:
      | Knowledge Gap Handling                     |
      | Identify what specific information is needed|
      | Attempt targeted research                  |
      | Update knowledge base if found             |
      | Continue generation with new info          |
      | Or flag gap for user attention if not found|
    And notify the user of the issue

  Scenario: User reviews completed content
    Given content is critic-approved
    When I review the generated content
    Then I should see:
      | User Review Display                    |
      | Complete content for all outputs       |
      | Side-by-side with outline              |
      | Citation references                    |
      | Metadata (word count, reading time)    |
      | Critic approval note                   |
      | Options to approve, edit, or regenerate|
    And be able to export or copy content

  Scenario: User approves content without changes
    Given I am reviewing the content
    When I approve the content as-is
    Then the content should be marked as final
    And I should see publication options:
      | Publication Option                  |
      | Export to file (multiple formats)   |
      | Copy to clipboard                   |
      | Direct publish to CMS (if integrated)|
      | Schedule for later                  |
      | Share preview link                  |
    And receive confirmation of approval

  Scenario: User requests content revisions
    Given I am reviewing the content
    When I request changes such as:
      | Content Revision Type                   |
      | Rewrite specific sections               |
      | Adjust tone or style                    |
      | Add or remove content                   |
      | Improve transitions                     |
      | Strengthen arguments                    |
      | Better integrate sources                |
      | Adjust length (expand or condense)      |
    Then the system should update the content
    And re-run critic review
    And present the revised content to me

  Scenario: User edits content directly
    Given I am reviewing the content
    When I make direct edits to the text
    Then I should have a rich text editor with:
      | Editor Features                     |
      | Full text editing capabilities      |
      | Formatting tools                    |
      | Citation management                 |
      | Version tracking                    |
      | Undo/redo                           |
      | Spell check                         |
    And my edits should be saved immediately
    And I can optionally request critic review of my edits

  Scenario: Regenerate specific sections
    Given I am reviewing the content
    When I select specific sections to regenerate
    And optionally provide new instructions for those sections
    Then the system should:
      | Selective Regeneration Process         |
      | Regenerate only selected sections      |
      | Maintain context from other sections   |
      | Ensure smooth transitions              |
      | Run critic review                      |
      | Present regenerated sections for review|
    And allow me to accept or reject changes

  Scenario: Export content in multiple formats
    Given I have approved the content
    When I choose to export
    Then I should be able to export in:
      | Export Format  | Includes                              |
      | Markdown       | Plain text with markdown formatting   |
      | HTML           | Formatted for web                     |
      | DOCX           | Microsoft Word document               |
      | PDF            | Formatted PDF document                |
      | Plain Text     | No formatting                         |
      | JSON           | Structured data with metadata         |
    And each export should preserve citations and formatting

  Scenario: Publish directly to integrated platform
    Given I have approved the content
    And my account is connected to a CMS or platform
    When I choose to publish directly
    Then I should see available platforms:
      | Example Platforms |
      | WordPress         |
      | Medium            |
      | Substack          |
      | Ghost             |
    And be able to configure publication settings
    And publish with one click

  Scenario: Track generation metrics
    Given content generation is complete
    When I view generation metrics
    Then I should see:
      | Metric                              |
      | Total generation time               |
      | Number of critic iterations         |
      | Number of clarifications requested  |
      | Knowledge base entries used         |
      | Sources cited                       |
      | Sub-agents spawned (if applicable)  |
      | Final word count                    |
      | Reading time estimate               |

  Scenario: Save generation as template
    Given I have approved the content
    When I choose to save as template
    Then I should be able to:
      | Template Saving Option                      |
      | Save the outline as reusable template       |
      | Save the full configuration (personas, etc.)|
      | Name and describe the template              |
      | Make template private or shared             |
    And use this template for future content creation

  Scenario: Maximum critic iterations reached
    Given content has gone through 5 critic iterations
    And the critic still has objections
    When the maximum iteration limit is reached
    Then the system should present the best version
    And clearly list remaining objections
    And explain iteration limit reached
    And give me options to:
      | Option                                    |
      | Accept content with noted limitations     |
      | Make manual edits to address objections   |
      | Regenerate specific problematic sections  |
