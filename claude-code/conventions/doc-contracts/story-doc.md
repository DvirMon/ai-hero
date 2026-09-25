# Story doc comment

The JSDoc block above a story host class or a `.stories.ts` export. Storybook renders it as
the story's description. Written for a consumer learning how to use the feature — not for
the person who built it.

## Shape

    /**
     * <Title>
     *
     * <Demonstrates>
     *
     * <Caveat — optional, at most one>
     */

- **Title** — 3-8 words, noun phrase. `Table with client-side filtering`. Never "This story shows…".
- **Demonstrates** — 1-2 sentences, 20-45 words. Name the API that turns the behavior on.
  If interactive, give one concrete action: "Type in the customer box and watch the row count follow."
- **Caveat** — 1-2 sentences, only when it changes what a consumer must do in production.
  If it applies to one line of the body, put it on that line instead.

Budget: 3-8 lines, 25-60 words. Hard ceiling 10 lines. Kitchen-sink stories get *less*, not more.

## Never in this block

Design rationale. Why this API over another. Peer-library comparison. ADR references.
D-numbers or decision history. Internal mechanics. Restating what the code below already says.

Commented-out API alternatives (`// enableGrouping: false, // default true`) belong at the
call site inside the body, not here.

## Example

    /**
     * Table with client-side filtering
     *
     * Per-column inputs and a quick filter, all driven by `createFilters()`
     * feeding `withFiltering()`. Type in the customer box and watch the row
     * count follow.
     *
     * Reset restores the declared defaults; Clear all empties every criterion.
     */
