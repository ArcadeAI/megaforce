Feature: Plan Creation and Critic Review
  As a content creator
  I want the system to create a detailed content plan and have it reviewed by a critic
  So that I can approve a well-thought-out strategy before content generation begins

  Background:
    Given I have selected output type(s)
    And I have completed clarifying questions
    And I have selected writing persona(s)
    And I am in the plan creation stage

  Scenario: Initial plan generation
    Given the system has all required context
    When the system creates the initial content plan
    Then the plan should include:
      | Plan Component              | Description                                |
      | Executive summary           | Overview of what will be created           |
      | Target audience             | Who the content is for                     |
      | Key messages                | Main points to convey                      |
      | Content structure           | High-level organization                    |
      | Research needs              | What information needs to be gathered      |
      | Source strategy             | How corpus/research will be utilized       |
      | Persona application         | How selected persona(s) will be applied    |
      | Success criteria            | What makes this content successful         |
      | Estimated scope             | Approximate length and complexity          |
    And the plan should be sent to the critic for review

  Scenario: Critic reviews plan and raises objections
    Given the system has created an initial plan
    When the critic reviews the plan
    And the critic identifies issues like:
      | Issue Type                  | Example                                        |
      | Logical inconsistency       | Target audience mismatch with tone             |
      | Missing critical element    | No clear call-to-action defined                |
      | Unclear objective           | Vague success criteria                         |
      | Resource insufficiency      | Not enough source material for depth required  |
      | Structural weakness         | Poor content flow                              |
      | Persona misalignment        | Style doesn't match audience expectations      |
    Then the critic should document specific objections
    And suggest concrete improvements
    And the system should revise the plan addressing each objection
    And send the revised plan back to the critic

  Scenario: Iterative plan refinement
    Given the critic has raised objections to a plan
    When the system revises the plan
    Then the revision should explicitly address each objection
    And the critic should review the revised plan
    And this cycle should continue until:
      | Termination Condition          |
      | Critic has no more objections  |
      | Maximum iterations reached (5) |
    And the final plan should include a summary of revisions made

  Scenario: Critic approves plan
    Given the critic has reviewed a plan
    When the critic has no objections
    Then the plan status should be marked as "critic-approved"
    And the plan should be presented to the user for review
    And the user should see:
      | User View Element           |
      | Complete plan details       |
      | Critic's approval note      |
      | Summary of iterations       |
      | Options to approve or edit  |

  Scenario: User approves plan without changes
    Given I am reviewing a critic-approved plan
    When I review the plan details
    And I approve the plan without modifications
    Then the plan should be locked as approved
    And the system should proceed to the research and outline stage
    And I should receive confirmation of approval

  Scenario: User requests plan modifications
    Given I am reviewing a critic-approved plan
    When I request changes to the plan
    And I specify what needs to be modified:
      | Modification Type           | Example                                |
      | Structural changes          | "Add a section on case studies"        |
      | Tone adjustment             | "Make it more technical"               |
      | Scope changes               | "Focus more on implementation details" |
      | Research adjustments        | "Include competitor analysis"          |
      | Persona changes             | "Use more authoritative voice"         |
    Then the system should update the plan based on my feedback
    And send the modified plan back through the critic review cycle
    And present the new critic-approved plan to me

  Scenario: User makes direct edits to plan
    Given I am reviewing a critic-approved plan
    When I choose to edit the plan directly
    Then I should be able to modify plan text inline
    And save my changes
    And the system should note "user-modified sections"
    And optionally re-run critic review on modified sections
    And allow me to approve the edited plan

  Scenario: User rejects plan and requests restart
    Given I am reviewing a critic-approved plan
    When I reject the entire plan
    And request starting over
    Then the system should ask what went wrong
    And allow me to modify earlier inputs:
      | Revisable Input         |
      | Output type selection   |
      | Clarifying questions    |
      | Persona selection       |
      | Additional context      |
    And restart the planning process with updated inputs

  Scenario: Maximum critic iterations reached
    Given the plan has gone through 5 critic review cycles
    And the critic still has objections
    When the maximum iteration limit is reached
    Then the system should present the best version of the plan
    And clearly list remaining critic objections
    And explain that iteration limit was reached
    And ask the user whether to:
      | User Option                              |
      | Proceed with current plan despite issues |
      | Make manual edits to address objections  |
      | Start over with different inputs         |

  Scenario: Plan includes multiple output types
    Given I requested multiple output types
    When the system creates the plan
    Then the plan should have sections for each output type
    And specify how they relate to each other:
      | Multi-output Relationship      |
      | Shared research and sources    |
      | Consistent key messages        |
      | Adapted structure per format   |
      | Cross-references between pieces|
    And the critic should verify consistency across outputs

  Scenario: View plan revision history
    Given a plan has been through multiple revisions
    When I choose to view revision history
    Then I should see all versions of the plan
    And what changed in each revision
    And which were critic-driven vs user-driven changes
    And be able to revert to a previous version if desired
