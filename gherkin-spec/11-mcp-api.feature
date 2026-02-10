Feature: MCP API and Developer Platform
  As an AI assistant or developer tool
  I want to drive Megaforce programmatically via MCP (Model Context Protocol)
  So that I can create content, manage sessions, and orchestrate workflows from external contexts like Cursor, Claude Code, or custom agents

  Background:
    Given a Megaforce workspace exists
    And the MCP server is running and discoverable

  # ---------------------------------------------------------------------------
  # MCP Server Discovery and Connection
  # ---------------------------------------------------------------------------

  Scenario: AI client discovers Megaforce MCP tools
    Given an AI assistant supports MCP
    When the client connects to the Megaforce MCP server
    Then it should receive a tool manifest listing:
      | Tool Category          | Example Tools                                        |
      | Session management     | create_session, list_sessions, get_session, delete_session |
      | Content flow           | set_output_type, answer_questions, select_persona    |
      | Plan and review        | generate_plan, approve_plan, edit_plan               |
      | Research and outline   | start_research, approve_outline, edit_outline        |
      | Content generation     | generate_content, approve_content, export_content    |
      | One-shot               | create_content                                       |
      | Persona management     | list_personas, create_persona, update_persona        |
      | Template management    | list_templates, use_template                         |
      | Progress and status    | get_session_status, get_progress                     |
    And each tool should include a description and input schema

  Scenario: AI client authenticates with API key
    Given a workspace has generated an API key
    When the MCP client provides the API key during connection
    Then the connection should be authenticated
    And scoped to the workspace associated with the key
    And all subsequent tool calls should execute within that workspace context

  Scenario: AI client connects with invalid credentials
    Given a MCP client attempts to connect
    When the API key is missing or invalid
    Then the server should reject the connection
    And return an authentication error with a clear message
    And no tools should be accessible

  Scenario: API key with restricted permissions
    Given a workspace admin creates an API key with limited scopes
    When the MCP client connects with this restricted key
    Then only tools matching the allowed scopes should be listed
    And attempts to call out-of-scope tools should return a permission error

  # ---------------------------------------------------------------------------
  # Granular Tools — Session Management
  # ---------------------------------------------------------------------------

  Scenario: Create a new session via MCP
    Given an authenticated MCP client
    When the client calls "create_session" with:
      | Parameter   | Value                          |
      | name        | "Q1 Product Launch Blog"       |
      | tags        | ["marketing", "product-launch"] |
    Then a new session should be created
    And the response should include:
      | Response Field    |
      | session_id        |
      | name              |
      | status            |
      | created_at        |
      | current_stage     |
    And the session should appear in the workspace dashboard

  Scenario: List sessions via MCP
    Given an authenticated MCP client
    And the workspace has multiple sessions
    When the client calls "list_sessions" with optional filters:
      | Filter     | Example Value     |
      | status     | "in_progress"     |
      | tags       | ["marketing"]     |
      | limit      | 10                |
      | offset     | 0                 |
    Then the response should include matching sessions
    And each session should include id, name, status, current_stage, and updated_at

  Scenario: Get session details via MCP
    Given an authenticated MCP client
    And a session exists
    When the client calls "get_session" with the session_id
    Then the response should include:
      | Session Detail              |
      | Full session metadata       |
      | Current stage               |
      | Selected output types       |
      | Selected persona(s)         |
      | Clarifying question answers |
      | Plan summary (if generated) |
      | Outline summary (if generated) |
      | Content status              |

  Scenario: Delete session via MCP
    Given an authenticated MCP client
    And a session exists that is not currently generating
    When the client calls "delete_session" with the session_id
    Then the session should be permanently deleted
    And the response should confirm deletion

  Scenario: Resume session via MCP
    Given an authenticated MCP client
    And an incomplete session exists at the "outline_review" stage
    When the client calls "get_session" with the session_id
    Then the response should indicate the current stage is "outline_review"
    And the client can call stage-appropriate tools to continue the workflow

  # ---------------------------------------------------------------------------
  # Granular Tools — Content Creation Flow
  # ---------------------------------------------------------------------------

  Scenario: Set output type via MCP
    Given an authenticated MCP client
    And a session is in the "output_selection" stage
    When the client calls "set_output_type" with:
      | Parameter     | Value                              |
      | session_id    | "<session_id>"                     |
      | output_types  | ["blog post", "social media thread"] |
    Then the session should record the selected output types
    And advance to the "clarifying_questions" stage
    And the response should include the questions the system needs answered

  Scenario: Answer clarifying questions via MCP
    Given an authenticated MCP client
    And a session is in the "clarifying_questions" stage
    When the client calls "answer_questions" with:
      | Parameter          | Value                                      |
      | session_id         | "<session_id>"                              |
      | tone               | "professional but approachable"             |
      | corpus_mode        | "both"                                      |
      | corpus_urls        | ["https://example.com/product-brief"]       |
      | corpus_text        | "Additional context about the product..."   |
      | deep_research      | true                                        |
      | target_audience    | "SaaS product managers"                     |
      | keywords           | ["product launch", "GTM strategy"]          |
      | additional_context | "Focus on B2B angle, avoid consumer framing" |
    Then the session should record all answers
    And advance to the "persona_selection" stage
    And return the list of available personas

  Scenario: Select persona via MCP
    Given an authenticated MCP client
    And a session is in the "persona_selection" stage
    When the client calls "select_persona" with:
      | Parameter        | Value                                      |
      | session_id       | "<session_id>"                              |
      | persona_mapping  | {"blog post": "<persona_id>", "social media thread": "<persona_id_2>"} |
    Then the personas should be assigned to their respective outputs
    And the session should advance to the "plan_creation" stage

  Scenario: Provide corpus documents via MCP
    Given an authenticated MCP client
    And a session is in the "clarifying_questions" stage
    When the client calls "answer_questions" with inline corpus content:
      | Corpus Source Type | Description                                   |
      | corpus_urls        | URLs to fetch and index                       |
      | corpus_text        | Raw text content provided directly             |
      | corpus_rules       | Specific rules or constraints for the content  |
    Then the system should process all provided corpus sources
    And index them into the session's knowledge base
    And the corpus should be prioritized as primary source material

  Scenario: Provide content rules and constraints via MCP
    Given an authenticated MCP client
    When the client calls "answer_questions" with rules:
      | Parameter     | Value                                                    |
      | session_id    | "<session_id>"                                           |
      | rules         | ["Never mention competitor X", "Use metric Y in intro", "Max 1500 words"] |
    Then the rules should be stored as hard constraints for the session
    And the plan, outline, and content generation should respect these rules
    And the critic should verify rule compliance during review

  # ---------------------------------------------------------------------------
  # Granular Tools — Plan Creation and Review
  # ---------------------------------------------------------------------------

  Scenario: Generate plan via MCP
    Given an authenticated MCP client
    And a session is in the "plan_creation" stage
    When the client calls "generate_plan" with:
      | Parameter    | Value          |
      | session_id   | "<session_id>" |
    Then the system should generate a content plan
    And run the critic review cycle
    And the response should include:
      | Plan Response Fields        |
      | plan_id                     |
      | plan_content                |
      | critic_approved             |
      | critic_feedback             |
      | critic_iterations_used      |
      | awaiting_approval           |

  Scenario: Approve plan via MCP
    Given an authenticated MCP client
    And a session has a critic-approved plan awaiting user approval
    When the client calls "approve_plan" with:
      | Parameter    | Value          |
      | session_id   | "<session_id>" |
    Then the plan should be marked as approved
    And the session should advance to the "research_and_outline" stage

  Scenario: Edit plan before approving via MCP
    Given an authenticated MCP client
    And a session has a plan awaiting approval
    When the client calls "edit_plan" with:
      | Parameter    | Value                                           |
      | session_id   | "<session_id>"                                  |
      | instructions | "Add a section about competitive differentiation" |
    Then the system should revise the plan incorporating the edits
    And re-run the critic review cycle
    And return the updated plan for approval

  Scenario: Reject plan and request regeneration via MCP
    Given an authenticated MCP client
    And a session has a plan awaiting approval
    When the client calls "generate_plan" with:
      | Parameter    | Value                                       |
      | session_id   | "<session_id>"                              |
      | instructions | "Start fresh with a more data-driven angle" |
    Then the system should discard the current plan
    And generate a new plan from scratch
    And run the critic review cycle on the new plan

  # ---------------------------------------------------------------------------
  # Granular Tools — Research and Outline
  # ---------------------------------------------------------------------------

  Scenario: Start research and outline generation via MCP
    Given an authenticated MCP client
    And a session is in the "research_and_outline" stage
    When the client calls "start_research" with:
      | Parameter    | Value          |
      | session_id   | "<session_id>" |
    Then the system should:
      | Research Actions                         |
      | Execute deep research (if enabled)       |
      | Process corpus sources                   |
      | Build the knowledge base                 |
      | Generate a content outline               |
      | Run critic review on the outline         |
    And the response should include the outline and sources summary

  Scenario: Approve outline via MCP
    Given an authenticated MCP client
    And a session has a critic-approved outline awaiting approval
    When the client calls "approve_outline" with:
      | Parameter    | Value          |
      | session_id   | "<session_id>" |
    Then the outline should be marked as approved
    And the session should advance to the "content_generation" stage

  Scenario: Edit outline before approving via MCP
    Given an authenticated MCP client
    And a session has an outline awaiting approval
    When the client calls "edit_outline" with:
      | Parameter    | Value                                         |
      | session_id   | "<session_id>"                                |
      | instructions | "Move the case study section before the FAQ"  |
    Then the system should revise the outline
    And re-run the critic review cycle
    And return the updated outline for approval

  # ---------------------------------------------------------------------------
  # Granular Tools — Content Generation
  # ---------------------------------------------------------------------------

  Scenario: Generate content via MCP
    Given an authenticated MCP client
    And a session is in the "content_generation" stage
    When the client calls "generate_content" with:
      | Parameter    | Value          |
      | session_id   | "<session_id>" |
    Then the system should generate content following the approved outline
    And apply the selected persona(s) writing style
    And enforce any rules or constraints
    And run the critic review cycle
    And return the generated content for approval

  Scenario: Approve content via MCP
    Given an authenticated MCP client
    And a session has critic-approved content awaiting approval
    When the client calls "approve_content" with:
      | Parameter    | Value          |
      | session_id   | "<session_id>" |
    Then the content should be marked as final
    And the session should move to the "complete" stage
    And the response should include export options

  Scenario: Request content revisions via MCP
    Given an authenticated MCP client
    And a session has content awaiting approval
    When the client calls "generate_content" with revision instructions:
      | Parameter    | Value                                              |
      | session_id   | "<session_id>"                                    |
      | instructions | "Make the introduction more compelling, shorten section 3" |
    Then the system should revise the content
    And re-run the critic review cycle
    And return the updated content for approval

  Scenario: Export content via MCP
    Given an authenticated MCP client
    And a session has approved content
    When the client calls "export_content" with:
      | Parameter    | Value          |
      | session_id   | "<session_id>" |
      | format       | "markdown"     |
    Then the response should include the full content in the requested format
    And supported formats should include:
      | Format     |
      | markdown   |
      | html       |
      | plain_text |
      | json       |

  # ---------------------------------------------------------------------------
  # One-Shot Content Generation
  # ---------------------------------------------------------------------------

  Scenario: Generate content in one shot via MCP
    Given an authenticated MCP client
    When the client calls "create_content" with all parameters:
      | Parameter          | Value                                           |
      | name               | "Weekly Newsletter #42"                         |
      | output_types       | ["newsletter"]                                  |
      | tone               | "friendly and informative"                      |
      | corpus_urls        | ["https://example.com/updates"]                 |
      | corpus_text        | "Key announcements this week..."                |
      | deep_research      | false                                           |
      | persona_id         | "<persona_id>"                                  |
      | target_audience    | "Existing customers"                            |
      | rules              | ["Keep under 800 words", "Include CTA at end"]  |
      | auto_approve       | true                                            |
      | export_format      | "html"                                          |
    Then the system should run the entire pipeline:
      | Pipeline Stage              | Behavior              |
      | Output type selection       | Auto-configured       |
      | Clarifying questions        | Auto-answered         |
      | Persona selection           | Auto-selected         |
      | Plan creation               | Generated and reviewed |
      | Research and outline        | Generated and reviewed |
      | Content generation          | Generated and reviewed |
    And return the final content in the requested format
    And include a session_id for the created session

  Scenario: One-shot generation with manual approval gates
    Given an authenticated MCP client
    When the client calls "create_content" with auto_approve set to false
    Then the pipeline should pause at the first approval gate (plan review)
    And the response should include:
      | Response Fields             |
      | session_id                  |
      | current_stage               |
      | plan_content                |
      | awaiting_approval: true     |
    And the client should use granular tools to approve and continue

  Scenario: One-shot generation with partial parameters
    Given an authenticated MCP client
    When the client calls "create_content" with only:
      | Parameter      | Value                      |
      | output_types   | ["blog post"]              |
      | corpus_text    | "Here is the source material..." |
      | auto_approve   | true                       |
    Then the system should use defaults for missing parameters:
      | Parameter          | Default Behavior                 |
      | tone               | Inferred from corpus             |
      | persona            | Neutral Professional default     |
      | deep_research      | false                            |
      | target_audience    | General                          |
      | export_format      | markdown                         |
    And complete the full pipeline with defaults applied

  # ---------------------------------------------------------------------------
  # Approval Gate Configuration
  # ---------------------------------------------------------------------------

  Scenario: Configure auto-approve after critic passes
    Given an authenticated MCP client
    And a session exists
    When the client calls "create_session" or "create_content" with:
      | Parameter      | Value   |
      | auto_approve   | true    |
    Then all approval gates should be automatically passed once the critic approves
    And the pipeline should run end-to-end without pausing
    And each stage result should still be included in the session history

  Scenario: Configure selective auto-approve
    Given an authenticated MCP client
    When the client calls "create_session" with:
      | Parameter            | Value                                       |
      | auto_approve_stages  | ["plan", "outline"]                         |
    Then the plan and outline stages should auto-approve after critic passes
    But the content stage should still pause for manual approval
    And the client must explicitly call "approve_content" to finalize

  Scenario: Override auto-approve for a specific stage
    Given an authenticated MCP client
    And a session is configured with auto_approve: true
    When the client calls "generate_plan" with:
      | Parameter      | Value   |
      | pause_for_review | true  |
    Then this specific stage should pause for manual approval
    And the session-level auto_approve should resume for subsequent stages

  # ---------------------------------------------------------------------------
  # Persona Management via MCP
  # ---------------------------------------------------------------------------

  Scenario: List personas via MCP
    Given an authenticated MCP client
    When the client calls "list_personas"
    Then the response should include all workspace personas with:
      | Persona Fields        |
      | persona_id            |
      | name                  |
      | description           |
      | writing_style         |
      | tone                  |
      | vocabulary_level      |
      | perspective           |
      | is_custom             |

  Scenario: Create persona via MCP
    Given an authenticated MCP client
    When the client calls "create_persona" with:
      | Parameter            | Value                                        |
      | name                 | "DevRel Advocate"                            |
      | writing_style        | "Technical yet accessible, uses analogies"   |
      | tone                 | "enthusiastic and helpful"                   |
      | vocabulary_level     | "technical"                                  |
      | perspective          | "first_person"                               |
      | sample_text          | "Let me walk you through how this works..."  |
      | style_guide_text     | "Always explain jargon. Use code examples."  |
    Then a new persona should be created in the workspace
    And the response should include the persona_id
    And the persona should be available for selection in sessions

  Scenario: Update persona via MCP
    Given an authenticated MCP client
    And a custom persona exists
    When the client calls "update_persona" with modified fields
    Then the persona should be updated
    And the response should confirm the changes
    And future sessions should use the updated persona

  Scenario: Delete persona via MCP
    Given an authenticated MCP client
    And a custom persona exists with no active session dependencies
    When the client calls "delete_persona" with the persona_id
    Then the persona should be permanently deleted
    And the response should confirm deletion

  # ---------------------------------------------------------------------------
  # Template Management via MCP
  # ---------------------------------------------------------------------------

  Scenario: List templates via MCP
    Given an authenticated MCP client
    When the client calls "list_templates" with optional filters:
      | Filter        | Example Value      |
      | category      | "marketing"        |
      | output_type   | "blog post"        |
    Then the response should include matching templates with:
      | Template Fields     |
      | template_id         |
      | name                |
      | description         |
      | output_type         |
      | category            |
      | usage_count         |

  Scenario: Start session from template via MCP
    Given an authenticated MCP client
    When the client calls "use_template" with:
      | Parameter     | Value             |
      | template_id   | "<template_id>"   |
      | variables     | {"company_name": "Acme", "product": "Widget Pro"} |
    Then a new session should be created pre-populated from the template
    And template variables should be substituted
    And the response should include the session_id and pre-filled configuration
    And the client can proceed with the workflow or override any defaults

  # ---------------------------------------------------------------------------
  # Progress Tracking — Streaming and Polling
  # ---------------------------------------------------------------------------

  Scenario: Poll session progress via MCP
    Given an authenticated MCP client
    And a session is actively generating content
    When the client calls "get_progress" with:
      | Parameter    | Value          |
      | session_id   | "<session_id>" |
    Then the response should include:
      | Progress Fields                    |
      | current_stage                      |
      | stage_progress_percent             |
      | active_sub_tasks                   |
      | estimated_time_remaining           |
      | last_updated                       |
      | pending_clarifications (if any)    |

  Scenario: Receive streaming progress via MCP notifications
    Given an authenticated MCP client
    And the client has subscribed to session notifications
    When a long-running operation is in progress (research, generation)
    Then the server should emit MCP notifications including:
      | Notification Type        | Payload                              |
      | stage_changed            | New stage name and timestamp         |
      | research_progress        | Sources found, percentage complete   |
      | generation_progress      | Sections completed, current section  |
      | critic_iteration         | Iteration number, feedback summary   |
      | clarification_needed     | Question text and context            |
      | stage_complete           | Stage result summary                 |
      | error                    | Error type and message               |
    And notifications should be emitted in real-time as events occur

  Scenario: Subscribe to session notifications
    Given an authenticated MCP client
    And a session exists
    When the client subscribes to notifications for a session_id
    Then the client should receive all subsequent events for that session
    And be able to unsubscribe at any time

  Scenario: Respond to clarification request during generation
    Given an authenticated MCP client
    And a notification of type "clarification_needed" is received
    When the client calls "answer_clarification" with:
      | Parameter          | Value                                      |
      | session_id         | "<session_id>"                             |
      | clarification_id   | "<clarification_id>"                       |
      | answer             | "Focus on the enterprise use case"         |
    Then the sub-agent should incorporate the answer
    And resume generation
    And a "clarification_resolved" notification should be emitted

  Scenario: Decline clarification request
    Given an authenticated MCP client
    And a notification of type "clarification_needed" is received
    When the client calls "answer_clarification" with:
      | Parameter          | Value                    |
      | session_id         | "<session_id>"          |
      | clarification_id   | "<clarification_id>"   |
      | skip               | true                    |
    Then the sub-agent should make a reasonable assumption
    And mark the relevant section as "pending user review"
    And continue generation

  # ---------------------------------------------------------------------------
  # MCP Resource Exposure
  # ---------------------------------------------------------------------------

  Scenario: Access session data as MCP resource
    Given an authenticated MCP client
    When the client reads the resource "megaforce://sessions/<session_id>"
    Then it should receive the full session state including:
      | Resource Content               |
      | Session metadata               |
      | Current stage and status       |
      | All configuration              |
      | Generated plan (if exists)     |
      | Generated outline (if exists)  |
      | Generated content (if exists)  |
      | Knowledge base summary         |

  Scenario: Access persona as MCP resource
    Given an authenticated MCP client
    When the client reads the resource "megaforce://personas/<persona_id>"
    Then it should receive the full persona definition
    And the style guide content if one exists

  Scenario: Access template as MCP resource
    Given an authenticated MCP client
    When the client reads the resource "megaforce://templates/<template_id>"
    Then it should receive the full template definition
    And variable definitions and default values

  # ---------------------------------------------------------------------------
  # Error Handling — MCP Specific
  # ---------------------------------------------------------------------------

  Scenario: Tool call with invalid session ID
    Given an authenticated MCP client
    When the client calls any tool with a non-existent session_id
    Then the response should include an error:
      | Error Field    | Value                          |
      | code           | "session_not_found"            |
      | message        | "Session <id> does not exist"  |
    And no state should be modified

  Scenario: Tool call at wrong stage
    Given an authenticated MCP client
    And a session is in the "plan_creation" stage
    When the client calls "approve_outline"
    Then the response should include an error:
      | Error Field    | Value                                              |
      | code           | "invalid_stage"                                    |
      | message        | "Session is in 'plan_creation', expected 'outline_review'" |
      | current_stage  | "plan_creation"                                    |
    And the session state should not change

  Scenario: Rate limit exceeded on MCP tools
    Given an authenticated MCP client
    When the client exceeds the API rate limit
    Then the response should include an error:
      | Error Field       | Value                         |
      | code              | "rate_limit_exceeded"         |
      | retry_after_ms    | Time until rate limit resets  |
    And subsequent calls within the window should also be rejected

  Scenario: Generation fails mid-pipeline
    Given an authenticated MCP client
    And content generation is in progress
    When the underlying AI model returns an error
    Then a notification of type "error" should be emitted
    And the session should preserve all progress up to the failure point
    And the client should be able to retry the failed stage
    And the response should include:
      | Error Fields           |
      | code                   |
      | message                |
      | failed_stage           |
      | session_id             |
      | recoverable: true      |

  Scenario: Concurrent tool calls on same session
    Given an authenticated MCP client
    When two tool calls modify the same session simultaneously
    Then the server should serialize the operations
    And the second call should either queue or return a conflict error:
      | Error Field    | Value                                    |
      | code           | "session_busy"                           |
      | message        | "Session is processing another operation" |
    And no data should be corrupted

  # ---------------------------------------------------------------------------
  # Quota and Usage
  # ---------------------------------------------------------------------------

  Scenario: Check API usage via MCP
    Given an authenticated MCP client
    When the client calls "get_usage"
    Then the response should include:
      | Usage Metric               |
      | Sessions created today     |
      | Content generations today  |
      | API calls this period      |
      | Storage used               |
      | Rate limit remaining       |

  Scenario: Quota exceeded during one-shot generation
    Given an authenticated MCP client
    And the workspace has reached its generation quota
    When the client calls "create_content"
    Then the response should include an error:
      | Error Field    | Value                              |
      | code           | "quota_exceeded"                   |
      | message        | "Monthly generation quota reached" |
      | quota_resets    | ISO 8601 timestamp                |
    And no session should be created
