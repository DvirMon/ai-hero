---
name: transcription-refinement
description: >
  Transform raw lecture and podcast transcriptions into structured, actionable content.
  Use this skill whenever you receive a lecture transcript, podcast episode transcript,
  webinar recording, or any long-form spoken-word content that needs to be cleaned,
  organized, and distilled. Triggers include: refine this transcript, clean up this
  podcast episode, extract key ideas from this lecture, turn this transcript into a
  summary, or similar requests to condense, structure, or extract insights from
  transcribed audio.
license: MIT
metadata:
  author: Dvir Monajem
  version: '1.0'
  scope: "Universal workflow for all transcript types and domains"
---

# Transcription Refinement Skill

Transform raw lecture transcriptions and podcast episodes into focused, actionable knowledge by removing filler, isolating core concepts, and surfacing practical applications.

## Quick Overview

This skill enables a three-phase workflow:

1. **Content Inventory** — Analyze the full transcription and categorize content by type
2. **Refinement & Summarization** — Condense and restructure into coherent segments
3. **Extraction & Categorization** — Surface key theoretical ideas and practical applications

Result: Clean, organized, usable knowledge extracted from verbose audio.

---

## Phase 1: Initial Analysis & Content Inventory

When you receive a transcription:

### Ask Clarifying Questions (as needed)

Before diving into refinement, confirm:

- **Target Audience**: Beginners, intermediate, or experts?
- **Primary Focus**: Theory, practice, or balanced?
- **Desired Compression**: Concise (50% of original) or moderate (70% of original)?
- **Scope**: Preserve all examples or only essential ones?
- **Emphasis**: Any concepts to highlight or de-emphasize?

### Perform Initial Reading & Mapping

- Read through the full transcription carefully
- Identify content types: core concepts, practical guidance, tangents, opinions, filler
- Flag section transitions and key timestamps
- Note overall subject, scope, and intended audience
- Record any ambiguities to clarify with the user

### Output: Content Breakdown

Present a brief inventory showing:
- Topic overview and scope
- Major sections identified
- Content balance (% theory vs. % practice)
- Any flagged ambiguities or clarification requests

---

## Phase 2: Refinement & Summarization

Once scope is confirmed, refine the transcript by:

### Content Preservation Rules

**KEEP:**
- Core explanations and definitions
- Theoretical frameworks and mental models
- Research findings, statistics, evidence
- Step-by-step processes and methodologies
- Practical examples that illustrate concepts (not personal anecdotes)
- Direct assignments or exercises
- Explicit recommendations and best practices
- Nuanced distinctions between related ideas

**REMOVE:**
- Small talk and conversational fillers ('um', 'so like', repeated 'you know')
- Host opinions ('I think', 'In my opinion', personal preferences)
- Tangential stories unrelated to the main topic
- Unanswered questions or dead-end threads
- Promotional content
- Humor that doesn't illustrate a point
- Repeated information (covered earlier)
- Meta-commentary ('Let's move on to...', 'As we discussed...')
- Filler phrases ('at the end of the day', 'basically', 'sort of')

### Structure & Organization

Organize refined content hierarchically:
- **Concepts** → **Applications** → **Details**
- Use clear headings and logical flow
- Preserve original learning objectives
- Maintain technical accuracy throughout

### Output: Refined Summary

Deliver a condensed, well-structured version that:
- Eliminates all identified filler
- Flows logically without verbal tics
- Preserves core meaning and nuance
- Uses professional, clear language
- Includes section headings for easy scanning

---

## Phase 3: Extraction & Categorization

Once the summary is complete, extract:

### Key Theoretical Ideas (3)

Identify the **3 most important conceptual takeaways**:
- State each as a standalone idea
- Explain briefly why it matters
- Note how it connects to the overall topic
- Cite where it appears in the refined summary

### Practical Applications (3)

Surface **3 actionable items** the audience can implement:
- Exercises or assignments mentioned
- Real-world implementation steps
- Hands-on techniques or workflows
- Decision frameworks or checklists
- Include success criteria or expected outcomes where applicable

### Tailored Extractions (Optional)

Based on user request, also provide:
- **Frameworks Only**: Extracted decision trees, mental models, or methodologies
- **Case Studies**: Real-world examples or studies cited
- **Methodology**: Step-by-step process or workflow
- **Research Highlights**: Key statistics, studies, or evidence
- **Disagreements**: Places where perspectives conflict

---

## Iterative Refinement

After delivery, be ready for follow-up requests:

### Common Follow-up Patterns

| Request | Action |
|---------|--------|
| "Condense further" | Reduce length while preserving all core ideas |
| "Move X section to the front" | Reorganize while maintaining flow |
| "Expand on Y" | Add depth to specific topics |
| "Make it more beginner-friendly" | Simplify jargon, add foundational context |
| "Add more technical detail" | Introduce precise terminology and nuance |
| "Extract only practical items" | Deliver applications without theory |
| "Show only frameworks" | Surface decision trees, mental models, processes |

### Response Template

For each refinement request:
1. Acknowledge what's changing
2. Deliver the adjusted content
3. Highlight key differences from previous version
4. Remain ready for further iteration

---

## Quality Standards

### Accuracy First
- No content is altered or misrepresented — only condensed
- Technical accuracy is preserved throughout
- Citations or attributions remain intact

### Clarity Over Length
- Shorter, clearer explanations are always preferred
- Jargon is explained or simplified as appropriate for audience
- Complex ideas are broken into digestible chunks

### Structure Matters
- Logical hierarchy makes content easier to absorb
- Transitions between ideas are clear
- Headings and organization support scanning and review

### Respect the Source
- Original intent and core message are preserved
- No straw-manning or misrepresentation
- Nuanced positions are maintained even if condensed

### Actionable Results
- Practical applications are clearly distinguishable from theory
- Exercises and implementations are concrete, not vague
- Success criteria are explicit where possible

---

## Example Workflow

**User Input:**
> "Here's a transcript of a 45-minute podcast on productivity systems. Please refine it and focus on practical frameworks."

**Clarification Questions:**
> "Is your audience beginner or experienced? Should I include all 5 systems mentioned, or highlight the top 3 most impactful?"

**User Response:**
> "Beginners. Focus on the top 3 systems and how to implement them."

**Delivery:**
1. **Refined Summary** — 3 systems explained clearly with implementation steps
2. **Key Theoretical Ideas** — Why these systems work, what principles underlie them
3. **Practical Applications** — 3 exercises for beginners to apply each system
4. **Frameworks Extracted** — Simple decision tree for choosing which system fits different scenarios

**User Follow-up:**
> "Great. Now simplify the first system even more — our audience is very new to this."

**Response:**
> Updates the refined summary, reducing jargon and adding foundational context for System 1, plus a step-by-step checklist for immediate implementation.

---

## When to Use This Skill

Use this skill whenever you receive:
- Lecture transcriptions (academic, professional, online courses)
- Podcast episodes (especially educational or interview-based)
- Webinar recordings or presentations
- Conference talk transcripts
- TED talks or similar long-form spoken content
- Audiobook chapters or educational audio
- Meeting or call recordings that need to be distilled
- Any verbatim transcript of spoken content requiring structure and clarity

Do **not** use this skill for:
- Written articles or essays (use general summarization instead)
- Unstructured notes (use note-organization skills instead)
- Technical documentation (use documentation skills instead)
- Creative writing or fiction transcripts

---

## Key Principles

✓ **Accuracy First** — No content altered, only condensed
✓ **Clarity Over Length** — Shorter, clearer explanations preferred
✓ **Structure Matters** — Logical hierarchy aids absorption
✓ **Respect the Source** — Original intent and core message preserved
✓ **Actionable Results** — Practical applications clearly distinguishable from theory
✓ **Iterative Refinement** — Your feedback guides further adjustments

