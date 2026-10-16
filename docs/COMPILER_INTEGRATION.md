# PlacementPro — C-Visualize Compiler Integration Guide

## 1. Overview & Architecture

The **C-Visualize** interactive six-phase C compiler visualizer from `Compiler-main` is seamlessly integrated into **PlacementPro** under:
`PlacementPro → Study Materials → Compiler Design (CD) → Practice`

### Architecture & Request Flow
```
+-----------------------------------------------------------------------------------------+
|                               PLACEMENTPRO FRONTEND                                     |
|  - Embedded within PlacementPro Page Shell (Blue-and-White Theme, Plus Jakarta Sans)    |
|  - /compiler-practice?subject=compiler-design & /study-reader?subject=compiler-design   |
|  - Breadcrumbs: Home > Study Materials > Compiler Design > Practice (C-Visualize)       |
|  - Segmented Switcher: [Theory] <---> [Practice]  +  [Back to Theory] Action           |
|  - 3-Panel Workspace: C Source Editor | 6-Phase Visualizer Tabs | Terminal Console      |
+--------------------------------------------+--------------------------------------------+
                                             | HTTP / AJAX (JWT Cookie Auth)
                                             v
+-----------------------------------------------------------------------------------------+
|                            PLACEMENTPRO EXPRESS BACKEND                                 |
|  - Routes: /api/compiler/* (/info, /compile, /execute, /exercises, /attempts)           |
|  - Static Phase Analyzers (Lexical, AST, Semantics, IR, Optimization, Assembly)         |
|  - MySQL Database: `compiler_jobs`, `compiler_artifacts`, `compiler_exercise_attempts`   |
|  - Fail-Closed Security Policy: Rejects host-side execution if worker is offline        |
+--------------------------------------------+--------------------------------------------+
                                             | HTTP / Bearer Auth (COMPILER_WORKER_TOKEN)
                                             v
+-----------------------------------------------------------------------------------------+
|                         ISOLATED DOCKER COMPILER WORKER                                 |
|  - Service: `Compiler-main/backend/worker` (Dockerized GCC 16 Toolchain)               |
|  - Disposable ephemeral Linux container per job (network=none, read-only root, UID 10001|
|  - CPU, RAM (256MB), process-count (pids-limit=64), time (5s), and output size limits  |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Six Real Compiler Phases

The integrated workspace provides a tabbed inspector covering all six standard compiler phases without simulations or fake data:
1. **Lexical Analysis:** Real ISO C tokenizer analyzing keywords, identifiers, numeric/string literals, operators, comments, and line/column metrics.
2. **Syntax Analysis:** Real C AST parser building a hierarchical `TranslationUnit` syntax tree with function definitions, compound statements, expressions, and grammar violation diagnostics.
3. **Semantic Analysis:** Symbol tables organized by scope (Global, Function, and Block), with identifier types, declaration line/col, and correlated GCC semantic warnings/errors.
4. **Intermediate Representation (IR):** Genuine GCC GIMPLE 3-address code representations (`-fdump-tree-gimple`) with temporary variables (`D.xxxx`) and basic block flow.
5. **Code Optimization:** Side-by-side optimization inspector contrasting `-O0` unoptimized GIMPLE with selected optimization (`-O1`, `-O2`, `-O3`), calculating instruction reduction and detecting constant folding and dead code elimination.
6. **Target Code Generation:** Genuine GCC x86_64 assembly output (`-S -fverbose-asm`) with interactive instruction-by-instruction explanations (opcode, addressing mode, calling convention).
- **Supporting Stages:** GNU Preprocessing (`-E -dD`) and Linker stage diagnostics.

---

## 3. Educational Practice Exercises

Exercises are structured by difficulty in `services/compiler/sampleExercises.js`:
- **🟢 Beginner:** Hello World & Calling Conventions, Variables & Arithmetic Operators, If-Else Conditional Branching, While & For Loop Constructs.
- **🟡 Intermediate:** Function Calls & Stack Frames, Pointers & Memory Addressing, Array Traversal & Indexing, Struct Memory Layout & Padding, Compiler Optimization Exploration, Interactive Standard Input (`scanf`).
- **🔴 Advanced & Labs:** Binary Search & Loop Invariant, [Lab] Debugging Syntax Errors, [Lab] Debugging Semantic Errors, [Lab] Debugging Linker Errors.

---

## 4. Port & Service Configuration

| Service | Host Port | Internal Port | Description |
| :--- | :--- | :--- | :--- |
| **PlacementPro Web App** | `5000` | `5000` | PlacementPro main Node.js/Express server |
| **Compiler API (Optional)** | `5051` | `5050` | Standalone C-Visualize API (if run separately) |
| **Isolated GCC Worker** | `6060` | `6060` | Docker-based isolated compilation worker |

---

## 5. Environment Variables (`PlacementPro/.env`)

Ensure the following variables are present in `PlacementPro/.env`:
```env
# PlacementPro Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=ppro

# JWT Authentication
JWT_SECRET=your_jwt_secret_key

# C-Visualize Isolated Docker Worker
COMPILER_WORKER_URL=http://127.0.0.1:6060
COMPILER_WORKER_TOKEN=placementpro_compiler_worker_secure_secret_2026
```

---

## 6. Database Migrations

Migration file: `PlacementPro/database/compiler_visualize.sql`
Non-destructive migration executed on `ppro` database:
- `compiler_jobs`: Tracks compilation requests, language standard, optimization level, durations, and status.
- `compiler_artifacts`: Stores generated tokens, AST, symbol tables, GIMPLE IR, and assembly.
- `compiler_execution_results`: Stores runtime exit code, stdout, stderr, execution duration, and memory limits.
- `compiler_exercise_attempts`: Persists student exercise submissions, pass/fail status, and attempt timestamps.

---

## 7. Setup & Running Instructions

### Step 1: Start PlacementPro
```bash
cd "PlacementPro"
npm install
npm run dev
```
PlacementPro will start on `http://localhost:5000`.

### Step 2: (Optional for Host Sandbox) Start Docker Compiler Worker
To enable execution of untrusted C programs inside the secure Docker container:
```bash
cd "Compiler-main"
# Start the Docker worker container
docker compose up worker -d
```
When the worker is running, `http://localhost:5000/api/compiler/info` will automatically report `workerOnline: true`.

### Step 3: Run Tests
```bash
cd "PlacementPro"
# Run compiler integration test suite
npm run test:compiler

# Run complete application test suite
npm test
```

---

## 8. Sandbox Security Guarantees

1. **Untrusted Code Execution Isolation:**
   - User-submitted C code is **NEVER** compiled or executed directly on the host Windows machine or inside the PlacementPro Node.js process.
   - All compilation and execution tasks are delegated to the disposable Docker worker container running Linux with restricted capabilities (`--cap-drop=ALL`), non-root execution (`uid=10001`), `read-only` root filesystem, and `network=none`.
2. **Fail-Closed Security Model:**
   - If the Docker worker is offline or unconfigured, the PlacementPro backend immediately returns `HTTP 503` with a clear message: `"Isolated compiler worker is unavailable. Refusing host-side execution for security."`
   - Static Lexical and Syntax AST phases still safely parse and provide immediate educational feedback without executing code.
3. **Resource & Denial-of-Service Caps:**
   - Source size limit: `64 KB`.
   - Output size limit: `512 KB`.
   - Execution timeout: `5000 ms`.
   - Rate limiting: PlacementPro API rate limiter applied to all compiler endpoints.
