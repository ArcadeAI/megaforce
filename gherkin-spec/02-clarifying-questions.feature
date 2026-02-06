Feature: Clarifying Questions
  As a content creator
  I want to provide additional context about my content needs
  So that Megaforce can generate content that matches my requirements

  Background:
    Given I have selected my desired output type(s)
    And I am in the clarifying questions stage

  Scenario: System asks about tone and style
    Given the system needs to understand content tone
    When I am presented with tone options
    Then I should see choices like:
      | Tone Options    |
      | Professional    |
      | Casual          |
      | Technical       |
      | Conversational  |
      | Formal          |
      | Humorous        |
      | Authoritative   |
      | Inspirational   |
    And I should be able to select one or more tones
    And I should be able to provide custom tone description

  Scenario: User chooses to use a specific corpus of data
    Given I am asked whether to use a specific corpus or do deep research
    When I choose "use specific corpus"
    Then I should be prompted to provide or select my corpus
    And corpus options should include:
      | Corpus Source Type      |
      | Upload documents        |
      | Provide URLs            |
      | Connect to data source  |
      | Use previous corpus     |
    And I should proceed to persona selection

  Scenario: User chooses deep research
    Given I am asked whether to use a specific corpus or do deep research
    When I choose "deep research"
    Then I should be asked for research scope and keywords
    And I should optionally provide research boundaries or constraints
    And I should proceed to persona selection

  Scenario: User wants both corpus and research
    Given I am asked whether to use a specific corpus or do deep research
    When I choose "both corpus and research"
    Then I should be prompted to provide corpus sources
    And I should be asked for research scope
    And the system should note that both will be used for context
    And I should proceed to persona selection

  Scenario: User uploads documents as corpus
    Given I chose to use a specific corpus
    When I upload documents in formats: PDF, DOCX, TXT, MD
    Then the system should validate the file formats
    And confirm successful upload
    And display document metadata (filename, size, page count)
    And allow me to upload additional documents
    And allow me to proceed when ready

  Scenario: User provides URLs as corpus
    Given I chose to use a specific corpus
    When I provide a list of URLs
    Then the system should validate each URL
    And attempt to fetch content from each URL
    And display success/failure status for each URL
    And show preview of fetched content
    And allow me to add more URLs or proceed

  Scenario: Invalid corpus sources provided
    Given I chose to use a specific corpus
    When I provide invalid sources (broken URLs, corrupted files)
    Then the system should identify which sources are invalid
    And explain why each source failed
    And allow me to remove invalid sources or provide alternatives
    And not proceed until at least one valid source exists

  Scenario: Additional context and requirements
    Given I have answered basic clarifying questions
    When the system asks for additional context
    Then I should be able to provide:
      | Additional Context Field | Optional/Required |
      | Target audience details  | Optional          |
      | Key messages to include  | Optional          |
      | Keywords to emphasize    | Optional          |
      | Topics to avoid          | Optional          |
      | Specific requirements    | Optional          |
      | Length constraints       | Optional          |
      | SEO requirements         | Optional          |

  Scenario: Skipping optional clarifying questions
    Given I am presented with optional clarifying questions
    When I choose to skip optional questions
    Then the system should use intelligent defaults
    And proceed to the next required step
    And allow me to return to add more context later
