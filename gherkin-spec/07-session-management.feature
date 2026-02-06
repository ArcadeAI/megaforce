Feature: Session and Project Management
  As a content creator
  I want to manage my content creation sessions
  So that I can work on multiple projects and resume work later

  Background:
    Given I am authenticated on the Megaforce platform

  Scenario: Create new content session
    Given I am on the dashboard
    When I start a new content creation session
    Then a new session should be created with:
      | Session Metadata        |
      | Unique session ID       |
      | Creation timestamp      |
      | Current stage: Initial  |
      | Auto-save enabled       |
    And I should proceed to output type selection

  Scenario: Auto-save session progress
    Given I am working on a content session
    When I complete any step or make changes
    Then the system should automatically save:
      | Auto-saved Data                  |
      | All user inputs                  |
      | Selected options                 |
      | Generated plans and outlines     |
      | Generated content drafts         |
      | Current stage                    |
      | Timestamp of last save           |
    And display "Saved" indicator
    And save should happen within 2 seconds of change

  Scenario: View all my sessions
    Given I have created multiple sessions
    When I view my sessions list
    Then I should see all sessions with:
      | Session List Display         |
      | Session name/title           |
      | Creation date                |
      | Last modified date           |
      | Current stage                |
      | Output type(s)               |
      | Status (in progress, complete)|
      | Preview/thumbnail            |
    And be able to sort and filter sessions

  Scenario: Resume incomplete session
    Given I have a session in progress
    When I select the session to resume
    Then the system should:
      | Resume Actions                       |
      | Load all saved progress              |
      | Restore to exact state when left off |
      | Show summary of what was completed   |
      | Show what's next                     |
      | Allow me to continue                 |
    And I should not lose any work

  Scenario: Name and organize sessions
    Given I have a content session
    When I provide a custom name for the session
    Then the session should be renamed
    And I should be able to:
      | Organization Options        |
      | Add tags                    |
      | Add to folder/category      |
      | Add description             |
      | Mark as favorite            |
      | Archive                     |
    And changes should be saved immediately

  Scenario: Duplicate existing session
    Given I have completed a session
    When I choose to duplicate the session
    Then a new session should be created with:
      | Duplicated Elements                 |
      | Same output type selection          |
      | Same clarifying question answers    |
      | Same persona selection              |
      | Same corpus sources (if applicable) |
    But with fresh:
      | Reset Elements              |
      | Generated plan              |
      | Research and knowledge base |
      | Outline                     |
      | Content                     |
    And I can modify settings before proceeding

  Scenario: Delete session
    Given I have a content session
    When I choose to delete the session
    Then the system should confirm deletion
    And warn about data loss
    And when I confirm
    Then permanently delete the session
    And remove it from my sessions list

  Scenario: Archive completed session
    Given I have completed and published content
    When I archive the session
    Then the session should be moved to archive
    And not appear in active sessions list
    But remain accessible in archive
    And be restorable if needed

  Scenario: Export session for backup
    Given I have a content session
    When I choose to export the session
    Then I should be able to download:
      | Export Content                    |
      | All configuration and inputs      |
      | Generated plans and outlines      |
      | Knowledge base                    |
      | All content versions              |
      | Metadata and timestamps           |
    And format should be importable

  Scenario: Import session from backup
    Given I have an exported session file
    When I import the session
    Then the system should:
      | Import Actions                        |
      | Validate file format                  |
      | Create new session from import        |
      | Restore all data                      |
      | Assign new session ID                 |
      | Preserve original metadata            |
    And notify me of successful import

  Scenario: Session recovery after crash
    Given I was working on a session
    And the application crashed or closed unexpectedly
    When I reopen the application
    Then the system should detect unsaved changes
    And offer to restore the session
    And when I accept
    Then restore to last auto-saved state
    And highlight what was recovered

  Scenario: View session history and versions
    Given I have made multiple revisions in a session
    When I view session history
    Then I should see:
      | Version History Display            |
      | All major versions of content      |
      | Timestamp of each version          |
      | What changed in each version       |
      | Who made changes (if collaborative)|
      | Ability to compare versions        |
      | Ability to restore old version     |

  Scenario: Compare two versions
    Given I have multiple versions in session history
    When I select two versions to compare
    Then I should see a diff view showing:
      | Diff Display                 |
      | Side-by-side comparison      |
      | Highlighted differences      |
      | Added content in green       |
      | Removed content in red       |
      | Modified content in yellow   |
    And be able to selectively merge changes

  Scenario: Set session privacy level
    Given I have a content session
    When I configure privacy settings
    Then I should be able to set:
      | Privacy Level | Description                          |
      | Private       | Only I can access                    |
      | Team          | My team members can access           |
      | Public        | Anyone with link can view (read-only)|
    And privacy should be enforced immediately

  Scenario: Share session with collaborators
    Given I have a content session
    And privacy is set to Team or Public
    When I share the session
    Then I should be able to:
      | Sharing Options                   |
      | Generate shareable link           |
      | Set link expiration               |
      | Set permissions (view/edit)       |
      | Invite specific users by email    |
      | Revoke access                     |
    And collaborators should receive notifications

  Scenario: Search across all sessions
    Given I have many sessions
    When I use the search feature
    Then I should be able to search by:
      | Search Criteria         |
      | Session name            |
      | Tags                    |
      | Content text            |
      | Date range              |
      | Output type             |
      | Persona used            |
      | Status                  |
    And see matching results ranked by relevance

  Scenario: Session storage quota management
    Given I have limited storage quota
    When I approach quota limit
    Then I should be warned at 80% usage
    And shown which sessions consume most space
    And be able to:
      | Quota Management Action      |
      | Delete old sessions          |
      | Archive to external storage  |
      | Compress old session data    |
      | Upgrade storage plan         |
