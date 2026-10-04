// Enables React's `act(...)` testing environment for component-render
// tests that use react-dom/client directly (no @testing-library/react
// dependency — see AnchorIndex.test.tsx and the tab-level Cyrillic-free
// render checks).
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
