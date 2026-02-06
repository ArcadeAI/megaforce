Feature: External Platform Integrations
  As a content creator
  I want to connect Megaforce with other platforms
  So that I can seamlessly publish content and access external data

  Background:
    Given I am authenticated on the Megaforce platform

  Scenario: View available integrations
    Given I want to see what integrations are available
    When I navigate to the integrations page
    Then I should see categories:
      | Integration Category          |
      | Content Management Systems    |
      | Social Media Platforms        |
      | Cloud Storage                 |
      | Knowledge Management          |
      | Analytics Tools               |
      | Collaboration Tools           |
      | Research Databases            |
    And each integration should show:
      | Integration Display Info      |
      | Platform name and logo        |
      | Description                   |
      | Connection status             |
      | Available features            |
      | Setup difficulty              |

  Scenario: Connect WordPress CMS
    Given I want to publish directly to WordPress
    When I set up WordPress integration
    Then I should be prompted for:
      | WordPress Connection Info     |
      | WordPress site URL            |
      | Username or API key           |
      | Password or secret            |
      | Connection name (optional)    |
    And the system should:
      | Connection Process            |
      | Validate credentials          |
      | Test connection               |
      | Fetch site metadata           |
      | Save connection securely      |
      | Confirm successful connection |

  Scenario: Publish content to WordPress
    Given I have WordPress integration set up
    And I have approved content ready to publish
    When I choose to publish to WordPress
    Then I should be able to:
      | WordPress Publishing Options  |
      | Select which site (if multiple)|
      | Set post title                |
      | Choose category               |
      | Add tags                      |
      | Set featured image            |
      | Choose publish status (draft/publish)|
      | Schedule publish time         |
      | Set SEO metadata              |
    And content should be published successfully
    And I should receive confirmation with link to post

  Scenario: Connect Google Drive for corpus
    Given I want to use documents from Google Drive as corpus
    When I connect Google Drive
    Then I should authenticate via OAuth
    And grant necessary permissions
    And be able to:
      | Google Drive Features         |
      | Browse my Drive folders       |
      | Select specific documents     |
      | Select entire folders         |
      | Auto-sync when docs update    |
      | Access shared documents       |

  Scenario: Use Google Drive documents as corpus
    Given Google Drive is connected
    When I select documents from Drive as corpus
    Then the system should:
      | Drive Corpus Processing       |
      | Fetch document contents       |
      | Support Docs, Sheets, PDFs    |
      | Parse and extract text        |
      | Add to knowledge base         |
      | Maintain document references  |
      | Track document versions       |

  Scenario: Connect social media platforms
    Given I want to publish to social media
    When I set up social media integrations
    Then I should be able to connect:
      | Social Media Platforms        |
      | Twitter/X                     |
      | LinkedIn                      |
      | Facebook                      |
      | Instagram                     |
      | Threads                       |
      | Mastodon                      |
    And authenticate each platform
    And manage separate credentials per platform

  Scenario: Publish to multiple social media platforms
    Given I have multiple social media accounts connected
    And I have social media content ready
    When I choose to publish
    Then I should be able to:
      | Multi-platform Publishing     |
      | Select which platforms        |
      | Customize post per platform   |
      | Preview how it looks on each  |
      | Schedule posting time         |
      | Post to all simultaneously    |
      | Or stagger posts across time  |
    And receive confirmation for each platform

  Scenario: Connect Slack for notifications
    Given I want to receive notifications in Slack
    When I set up Slack integration
    Then I should authenticate with Slack
    And be able to:
      | Slack Integration Options     |
      | Choose workspace              |
      | Select notification channel   |
      | Configure what to notify about|
      | Set notification format       |
    And receive test notification to confirm

  Scenario: Receive Slack notifications
    Given Slack integration is set up
    When significant events occur like:
      | Notifiable Events             |
      | Content generation complete   |
      | Critic approval received      |
      | User review required          |
      | Content published             |
      | Errors or issues              |
      | Clarification questions       |
    Then I should receive Slack notification
    And notification should include:
      | Notification Contents         |
      | Event description             |
      | Link to relevant session      |
      | Quick action buttons          |
      | Timestamp                     |

  Scenario: Connect research databases
    Given I want to use academic or research databases
    When I set up research database integration
    Then I should be able to connect:
      | Research Databases            |
      | Google Scholar                |
      | PubMed                        |
      | arXiv                         |
      | IEEE Xplore                   |
      | JSTOR (if institutional)      |
    And use them for deep research

  Scenario: Enhanced research with database access
    Given research databases are connected
    When conducting deep research
    Then the system should:
      | Enhanced Research Process     |
      | Query connected databases     |
      | Access academic papers        |
      | Extract authoritative data    |
      | Include proper citations      |
      | Respect access permissions    |
      | Prioritize peer-reviewed sources|

  Scenario: Connect analytics platforms
    Given I want to track content performance
    When I connect analytics platforms like Google Analytics
    Then I should be able to:
      | Analytics Integration         |
      | Add tracking codes to content |
      | View performance metrics      |
      | Track conversions             |
      | See engagement data           |
      | Import data for improvement   |

  Scenario: Disconnect integration
    Given I have an active integration
    When I choose to disconnect
    Then the system should:
      | Disconnection Process         |
      | Confirm disconnection         |
      | Explain what will stop working|
      | Revoke access tokens          |
      | Remove stored credentials     |
      | Keep historical data          |
    And confirm successful disconnection

  Scenario: Integration authentication expires
    Given I have an active integration
    When the authentication token expires
    Then the system should:
      | Auth Expiration Handling      |
      | Detect authentication failure |
      | Notify me of expired auth     |
      | Prompt to re-authenticate     |
      | Pause integration activities  |
      | Resume after re-auth          |

  Scenario: Integration API error
    Given I have an active integration
    When the external API returns an error
    Then the system should:
      | Integration Error Handling    |
      | Catch and log the error       |
      | Show user-friendly message    |
      | Explain what failed           |
      | Suggest troubleshooting steps |
      | Offer to retry                |
      | Fall back gracefully          |

  Scenario: Webhook integration for custom platforms
    Given I want to integrate with a custom platform
    When I set up a webhook integration
    Then I should be able to:
      | Webhook Configuration         |
      | Specify webhook URL           |
      | Choose events to trigger      |
      | Configure payload format      |
      | Add authentication headers    |
      | Test webhook                  |
    And webhooks should fire on configured events

  Scenario: API key management
    Given I have multiple integrations
    When I manage API keys and credentials
    Then I should be able to:
      | API Key Management            |
      | View all connected accounts   |
      | Rotate credentials            |
      | Set expiration dates          |
      | View last used timestamp      |
      | Revoke specific keys          |
      | Generate new keys             |
    And all credentials should be encrypted

  Scenario: Integration marketplace
    Given I want to discover new integrations
    When I browse the integration marketplace
    Then I should see:
      | Marketplace Display           |
      | Popular integrations          |
      | Recently added                |
      | Search functionality          |
      | Category filters              |
      | User ratings and reviews      |
      | Setup instructions            |
    And be able to request new integrations

  Scenario: Data sync configuration
    Given I have integrations that support sync
    When I configure data synchronization
    Then I should be able to:
      | Sync Configuration            |
      | Choose sync direction         |
      | Set sync frequency            |
      | Select what data to sync      |
      | Enable/disable auto-sync      |
      | View sync history             |
      | Manually trigger sync         |
    And sync should happen reliably

  Scenario: Integration usage limits
    Given integrations have rate limits
    When I approach or exceed limits
    Then the system should:
      | Limit Management              |
      | Track usage against limits    |
      | Warn at 80% of limit          |
      | Queue requests when at limit  |
      | Show current usage stats      |
      | Suggest upgrade if needed     |
      | Respect rate limit resets     |
