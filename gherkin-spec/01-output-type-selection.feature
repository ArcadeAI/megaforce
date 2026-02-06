Feature: Output Type Selection
  As a content creator
  I want to specify what type of content I need
  So that Megaforce can suggest appropriate templates and guide my content creation

  Background:
    Given I am on the Megaforce platform
    And I am authenticated

  Scenario: User initiates new content creation session
    Given I want to create new content
    When I start a new content creation session
    Then I should see a question about desired output types
    And the question should include common options like "blog post", "article", "social media", "technical documentation", "marketing copy"

  Scenario: User selects single output type
    Given I am asked about desired output types
    When I select "blog post"
    Then the system should identify matching templates for blog posts
    And I should proceed to the clarifying questions stage

  Scenario: User selects multiple output types
    Given I am asked about desired output types
    When I select "blog post" and "social media thread"
    Then the system should identify matching templates for both output types
    And I should proceed to the clarifying questions stage
    And the system should track that multiple outputs will be generated

  Scenario: User provides custom output type
    Given I am asked about desired output types
    And standard options don't match my needs
    When I enter a custom output type "investor pitch deck narrative"
    Then the system should accept the custom type
    And attempt to map it to available templates
    And proceed to clarifying questions

  Scenario: User is unsure about output type
    Given I am asked about desired output types
    When I indicate uncertainty about what I need
    Then the system should ask follow-up questions about:
      | Question Type          | Purpose                                    |
      | Target audience        | To understand who will consume the content |
      | Content purpose        | To understand the goal of the content      |
      | Distribution channel   | To understand where it will be published   |
      | Approximate length     | To suggest appropriate formats             |
    And suggest appropriate output types based on my answers

  Scenario: No templates match selected output type
    Given I am asked about desired output types
    When I select an output type with no matching templates
    Then the system should notify me that no exact template match exists
    And offer to use a generic template as a starting point
    And allow me to continue or change my selection
