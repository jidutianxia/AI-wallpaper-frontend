# AI-Wallpaper Project Theme Standardization Plan

This plan standardizes the current manual theme implementation without introducing external libraries, focusing on code structure, variable unification, and removing "hacky" overrides.

## 1. Architectural Restructuring (Standardization)
### 1.1 Variable Layer Architecture (The "Bridge" Pattern)
Instead of scattering colors in `style.css` and scoped styles, we will establish a strict **Three-Layer Variable System** in a new `src/styles` directory.

- **Layer 1: Primitive Tokens (`tokens.css`)**
  - Defines the raw palette (e.g., `--color-blue-500`, `--color-slate-900`).
  - No logic, just values.
- **Layer 2: Semantic Tokens (`theme.css`)**
  - Maps primitives to intent (e.g., `--app-bg-primary`, `--app-text-secondary`).
  - **Crucial**: This is where light/dark switching happens.
- **Layer 3: Component Bridge (`element-bridge.css`)**
  - **The Magic Fix**: Maps *Element Plus CSS Variables* to *Our Semantic Tokens*.
  - Example: `:root { --el-bg-color: var(--app-bg-primary); }`
  - This eliminates the need for `.dark .el-tag { color: white !important }`. Element Plus components will automatically "drink" from our variable stream.

### 1.2 Directory Reorganization
```text
src/
  styles/
    index.css          # Main entry point (imported in main.js)
    tokens.css         # Raw color palette
    theme.css          # Semantic variables (Light/Dark roots)
    element-bridge.css # Mapping App Vars -> Element Plus Vars
    components.css     # Custom classes (.pill-btn, .glass)
```

### 1.3 State Management Abstraction
- Extract the logic from `App.vue` into a Composable `src/composables/useTheme.js`.
- This separates **Logic** (switching, persistence) from **View** (App.vue template).

## 2. Implementation Roadmap

### Phase 1: Foundation (Structure)
1.  Create `src/styles/` directory.
2.  Move base colors from `style.css` to `tokens.css`.
3.  Create `theme.css` with semantic names (Standardize names like `--card-bg` -> `--app-bg-card`).

### Phase 2: The Bridge (Integration)
1.  Create `element-bridge.css`.
2.  Map `--el-color-primary`, `--el-bg-color`, `--el-text-color-regular` to our new semantic variables.
3.  **Result**: Remove all `.dark .el-xxx` overrides from `style.css` and `App.vue`.

### Phase 3: Cleanup (Refactoring)
1.  Refactor `App.vue` to use `useTheme()`.
2.  Remove the "force override" `<style>` blocks added in the previous session (Tag color fix) because the Bridge will handle it natively.

## 3. Constructive Suggestions (Design System)

1.  **Prefixing**: Use `--app-` prefix for all custom variables to avoid collision with `--el-`.
2.  **Semantic Naming**: Don't use `--color-muted`; use `--app-text-secondary`. Don't use `--card-bg`; use `--app-bg-surface`.
3.  **Removal of `!important`**: By injecting variables at the `:root` level, Element Plus will naturally use them. `!important` should be forbidden in the theme system except for utility classes.
4.  **Tailwind Integration**: Update `tailwind.config.js` to reference the new semantic variables (e.g., `bg-surface` -> `var(--app-bg-surface)`), ensuring Tailwind and Element Plus use the *exact same* color values.

This plan respects your "No External Libs" constraint while solving the "Messy Code" problem permanently.
