# PlacementPro Versant Module

A separate MVC module for a Versant-style automated English communication round.

Included:
- Admin test/content management
- Six speaking sections
- Reference audio upload
- Unique assignment access codes
- Student microphone readiness
- MediaRecorder speech capture
- No-backtracking server validation
- Silence auto-stop
- Full-screen/tab-switch events
- Whisper speech-to-text through Groq
- LLM/local grading
- WPM and pause metrics
- CEFR-style result
- Admin result view

It intentionally does not modify the existing PlacementPro exam/proctoring files.

---

# C-Visualize: Compiler Design Practice Module
An interactive 6-phase C compiler visualizer directly integrated into **PlacementPro → Study Materials → Compiler Design → Practice**.

### Features:
- Seamlessly embedded in PlacementPro's page shell with blue-and-white theme and breadcrumb navigation.
- Theory ↔ Practice segmented mode switcher and "Back to Theory" navigation.
- Real 6 compiler phases: Lexical Tokens, Syntax AST, Semantic Symbol Table, GIMPLE 3-Address Code IR, Optimization Comparison, and x86_64 Assembly.
- Categorized practice exercises with difficulty filters (Beginner, Intermediate, Advanced & Labs).
- Fail-closed Docker sandbox security architecture refusing unsafe host-side execution.
- Comprehensive integration test suite: `npm run test:compiler`.

See full architecture and setup guide in [docs/COMPILER_INTEGRATION.md](docs/COMPILER_INTEGRATION.md).
