"""Prompt building utilities for style transfer."""

from common.schemas import (
    Document,
    OutputSchema,
    ReferenceStyle,
)


def build_related_content_prompt(
    output_schema: OutputSchema,
    reference_docs: list[ReferenceStyle],
    intent: str | None,
    focus: str,
    target_docs: list[Document],
    provider: str = "anthropic",
) -> str:
    """Build a comprehensive prompt for related content generation."""

    # Infer style rules and examples directly from documents
    enhanced_reference_docs = []
    for ref_style in reference_docs:
        enhanced_style = ref_style.model_copy()

        if enhanced_style.documents:
            from style_agent.writing_style_inferrer import (
                infer_few_shot_examples,
                infer_style_rules,
            )

            # Infer style rules and examples
            style_rules = infer_style_rules(enhanced_style.documents, provider)
            few_shot_examples = infer_few_shot_examples(
                enhanced_style.documents, provider
            )

            # Update style definition with inferred data
            if enhanced_style.style_definition:
                enhanced_style.style_definition.style_rules = style_rules
                enhanced_style.style_definition.few_shot_examples = few_shot_examples
            else:
                # Create basic style definition if none exists
                from common.schemas import WritingStyle

                enhanced_style.style_definition = WritingStyle(
                    tone="neutral",
                    formality_level=0.5,
                    sentence_structure="varied",
                    vocabulary_level="moderate",
                    personality_traits=[],
                    writing_patterns={},
                    style_rules=style_rules,
                    few_shot_examples=few_shot_examples,
                )

        enhanced_reference_docs.append(enhanced_style)

    style_info = extract_style_information(enhanced_reference_docs)

    target_info = extract_target_information(target_docs)

    writing_guidance = get_writing_guidance(output_schema.output_type)

    prompt = f"""
You are tasked with creating content that is related to the target documents provided in the <target_content> tag.
It is important to NOT repeat the target content in the generated content, but to use only as a reference.

## Reference Style Information:
{style_info}

<target_content>
{target_info}
</target_content>

## Intent and Focus:
- Intent: {intent or "Not specified"}
- Focus: {focus}
- Output Description: {output_schema.description}

## Writing Style Guidance:
{writing_guidance}

## Instructions:
1. Analyze the reference style characteristics carefully
2. Extract key information from the target content
3. Create content that matches the reference style while conveying the target
   content's message
4. Follow the writing style guidance above
5. Return the content in the exact format specified by the output schema
6. Maintain the original intent and focus while adapting to the new style

Please generate the content now:
"""

    return prompt


def build_generation_prompt(
    output_schema: OutputSchema,
    reference_docs: list[ReferenceStyle],
    intent: str | None,
    focus: str,
    target_docs: list[Document],
    provider: str = "anthropic",
) -> str:
    """Build a comprehensive prompt for content generation."""

    # Infer style rules and examples directly from documents
    enhanced_reference_docs = []
    for ref_style in reference_docs:
        enhanced_style = ref_style.model_copy()

        if enhanced_style.documents:
            from style_agent.writing_style_inferrer import (
                infer_few_shot_examples,
                infer_style_rules,
            )

            # Infer style rules and examples
            style_rules = infer_style_rules(enhanced_style.documents, provider)
            few_shot_examples = infer_few_shot_examples(
                enhanced_style.documents, provider
            )

            # Update style definition with inferred data
            if enhanced_style.style_definition:
                enhanced_style.style_definition.style_rules = style_rules
                enhanced_style.style_definition.few_shot_examples = few_shot_examples
            else:
                # Create basic style definition if none exists
                from common.schemas import WritingStyle

                enhanced_style.style_definition = WritingStyle(
                    tone="neutral",
                    formality_level=0.5,
                    sentence_structure="varied",
                    vocabulary_level="moderate",
                    personality_traits=[],
                    writing_patterns={},
                    style_rules=style_rules,
                    few_shot_examples=few_shot_examples,
                )

        enhanced_reference_docs.append(enhanced_style)

    style_info = extract_style_information(enhanced_reference_docs)

    target_info = extract_target_information(target_docs)

    writing_guidance = get_writing_guidance(output_schema.output_type)

    prompt = f"""
You are tasked with creating content that transfers the style from reference
materials to target content.

## Reference Style Information:
{style_info}

## Target Content Information:
{target_info}

## Intent and Focus:
- Intent: {intent or "Not specified"}
- Focus: {focus}

## Writing Style Guidance:
{writing_guidance}

## Instructions:
1. Analyze the reference style characteristics carefully
2. Extract key information from ALL target documents provided above
3. If multiple documents are provided, synthesize information from all sources to create comprehensive content
4. Create content that matches the reference style while conveying the combined message from all target content
5. Follow the writing style guidance above
6. Return the content in the exact format specified by the output schema
7. Maintain the original intent and focus while adapting to the new style

Please generate the content now:
"""

    # Debug logging to see the actual prompt
    print("🔍 PROMPT DEBUG - Target Documents Count:", len(target_docs))
    print("🔍 PROMPT DEBUG - Full Prompt:")
    print("=" * 80)
    print(prompt)
    print("=" * 80)

    return prompt


def get_writing_guidance(output_type: str) -> str:
    """Get writing style guidance for different output types."""
    guidance = {
        "tweet_single": (
            "Create engaging, concise content suitable for Twitter. "
            "Use hashtags appropriately and make it shareable."
        ),
        "tweet_thread": (
            "Create a connected series of tweets that tell a story. "
            "Number them and make each tweet engaging."
        ),
        "linkedin_post": (
            "Write professional but engaging content. Use bullet points "
            "for readability and end with a call-to-action."
        ),
        "linkedin_comment": (
            "Be professional and constructive. Add value to the "
            "conversation and keep it concise."
        ),
        "blog_post": (
            "Create comprehensive content with proper structure. "
            "Use markdown formatting and include relevant details."
        ),
    }

    return guidance.get(
        output_type,
        "Create well-structured, engaging content appropriate for the platform.",
    )


def extract_style_information(reference_docs: list[ReferenceStyle]) -> str:
    """Extract and format style information from reference documents."""
    style_info = []

    for i, ref_style in enumerate(reference_docs, 1):
        style_info.append(f"### Reference Style {i}: {ref_style.name}")

        if ref_style.description:
            style_info.append(f"Description: {ref_style.description}")

        if ref_style.style_definition:
            style_def = ref_style.style_definition
            style_info.append(f"Tone: {style_def.tone}")
            style_info.append(
                f"Formality Level: {style_def.formality_level:.1f} (0.0-1.0 scale)"
            )
            style_info.append(f"Sentence Structure: {style_def.sentence_structure}")
            style_info.append(f"Vocabulary Level: {style_def.vocabulary_level}")

            if style_def.personality_traits:
                style_info.append(
                    f"Personality Traits: {', '.join(style_def.personality_traits)}"
                )

            if style_def.writing_patterns:
                style_info.append("Writing Patterns:")
                for pattern, value in style_def.writing_patterns.items():
                    style_info.append(f"  - {pattern}: {value}")

            # NEW: Include style rules
            if style_def.style_rules:
                style_info.append("Style Rules:")
                for rule in style_def.style_rules:
                    style_info.append(f"  - {rule}")

            # NEW: Include few-shot examples
            if style_def.few_shot_examples:
                style_info.append("Examples:")
                for j, example in enumerate(style_def.few_shot_examples, 1):
                    style_info.append(f"  Example {j}:")
                    style_info.append(f"    Input: {example.input}")
                    style_info.append(f"    Output: {example.output}")
                    style_info.append("")

        if ref_style.documents:
            style_info.append(
                f"Reference Documents: {len(ref_style.documents)} documents"
            )
            for doc in ref_style.documents:
                style_info.append(f"  - {doc.title or 'Untitled'} ({doc.type.value})")

        style_info.append("")

    return "\n".join(style_info)


def extract_target_information(target_docs: list[Document]) -> str:
    """Extract and format target content information."""
    target_info = []

    for i, doc in enumerate(target_docs, 1):
        target_info.append("<target_document>")
        target_info.append(f"<title>{doc.title or 'Untitled'}</title>")
        target_info.append(f"<type>{doc.type.value}</type>")
        target_info.append(f"<category>{doc.category.value}</category>")
        target_info.append(f"<author>{doc.author or 'Unknown'}</author>")

        if doc.date_published:
            target_info.append(f"<date_published>{doc.date_published}</date_published>")

        if doc.metadata:
            target_info.append("<metadata>")
            for key, value in doc.metadata.items():
                target_info.append(f"<{key}>{value}</{key}>")
            target_info.append("</metadata>")

        if doc.content:
            target_info.append("<content>")
            target_info.append(doc.content)
            target_info.append("</content>")

        target_info.append("</target_document>")

    return "\n".join(target_info)


def get_max_tokens(output_schema: OutputSchema) -> int:
    """Determine appropriate max_tokens based on output schema."""
    output_type = output_schema.output_type

    token_limits = {
        "tweet_single": 100,
        "tweet_thread": 500,
        "linkedin_post": 300,
        "linkedin_comment": 150,
        "blog_post": 2000,
    }

    return token_limits.get(output_type, 2000)
