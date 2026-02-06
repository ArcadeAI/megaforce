Feature: Writing Persona Selection
  As a content creator
  I want to select one or more writing personas with specific style guides
  So that the generated content matches the voice and style I need

  Background:
    Given I have completed the clarifying questions stage
    And I am in the persona selection stage

  Scenario: View available personas
    Given I need to select a writing persona
    When I view the persona selection screen
    Then I should see a list of available personas
    And each persona should display:
      | Persona Attribute    | Description                                |
      | Name                 | Persona identifier                         |
      | Description          | What this persona represents               |
      | Writing style        | Key characteristics of the writing style   |
      | Sample output        | Example of content in this persona's voice |
      | Use cases            | Recommended scenarios for this persona     |

  Scenario: Select single persona
    Given I am viewing available personas
    When I select "Tech Thought Leader" persona
    Then the system should mark this persona as selected
    And display the persona's style guide details
    And allow me to proceed to plan creation

  Scenario: Select multiple personas
    Given I am viewing available personas
    And I have selected multiple output types
    When I select "Tech Thought Leader" for blog post
    And I select "Casual Brand Voice" for social media thread
    Then the system should map each persona to its output type
    And confirm the mapping visually
    And allow me to proceed to plan creation

  Scenario: Create custom persona
    Given I am viewing available personas
    And none match my needs
    When I choose to create a custom persona
    Then I should be prompted to provide:
      | Custom Persona Field        | Required |
      | Persona name                | Yes      |
      | Writing style description   | Yes      |
      | Sample text (optional)      | No       |
      | Tone preferences            | Yes      |
      | Vocabulary level            | Yes      |
      | Sentence structure style    | No       |
      | Perspective (1st/3rd person)| Yes      |
      | Industry/domain expertise   | No       |
    And the system should save this as a reusable persona
    And allow me to proceed with the custom persona

  Scenario: Upload persona style guide
    Given I am creating or editing a persona
    When I upload a style guide document
    Then the system should parse the style guide
    And extract key writing rules and patterns
    And associate them with the persona
    And confirm successful style guide integration

  Scenario: Preview persona writing style
    Given I am viewing a persona
    When I click "preview style"
    Then the system should generate a sample paragraph
    Using my current context/topic
    And in the selected persona's voice
    So I can verify it matches my expectations

  Scenario: Use multiple personas for single output
    Given I am creating a single output
    When I select multiple personas
    Then the system should ask how to blend the personas:
      | Blending Option              | Description                           |
      | Equal blend                  | Mix both styles evenly                |
      | Primary + Secondary          | One dominant, one as accent           |
      | Section-based                | Different personas for different parts|
      | Progressive transition       | Gradually shift from one to another   |
    And proceed with the specified blending strategy

  Scenario: No persona selected
    Given I am in persona selection stage
    When I attempt to proceed without selecting a persona
    Then the system should prompt me to select at least one persona
    And offer to use a "Neutral Professional" default persona
    And not proceed until a persona is confirmed

  Scenario: Edit existing persona
    Given I have previously created custom personas
    When I select a custom persona to edit
    Then I should be able to modify all persona attributes
    And see a warning if this persona is used in active projects
    And save the updated persona
    And have changes apply to future generations

  Scenario: Delete custom persona
    Given I have previously created custom personas
    When I choose to delete a custom persona
    And the persona is not used in any active projects
    Then the system should confirm deletion
    And permanently remove the persona
    But when the persona is used in active projects
    Then the system should warn me about dependencies
    And require explicit confirmation before deletion
