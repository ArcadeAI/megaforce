Feature: Template Management
  As a content creator
  I want to create, manage, and reuse templates
  So that I can streamline my content creation process

  Background:
    Given I am authenticated on the Megaforce platform

  Scenario: View available templates
    Given I want to see available templates
    When I navigate to the templates library
    Then I should see templates categorized by:
      | Template Category        |
      | Blog Posts               |
      | Social Media             |
      | Marketing                |
      | Technical Documentation  |
      | Academic                 |
      | Business                 |
      | Creative Writing         |
      | Custom                   |
    And each template should display:
      | Template Display Info      |
      | Template name              |
      | Description                |
      | Output type                |
      | Preview/thumbnail          |
      | Usage count                |
      | Rating (if public)         |
      | Creator                    |

  Scenario: Create new template from scratch
    Given I want to create a new template
    When I start creating a template
    Then I should be able to define:
      | Template Definition Fields           |
      | Template name                        |
      | Description                          |
      | Output type                          |
      | Default tone/style settings          |
      | Outline structure                    |
      | Section templates                    |
      | Placeholders and variables           |
      | Required vs optional sections        |
      | Recommended persona                  |
      | Estimated length guidelines          |
    And save the template for future use

  Scenario: Create template from existing session
    Given I have completed a content session
    And want to reuse this structure
    When I choose "Save as template"
    Then the system should:
      | Template Creation from Session       |
      | Extract outline structure            |
      | Preserve section organization        |
      | Convert specific content to placeholders|
      | Retain configuration (tone, persona) |
      | Allow me to name and describe template|
      | Save as reusable template            |
    And make it available in templates library

  Scenario: Use template to start new session
    Given I want to create content using a template
    When I select a template from the library
    Then the system should:
      | Template Application                 |
      | Pre-populate output type             |
      | Pre-configure tone and style         |
      | Load outline structure               |
      | Suggest recommended persona          |
      | Show template-specific guidance      |
      | Allow me to customize before proceeding|
    And start session with template applied

  Scenario: Customize template before using
    Given I have selected a template
    When I customize the template for this session
    Then I should be able to:
      | Template Customization              |
      | Modify outline structure            |
      | Add or remove sections              |
      | Change default settings             |
      | Adjust length guidelines            |
      | Override persona recommendation     |
    And changes apply only to current session
    And original template remains unchanged

  Scenario: Edit existing template
    Given I created a custom template
    When I edit the template
    Then I should be able to modify all template fields
    And save changes to the template
    And see warning if template is used in active sessions
    And choose whether to update active sessions or not

  Scenario: Duplicate template
    Given I want to create a variation of an existing template
    When I duplicate a template
    Then a copy should be created with:
      | Duplicated Template Properties      |
      | All structure and settings          |
      | New name (e.g., "Copy of...")       |
      | Marked as custom/personal           |
      | Editable by me                      |
    And I can modify the copy independently

  Scenario: Delete custom template
    Given I created a custom template
    When I delete the template
    Then the system should confirm deletion
    And warn if template is used in any sessions
    And when I confirm
    Then permanently remove the template
    And not affect sessions already using it

  Scenario: Share template with team
    Given I created a useful template
    When I choose to share with my team
    Then I should be able to:
      | Template Sharing Options            |
      | Make template team-visible          |
      | Set permissions (view/edit/use)     |
      | Add sharing notes                   |
      | Track who uses it                   |
    And team members can see and use the template

  Scenario: Publish template publicly
    Given I created a valuable template
    When I publish it publicly
    Then the system should:
      | Public Template Publishing          |
      | Review template for quality         |
      | Add to public template marketplace  |
      | Allow others to discover and use    |
      | Track usage statistics              |
      | Enable ratings and reviews          |
      | Maintain my attribution             |

  Scenario: Import template
    Given someone shared a template file with me
    When I import the template
    Then the system should:
      | Template Import                     |
      | Validate template format            |
      | Parse template structure            |
      | Check for conflicts with existing   |
      | Add to my templates library         |
      | Preserve all template properties    |
    And notify me of successful import

  Scenario: Export template
    Given I have a template I want to share
    When I export the template
    Then I should receive a template file containing:
      | Export Contents                     |
      | Template structure                  |
      | All configurations                  |
      | Metadata                            |
      | Format compatible with import       |
    And be able to share this file with others

  Scenario: Search and filter templates
    Given I have access to many templates
    When I search for templates
    Then I should be able to:
      | Search and Filter Options           |
      | Search by name or description       |
      | Filter by category                  |
      | Filter by output type               |
      | Filter by creator (my/team/public)  |
      | Sort by usage, rating, or date      |
      | View only favorites                 |
    And see relevant results

  Scenario: Favorite templates
    Given I frequently use certain templates
    When I mark templates as favorites
    Then favorited templates should:
      | Favorite Features                   |
      | Appear at top of templates list     |
      | Be accessible via favorites filter  |
      | Show favorite indicator             |
      | Be quickly accessible               |

  Scenario: Template version control
    Given I edit a template multiple times
    When I view template history
    Then I should see:
      | Version History Display             |
      | All versions of the template        |
      | Timestamp of each version           |
      | Who made changes                    |
      | What changed in each version        |
    And be able to:
      | Version Control Actions             |
      | Compare versions                    |
      | Restore previous version            |
      | Create branch from old version      |

  Scenario: Template with variables
    Given I create a template with variables
    When variables are defined like {{company_name}}, {{product}}
    Then when using the template
    I should be prompted to provide values for each variable
    And the system should:
      | Variable Handling                   |
      | List all required variables         |
      | Show variable descriptions          |
      | Validate variable inputs            |
      | Substitute throughout template      |
      | Preview with substitutions          |

  Scenario: Template with conditional sections
    Given I create a template with conditional sections
    When I define conditions like "Include if technical audience"
    Then when using the template
    I should be asked about each condition
    And the system should:
      | Conditional Logic                   |
      | Evaluate all conditions             |
      | Include/exclude sections accordingly|
      | Show which sections are included    |
      | Allow me to override conditions     |

  Scenario: Rate and review public template
    Given I used a public template
    When I rate and review the template
    Then I should be able to:
      | Rating and Review                   |
      | Give star rating (1-5)              |
      | Write review text                   |
      | Describe use case                   |
      | Submit feedback to creator          |
    And my review should be visible to others

  Scenario: View template analytics
    Given I created templates that others use
    When I view template analytics
    Then I should see:
      | Template Analytics                  |
      | Total usage count                   |
      | Usage over time                     |
      | Average rating                      |
      | Review comments                     |
      | Who is using it (if not anonymous)  |
      | Success rate                        |
      | Common customizations made          |
