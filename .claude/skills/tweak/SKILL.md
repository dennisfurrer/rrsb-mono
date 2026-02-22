# /tweak — Visual Micro-Adjustment Skill

Use this skill for iterative visual refinements: colors, spacing, sizing, positioning, animations, 3D transforms.

## Before ANY Edit

1. **State the target explicitly**:
   - File path: `src/components/Example/Example.tsx`
   - Element: `.header-container` or `<div className="price-label">`
   - Property: `background-color`, `padding`, `translateY`, etc.

2. **Wait for confirmation if ambiguous**:
   - If my description could match multiple elements, list the candidates and ask which one
   - Example: "I see two headers — the `<TopNav>` component and the `.page-header` div. Which one?"

3. **Never guess spatial directions**:
   - "Up" = lower Y value (toward top of viewport)
   - "Down" = higher Y value (toward bottom of viewport)
   - "Depth" = z-axis (not thickness)
   - If unclear, ask: "Do you mean move it visually upward, or increase its z-index?"

## Making the Change

1. **Surgical edits only**: Change ONLY the specific property mentioned. Do not:
   - Refactor surrounding code
   - "Clean up" adjacent styles
   - Add comments or type annotations
   - Change anything not explicitly requested

2. **Preserve earlier session work**: Never revert or override tweaks applied earlier in this conversation unless I explicitly say "revert" or "undo".

3. **Show what changed**: After editing, briefly confirm:
   ```
   Changed: `src/components/Card.tsx` line 42
   Property: `padding` from `16px` to `24px`
   ```

## Iteration Protocol

- **One change at a time** unless I batch multiple in one message
- **No cascading changes**: If changing X seems to require changing Y, ask first
- **Quick confirmation**: After each tweak, wait for my response before the next one

## Common Pitfalls to Avoid

| Pitfall | Correct Behavior |
|---------|-----------------|
| Editing similar-named file (e.g., `Card.tsx` vs `CardList.tsx`) | Confirm exact file path |
| Changing gradient direction when asked to change color | Only change what's asked |
| Resetting entire style block to change one property | Edit only the target property |
| Confusing `margin` vs `padding`, `width` vs `max-width` | Use exact property from request |
| Moving element when asked to scale it | "Stretch" = scale, not translate |

## Example Interaction

**User**: Make the header background darker

**Claude**: I'll darken the header background. I see two header elements:
1. `TopNav.tsx` → `<nav className="top-nav">` (the fixed navigation bar)
2. `PageHeader.tsx` → `<header className="page-header">` (the page title section)

Which header do you mean?

**User**: The nav bar

**Claude**: Got it. Changing `src/components/TopNav.tsx`:
- Element: `<nav className="top-nav">`
- Property: `background-color`
- From: `#1a1a2e`
- To: `#0d0d1a` (darker)

[Makes the edit]

Changed: `src/components/TopNav.tsx` line 15
Property: `background` from `#1a1a2e` to `#0d0d1a`
