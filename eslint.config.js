import base from "@cm/config/eslint";

// Fallback config for anything not covered by a more specific config
// (apps/api/eslint.config.js, apps/mobile/eslint.config.js) — mainly
// packages/* source files (e.g. @cm/validation), since ESLint's flat config
// resolution needs a config file reachable from every linted path.
export default [...base];
