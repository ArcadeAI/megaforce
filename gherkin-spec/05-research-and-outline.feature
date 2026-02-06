Feature: Research and Outline Creation
  As a content creator
  I want the system to research, build a knowledge base, and create a detailed outline
  So that the final content is well-informed and properly structured

  Background:
    Given I have approved the content plan
    And I am in the research and outline stage

  Scenario: Execute research phase with deep research
    Given the plan specifies deep research
    When the system begins research
    Then the system should:
      | Research Activity                      |
      | Identify key topics to research        |
      | Search for authoritative sources       |
      | Extract relevant information           |
      | Verify facts and claims                |
      | Track source citations                 |
      | Build knowledge base entries           |
    And show research progress to the user
    And allow the user to monitor ongoing research

  Scenario: Ground research in provided corpus
    Given the plan specifies using a corpus of documents
    When the system processes the corpus
    Then the system should:
      | Corpus Processing Activity              |
      | Parse all corpus documents              |
      | Extract key facts and concepts          |
      | Identify main themes                    |
      | Create internal references              |
      | Build searchable knowledge base         |
      | Note source attribution for each item   |
    And prioritize corpus information over external research

  Scenario: Combine corpus and deep research
    Given the plan specifies both corpus and deep research
    When the system builds the knowledge base
    Then corpus sources should be treated as primary
    And deep research should supplement corpus information
    And the system should identify:
      | Knowledge Integration Task                    |
      | Information present in corpus only            |
      | Information from research that enhances corpus|
      | Conflicts between corpus and research         |
      | Gaps that need additional research            |
    And present a unified knowledge base

  Scenario: Build knowledge base iteratively
    Given research is in progress
    When the system discovers new information
    Then the system should add entries to the knowledge base with:
      | Knowledge Base Entry Fields    |
      | Fact or concept                |
      | Source reference               |
      | Confidence level               |
      | Related entries                |
      | Relevance score to plan        |
    And continuously update the knowledge base
    And avoid duplicate information

  Scenario: Generate sources summary
    Given the research phase is complete
    When the system creates the sources summary
    Then the summary should include:
      | Sources Summary Component           |
      | List of all sources used            |
      | Key information from each source    |
      | Reliability assessment of sources   |
      | Coverage map (which topics covered) |
      | Notable gaps or limitations         |
    And the summary should be clear and comprehensive

  Scenario: Create content outline
    Given the knowledge base is built
    And the sources summary is complete
    When the system creates the content outline
    Then the outline should include:
      | Outline Component                       |
      | Section/chapter headings                |
      | Subsection structure                    |
      | Key points to cover in each section     |
      | Sources to reference in each section    |
      | Estimated length per section            |
      | Tone notes per section (if varying)     |
      | Transitions between sections            |
    And follow the structure from the approved plan

  Scenario: Create outline for multiple outputs
    Given the plan includes multiple output types
    When the system creates outlines
    Then each output should have its own outline
    And outlines should share the same knowledge base
    And outlines should be marked with:
      | Multi-output Outline Metadata     |
      | Which output type                 |
      | Which persona to use              |
      | Cross-references to other outputs |
      | Shared sections                   |

  Scenario: Critic reviews outline and raises concerns
    Given the system has created an outline
    When the critic reviews the outline
    And identifies issues such as:
      | Outline Issue Type                          |
      | Logical flow problems                       |
      | Missing critical points from plan           |
      | Insufficient source backing                 |
      | Poor balance between sections               |
      | Weak transitions                            |
      | Inconsistent depth across sections          |
      | Misalignment with approved plan             |
    Then the critic should document specific concerns
    And suggest concrete improvements
    And the system should revise the outline

  Scenario: Iterative outline refinement
    Given the critic has raised concerns about an outline
    When the system revises the outline
    Then the revision should address each concern
    And the critic should review the revised outline
    And this cycle should continue until:
      | Termination Condition          |
      | Critic approves outline        |
      | Maximum iterations reached (5) |
    And track all revisions

  Scenario: Outline requires additional research
    Given the system is creating an outline
    When the critic or system identifies knowledge gaps
    Then the system should:
      | Gap Handling Action                    |
      | Identify what information is missing   |
      | Conduct targeted additional research   |
      | Update knowledge base                  |
      | Revise outline with new information    |
      | Re-submit to critic                    |
    And notify the user of additional research

  Scenario: User reviews outline and sources summary
    Given the outline is critic-approved
    When I review the outline and sources summary
    Then I should see:
      | User Review Display                        |
      | Complete outline with all details          |
      | Sources summary                            |
      | Knowledge base overview                    |
      | Critic approval note                       |
      | Options to approve, edit, or request more  |
    And be able to drill down into knowledge base entries

  Scenario: User approves outline without changes
    Given I am reviewing the outline
    When I approve the outline as-is
    Then the outline should be locked as approved
    And the system should proceed to content generation
    And I should receive confirmation

  Scenario: User requests outline modifications
    Given I am reviewing the outline
    When I request changes such as:
      | Outline Modification Type               |
      | Restructure sections                    |
      | Add or remove sections                  |
      | Adjust depth of coverage                |
      | Request more research on specific topic |
      | Change emphasis or focus                |
    Then the system should update the outline
    And conduct additional research if needed
    And re-run critic review
    And present the updated outline to me

  Scenario: User edits outline directly
    Given I am reviewing the outline
    When I make direct edits to the outline
    Then I should be able to:
      | Direct Edit Action                   |
      | Reorder sections                     |
      | Edit section titles                  |
      | Add/remove bullet points             |
      | Annotate with specific instructions  |
      | Mark sections as priority            |
    And save my changes
    And optionally re-run critic review

  Scenario: Sources are insufficient
    Given research has been completed
    When the sources summary shows insufficient coverage
    Then the system should alert me to the gap
    And suggest:
      | Gap Resolution Option                          |
      | Conduct more extensive research                |
      | Adjust scope to match available information    |
      | Proceed with disclaimer about limitations      |
      | Allow user to provide additional corpus sources|
    And wait for my decision before proceeding

  Scenario: View research progress in real-time
    Given research is ongoing
    When I view the research status
    Then I should see:
      | Research Progress Display        |
      | Current research topics          |
      | Sources discovered so far        |
      | Knowledge base entries created   |
      | Estimated time remaining         |
      | Ability to pause/adjust research |

  Scenario: Export knowledge base
    Given the knowledge base is complete
    When I choose to export the knowledge base
    Then I should be able to download it in formats:
      | Export Format |
      | JSON          |
      | Markdown      |
      | CSV           |
      | PDF           |
    And the export should include all sources and citations
