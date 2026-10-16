/**
 * PlacementPro Theory Learning Library - Systems & Theoretical Computer Science
 * Covers:
 * 1. Compiler Design: 6 Compiler Phases & Statement Tracing
 * 2. Theory of Computation (TOC): DFA vs NFA, Chomsky Hierarchy & Turing Machines
 * 3. Computer Organization & Architecture (COA): Instruction Pipelining & Cache Mapping
 * 4. Software Engineering: SDLC, Agile Scrum, Design Patterns & Testing
 * 5. Web Development: REST Architecture, JWT vs Sessions & Critical Rendering Path
 * 6. Discrete Mathematics: Set Relations, Propositional Logic & Graph Theory
 */

module.exports = {
  // Compiler Design
  'compiler-design': [
    {
      chapterTitle: '1. Compiler Phases & Statement Tracing',
      chapterDescription: 'Complete translation pipeline from source characters to optimized machine assembly.',
      topics: [
        {
          title: 'Phases of a Compiler and Tracing a Sample Assignment Statement',
          slug: 'phases-of-a-compiler-and-statement-tracing',
          summary: 'Trace the sample source statement position = initial + rate * 60 through Lexical, Syntax, Semantic, Intermediate Code, Optimization, and Target Assembly generation.',
          minutes: 19,
          video_url: 'https://www.youtube.com/watch?v=Qkwj65l_96I',
          video_title: 'Phases of a Compiler - Gate Smashers',
          video_source: 'Gate Smashers',
          video_objective: 'Understand tokenization, Abstract Syntax Trees (AST), type checking, Three-Address Code (TAC), register allocation, and symbol table management.',
          content: `
            <div class="callout callout-def">
              <strong>1. Definition & Core Meaning:</strong>
              A <strong>Compiler</strong> is a complex software system that translates a program written in a high-level source language (e.g., C, Java) into an equivalent program in a low-level target machine language (e.g., x86 assembly, ARM, machine code) while detecting programmer errors and optimizing resource execution.
            </div>

            <h2>2. Why the Concept Is Needed</h2>
            <p>CPUs can only execute primitive electrical microcode representing binary opcodes (e.g., <code>01001000 10001001</code>). Human programmers think in rich mathematical abstractions, variable names, loops, and types. A compiler bridges this cognitive divide through a structured <strong>6-phase analysis-synthesis pipeline</strong>.</p>

            <h2>3. Tracing the Sample Statement Through All 6 Compiler Phases</h2>
            <p>We trace the canonical assignment statement across the entire pipeline:</p>
            <pre class="code-block"><code>position = initial + rate * 60;</code></pre>

            <h3>Phase 1: Lexical Analysis (Scanning)</h3>
            <p>The Lexical Analyzer reads the linear stream of source characters from left to right and groups them into meaningful token units <code>&lt;token_name, attribute_value&gt;</code>, stripping whitespace and comments:</p>
            <ul>
              <li><code>&lt;id, 1&gt;</code> (points to symbol table entry for "position")</li>
              <li><code>&lt;assign_op, =&gt;</code></li>
              <li><code>&lt;id, 2&gt;</code> (points to symbol table entry for "initial")</li>
              <li><code>&lt;add_op, +&gt;</code></li>
              <li><code>&lt;id, 3&gt;</code> (points to symbol table entry for "rate")</li>
              <li><code>&lt;mult_op, *&gt;</code></li>
              <li><code>&lt;number, 60&gt;</code></li>
            </ul>

            <h3>Phase 2: Syntax Analysis (Parsing)</h3>
            <p>Imposes a hierarchical context-free grammar structure over the token stream, producing a <strong>Parse Tree / Abstract Syntax Tree (AST)</strong> verifying operator precedence (multiplication binds tighter than addition):</p>
            <pre class="code-block"><code>        =
       / \\
     id1   +
          / \\
        id2   *
             / \\
           id3  60</code></pre>

            <h3>Phase 3: Semantic Analysis (Type Checking)</h3>
            <p>Verifies language semantic consistency and type compatibility using the Symbol Table. If <code>rate</code> is declared as a floating-point <code>float</code>, the integer constant <code>60</code> must undergo implicit type coercion into <code>60.0</code> (int-to-float conversion):</p>
            <pre class="code-block"><code>        =
       / \\
     id1   +
          / \\
        id2   *
             / \\
           id3  inttofloat(60)</code></pre>

            <h3>Phase 4: Intermediate Code Generation (ICG)</h3>
            <p>Translates the validated AST into a machine-independent intermediate representation, typically <strong>Three-Address Code (TAC)</strong> where each instruction has at most one operator and three memory operands:</p>
            <pre class="code-block"><code>t1 = inttofloat(60)
t2 = id3 * t1
t3 = id2 + t2
id1 = t3</code></pre>

            <h3>Phase 5: Machine-Independent Code Optimization</h3>
            <p>Eliminates redundant operations and propagates constants at compile-time (Constant Folding):</p>
            <pre class="code-block"><code>t1 = id3 * 60.0
id1 = id2 + t1</code></pre>

            <h3>Phase 6: Target Code Generation &amp; Register Allocation</h3>
            <p>Maps intermediate variables into physical CPU hardware registers (e.g., <code>R1, R2</code>) and generates native assembly:</p>
            <pre class="code-block"><code>LDF  R2, id3         ; Load float 'rate' into Register 2
MULF R2, R2, #60.0   ; Multiply R2 by 60.0
LDF  R1, id2         ; Load float 'initial' into Register 1
ADDF R1, R1, R2      ; Add R2 into R1
STF  id1, R1         ; Store result into 'position'</code></pre>

            <h2>4. Architectural Diagram: 6-Phase Compiler Pipeline</h2>
            <div style="margin: 24px 0; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center;">
              <svg viewBox="0 0 680 340" width="100%" height="auto" style="max-width: 640px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <text x="340" y="25" text-anchor="middle" font-size="14" font-weight="bold" fill="#1e293b">COMPILER PHASES &amp; SYMBOL TABLE ARCHITECTURE</text>

                <!-- Symbol Table Pillar on Left -->
                <rect x="30" y="50" width="130" height="270" rx="6" fill="#eff6ff" stroke="#2563eb" stroke-width="1.5" />
                <text x="95" y="80" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e40af">SYMBOL</text>
                <text x="95" y="98" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e40af">TABLE</text>
                <text x="95" y="125" text-anchor="middle" font-size="9" fill="#475569">Variable names,</text>
                <text x="95" y="140" text-anchor="middle" font-size="9" fill="#475569">types, scope,</text>
                <text x="95" y="155" text-anchor="middle" font-size="9" fill="#475569">memory offsets</text>

                <!-- 6 Phases vertically -->
                <!-- P1 -->
                <rect x="200" y="50" width="300" height="36" rx="4" fill="#ffffff" stroke="#3b82f6" />
                <text x="350" y="73" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af">1. Lexical Analyzer (Scanner &rarr; Tokens)</text>

                <!-- P2 -->
                <rect x="200" y="95" width="300" height="36" rx="4" fill="#ffffff" stroke="#3b82f6" />
                <text x="350" y="118" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af">2. Syntax Analyzer (Parser &rarr; Parse Tree)</text>

                <!-- P3 -->
                <rect x="200" y="140" width="300" height="36" rx="4" fill="#ffffff" stroke="#3b82f6" />
                <text x="350" y="163" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af">3. Semantic Analyzer (Type Checker &rarr; AST)</text>

                <!-- P4 -->
                <rect x="200" y="185" width="300" height="36" rx="4" fill="#ffffff" stroke="#3b82f6" />
                <text x="350" y="208" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af">4. Intermediate Code Generator (Three-Address Code)</text>

                <!-- P5 -->
                <rect x="200" y="230" width="300" height="36" rx="4" fill="#ffffff" stroke="#3b82f6" />
                <text x="350" y="253" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af">5. Code Optimizer (Constant Folding / Dead Code)</text>

                <!-- P6 -->
                <rect x="200" y="275" width="300" height="36" rx="4" fill="#ffffff" stroke="#3b82f6" />
                <text x="350" y="298" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af">6. Target Code Generator (Assembly / Machine Binary)</text>

                <!-- Connecting Lines -->
                <line x1="160" y1="180" x2="200" y2="180" stroke="#2563eb" stroke-dasharray="4" />
              </svg>
              <div style="font-size: 0.85rem; color: #64748b; margin-top: 8px;">Figure 7.1: The 6-Phase Pipeline of Modern Optimizing Compilers</div>
            </div>

            <h2>5. Multiple Choice Questions (MCQ)</h2>
            <div class="mcq-container">
              <div class="mcq-card">
                <div class="mcq-header">
                  <span class="mcq-badge">Compiler Design MCQ</span>
                  <span style="font-size:0.8rem; color:var(--study-text-muted);">University &amp; GATE Exam</span>
                </div>
                <div class="mcq-question">
                  Which compiler phase is primarily responsible for detecting type mismatches, such as attempting to add an array pointer to a struct in C?
                </div>
                <div class="mcq-options-list">
                  <div class="mcq-option"><span class="mcq-option-letter">A)</span> <span>Lexical Analysis</span></div>
                  <div class="mcq-option"><span class="mcq-option-letter">B)</span> <span>Syntax Analysis</span></div>
                  <div class="mcq-option"><span class="mcq-option-letter">C)</span> <span>Semantic Analysis</span></div>
                  <div class="mcq-option"><span class="mcq-option-letter">D)</span> <span>Intermediate Code Generation</span></div>
                </div>
                <button type="button" class="mcq-reveal-btn">Show Answer &amp; Detailed Explanation</button>
                <div class="mcq-explanation" style="display: none;">
                  <strong>Correct Answer: C) Semantic Analysis</strong><br>
                  <em>Explanation:</em> The syntax analyzer only checks structural grammar compliance (e.g., whether an expression conforms to <code>ID + ID</code>). The Semantic Analyzer validates whether those two identifiers have compatible types for addition according to language rules.
                </div>
              </div>
            </div>
          `
        }
      ]
    }
  ],

  // Theory of Computation (TOC)
  toc: [
    {
      chapterTitle: '1. Finite Automata & Computability',
      chapterDescription: 'Deterministic and Non-Deterministic Finite Automata, Chomsky hierarchy, and Turing decidability.',
      topics: [
        {
          title: 'DFA vs NFA, Subset Construction, and the Chomsky Hierarchy',
          slug: 'dfa-vs-nfa-and-chomsky-hierarchy',
          summary: 'Explore formal 5-tuple definitions of DFA and NFA, convert NFA to DFA via Powerset Construction, and evaluate the 4 levels of the Chomsky Hierarchy.',
          minutes: 17,
          video_url: 'https://www.youtube.com/watch?v=eq3Gkz_qDq0',
          video_title: 'DFA vs NFA - Conversion by Subset Construction - Gate Smashers',
          video_source: 'Gate Smashers',
          video_objective: 'Understand formal language theory, state transition functions delta, powerset subset construction, and Turing machine decidability.',
          content: `
            <div class="callout callout-def">
              <strong>1. Definition & Core Meaning:</strong>
              A <strong>Finite Automaton (FA)</strong> is an abstract mathematical machine that transitions between a finite set of internal states in response to a sequence of input symbols. A <strong>Deterministic Finite Automaton (DFA)</strong> has exactly one unique transition for each state-symbol pair, while a <strong>Non-Deterministic Finite Automaton (NFA)</strong> may transition to zero, one, or multiple states (including spontaneous epsilon transitions).
            </div>

            <h2>2. The Chomsky Hierarchy of Formal Languages</h2>
            <div class="table-responsive">
              <table class="tutorial-table">
                <thead>
                  <tr>
                    <th>Chomsky Level</th>
                    <th>Language Class</th>
                    <th>Recognizing Machine</th>
                    <th>Grammar Production Form</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Type 3</strong></td>
                    <td>Regular Languages</td>
                    <td>Finite Automata (DFA / NFA)</td>
                    <td><code>A &rarr; aB</code> or <code>A &rarr; a</code></td>
                  </tr>
                  <tr>
                    <td><strong>Type 2</strong></td>
                    <td>Context-Free Languages</td>
                    <td>Pushdown Automata (PDA - Stack)</td>
                    <td><code>A &rarr; &gamma;</code> (Single non-terminal on left)</td>
                  </tr>
                  <tr>
                    <td><strong>Type 1</strong></td>
                    <td>Context-Sensitive Languages</td>
                    <td>Linear Bounded Automata (LBA)</td>
                    <td><code>&alpha; A &beta; &rarr; &alpha; &gamma; &beta;</code> (Non-contracting)</td>
                  </tr>
                  <tr>
                    <td><strong>Type 0</strong></td>
                    <td>Recursively Enumerable</td>
                    <td>Turing Machine</td>
                    <td>Unrestricted productions</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2>3. Mathematical Formalization of DFA</h2>
            <p>A DFA is formally defined as a 5-tuple: <code>M = (Q, &Sigma;, &delta;, q0, F)</code></p>
            <ul>
              <li><code>Q</code>: Finite non-empty set of internal states.</li>
              <li><code>&Sigma;</code>: Finite non-empty input alphabet.</li>
              <li><code>&delta; : Q &times; &Sigma; &rarr; Q</code>: Total state transition function.</li>
              <li><code>q0 &isin; Q</code>: Initial start state.</li>
              <li><code>F &sube; Q</code>: Set of accepting / final states.</li>
            </ul>

            <h2>4. Architectural Diagram: DFA Accepting Strings Ending with '01'</h2>
            <div style="margin: 24px 0; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center;">
              <svg viewBox="0 0 650 200" width="100%" height="auto" style="max-width: 600px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <text x="325" y="30" text-anchor="middle" font-size="14" font-weight="bold" fill="#1e293b">DFA ACCEPTING STRINGS ENDING IN "01" (ALPHABET {0, 1})</text>

                <!-- State q0 (Start) -->
                <circle cx="100" cy="110" r="28" fill="#eff6ff" stroke="#2563eb" stroke-width="2" />
                <text x="100" y="115" text-anchor="middle" font-size="13" font-weight="bold" fill="#1e40af">q0</text>
                <!-- Start Arrow -->
                <line x1="30" y1="110" x2="72" y2="110" stroke="#2563eb" stroke-width="2" marker-end="url(#arrow)" />
                <text x="45" y="100" font-size="10" fill="#2563eb">Start</text>

                <!-- Self Loop q0 on 1 -->
                <path d="M 85 85 C 80 40, 120 40, 115 85" fill="none" stroke="#475569" stroke-width="1.5" />
                <text x="100" y="48" font-size="11" fill="#475569">1</text>

                <!-- Transition q0 -> q1 on 0 -->
                <line x1="128" y1="110" x2="272" y2="110" stroke="#2563eb" stroke-width="2" />
                <polygon points="272,110 262,105 262,115" fill="#2563eb" />
                <text x="200" y="100" text-anchor="middle" font-size="12" font-weight="bold" fill="#2563eb">0</text>

                <!-- State q1 -->
                <circle cx="300" cy="110" r="28" fill="#eff6ff" stroke="#2563eb" stroke-width="2" />
                <text x="300" y="115" text-anchor="middle" font-size="13" font-weight="bold" fill="#1e40af">q1</text>

                <!-- Self Loop q1 on 0 -->
                <path d="M 285 85 C 280 40, 320 40, 315 85" fill="none" stroke="#475569" stroke-width="1.5" />
                <text x="300" y="48" font-size="11" fill="#475569">0</text>

                <!-- Transition q1 -> q2 on 1 -->
                <line x1="328" y1="110" x2="472" y2="110" stroke="#2563eb" stroke-width="2" />
                <polygon points="472,110 462,105 462,115" fill="#2563eb" />
                <text x="400" y="100" text-anchor="middle" font-size="12" font-weight="bold" fill="#2563eb">1</text>

                <!-- State q2 (Double Circle = Final / Accepting State) -->
                <circle cx="500" cy="110" r="28" fill="#f0fdf4" stroke="#16a34a" stroke-width="2" />
                <circle cx="500" cy="110" r="22" fill="none" stroke="#16a34a" stroke-width="1.5" />
                <text x="500" y="115" text-anchor="middle" font-size="13" font-weight="bold" fill="#15803d">q2</text>

                <!-- Back transition from q2 to q0 on 1 -->
                <path d="M 500 138 C 500 190, 100 190, 100 138" fill="none" stroke="#475569" stroke-width="1.5" />
                <text x="300" y="185" text-anchor="middle" font-size="11" fill="#475569">1</text>
              </svg>
              <div style="font-size: 0.85rem; color: #64748b; margin-top: 8px;">Figure 7.2: State Transition Diagram of a Deterministic Finite Automaton (DFA)</div>
            </div>
          `
        }
      ]
    }
  ],

  // Computer Organization & Architecture (COA)
  coa: [
    {
      chapterTitle: '1. Pipelining, Hazards & Cache Hierarchy',
      chapterDescription: 'Instruction execution pipelines, pipeline hazards, speedup formulas, and cache mapping.',
      topics: [
        {
          title: 'Instruction Pipelining, Hazards, and Cache Memory Mapping',
          slug: 'instruction-pipelining-hazards-and-cache-mapping',
          summary: 'Master the 5-stage RISC pipeline (IF, ID, EX, MEM, WB), pipeline hazard mitigation (Data, Structural, Control), and Direct vs Set-Associative cache mapping.',
          minutes: 17,
          video_url: 'https://www.youtube.com/watch?v=gT5qF3Jg75E',
          video_title: 'Instruction Pipelining and Hazards in Computer Organization - Gate Smashers',
          video_source: 'Gate Smashers',
          video_objective: 'Derive pipeline speedup S = k*n / (k + n - 1), analyze Read-After-Write (RAW) data hazards, branch delays, and calculate Tag/Set/Offset bits in cache memory.',
          content: `
            <div class="callout callout-def">
              <strong>1. Definition & Core Meaning:</strong>
              <strong>Instruction Pipelining</strong> is an architectural implementation technique where multiple CPU instructions are overlapped in execution, analogous to a manufacturing assembly line. In an ideal <code>k</code>-stage pipeline, an instruction completes every single clock cycle.
            </div>

            <h2>2. The Standard 5-Stage RISC Pipeline</h2>
            <ol>
              <li><strong>IF (Instruction Fetch):</strong> Fetch instruction byte from Memory using Program Counter (PC).</li>
              <li><strong>ID (Instruction Decode / Register Read):</strong> Decode opcode and read source registers.</li>
              <li><strong>EX (Execute / ALU Operation):</strong> Perform mathematical ALU operation or calculate memory effective address.</li>
              <li><strong>MEM (Memory Access):</strong> Read/write data operand from/to data cache (for Load/Store instructions).</li>
              <li><strong>WB (Write Back):</strong> Write result from ALU or memory back into destination register file.</li>
            </ol>

            <h2>3. Pipeline Hazards &amp; Mitigation Strategies</h2>
            <div class="table-responsive">
              <table class="tutorial-table">
                <thead>
                  <tr>
                    <th>Hazard Type</th>
                    <th>Root Cause</th>
                    <th>Mitigation Technique</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Structural Hazard</strong></td>
                    <td>Two instructions simultaneously attempt to access the same physical hardware resource (e.g., single memory port for both instruction fetch and data read)</td>
                    <td>Separate Instruction &amp; Data Caches (Harvard Architecture) or insert pipeline bubble stall</td>
                  </tr>
                  <tr>
                    <td><strong>Data Hazard (RAW / WAR / WAW)</strong></td>
                    <td>Instruction depends on result of previous instruction still in execution pipeline (Read-After-Write)</td>
                    <td><strong>Operand Forwarding (Bypassing)</strong> from EX/MEM latch directly to EX stage; compiler instruction reordering</td>
                  </tr>
                  <tr>
                    <td><strong>Control Hazard (Branch)</strong></td>
                    <td>Branch instruction alters PC, but target address is not resolved until ID or EX stage</td>
                    <td>Branch Prediction (Static / Dynamic Branch Target Buffer) and Delayed Branching</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2>4. Architectural Diagram: 5-Stage Pipeline Execution</h2>
            <div style="margin: 24px 0; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center;">
              <svg viewBox="0 0 680 200" width="100%" height="auto" style="max-width: 640px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <text x="340" y="25" text-anchor="middle" font-size="14" font-weight="bold" fill="#1e293b">5-STAGE INSTRUCTION PIPELINE SPACE-TIME DIAGRAM</text>

                <!-- Clock Cycle Headers -->
                <text x="60" y="55" font-size="11" font-weight="bold" fill="#475569">Clock:</text>
                <text x="120" y="55" font-size="11" font-weight="bold" fill="#2563eb">C1</text>
                <text x="190" y="55" font-size="11" font-weight="bold" fill="#2563eb">C2</text>
                <text x="260" y="55" font-size="11" font-weight="bold" fill="#2563eb">C3</text>
                <text x="330" y="55" font-size="11" font-weight="bold" fill="#2563eb">C4</text>
                <text x="400" y="55" font-size="11" font-weight="bold" fill="#2563eb">C5</text>
                <text x="470" y="55" font-size="11" font-weight="bold" fill="#2563eb">C6</text>
                <text x="540" y="55" font-size="11" font-weight="bold" fill="#2563eb">C7</text>

                <!-- Instruction 1 -->
                <text x="50" y="85" font-size="11" font-weight="bold" fill="#1e293b">Inst 1:</text>
                <rect x="100" y="70" width="50" height="25" rx="3" fill="#eff6ff" stroke="#3b82f6" /><text x="125" y="87" text-anchor="middle" font-size="10" fill="#1e40af">IF</text>
                <rect x="170" y="70" width="50" height="25" rx="3" fill="#eff6ff" stroke="#3b82f6" /><text x="195" y="87" text-anchor="middle" font-size="10" fill="#1e40af">ID</text>
                <rect x="240" y="70" width="50" height="25" rx="3" fill="#eff6ff" stroke="#3b82f6" /><text x="265" y="87" text-anchor="middle" font-size="10" fill="#1e40af">EX</text>
                <rect x="310" y="70" width="50" height="25" rx="3" fill="#eff6ff" stroke="#3b82f6" /><text x="335" y="87" text-anchor="middle" font-size="10" fill="#1e40af">MEM</text>
                <rect x="380" y="70" width="50" height="25" rx="3" fill="#f0fdf4" stroke="#16a34a" /><text x="405" y="87" text-anchor="middle" font-size="10" font-weight="bold" fill="#15803d">WB</text>

                <!-- Instruction 2 -->
                <text x="50" y="125" font-size="11" font-weight="bold" fill="#1e293b">Inst 2:</text>
                <rect x="170" y="110" width="50" height="25" rx="3" fill="#eff6ff" stroke="#3b82f6" /><text x="195" y="127" text-anchor="middle" font-size="10" fill="#1e40af">IF</text>
                <rect x="240" y="110" width="50" height="25" rx="3" fill="#eff6ff" stroke="#3b82f6" /><text x="265" y="127" text-anchor="middle" font-size="10" fill="#1e40af">ID</text>
                <rect x="310" y="110" width="50" height="25" rx="3" fill="#eff6ff" stroke="#3b82f6" /><text x="335" y="127" text-anchor="middle" font-size="10" fill="#1e40af">EX</text>
                <rect x="380" y="110" width="50" height="25" rx="3" fill="#eff6ff" stroke="#3b82f6" /><text x="405" y="127" text-anchor="middle" font-size="10" fill="#1e40af">MEM</text>
                <rect x="450" y="110" width="50" height="25" rx="3" fill="#f0fdf4" stroke="#16a34a" /><text x="475" y="127" text-anchor="middle" font-size="10" font-weight="bold" fill="#15803d">WB</text>

                <!-- Instruction 3 -->
                <text x="50" y="165" font-size="11" font-weight="bold" fill="#1e293b">Inst 3:</text>
                <rect x="240" y="150" width="50" height="25" rx="3" fill="#eff6ff" stroke="#3b82f6" /><text x="265" y="167" text-anchor="middle" font-size="10" fill="#1e40af">IF</text>
                <rect x="310" y="150" width="50" height="25" rx="3" fill="#eff6ff" stroke="#3b82f6" /><text x="335" y="167" text-anchor="middle" font-size="10" fill="#1e40af">ID</text>
                <rect x="380" y="150" width="50" height="25" rx="3" fill="#eff6ff" stroke="#3b82f6" /><text x="405" y="167" text-anchor="middle" font-size="10" fill="#1e40af">EX</text>
                <rect x="450" y="150" width="50" height="25" rx="3" fill="#eff6ff" stroke="#3b82f6" /><text x="475" y="167" text-anchor="middle" font-size="10" fill="#1e40af">MEM</text>
                <rect x="520" y="150" width="50" height="25" rx="3" fill="#f0fdf4" stroke="#16a34a" /><text x="545" y="167" text-anchor="middle" font-size="10" font-weight="bold" fill="#15803d">WB</text>
              </svg>
              <div style="font-size: 0.85rem; color: #64748b; margin-top: 8px;">Figure 7.3: Overlapped Execution of 3 Instructions Across 5 Pipeline Stages</div>
            </div>
          `
        }
      ]
    }
  ],

  // Software Engineering
  'software-engineering': [
    {
      chapterTitle: '1. SDLC, Agile Scrum & Design Patterns',
      chapterDescription: 'Software lifecycles, Scrum rituals, Gang of Four patterns, and quality assurance.',
      topics: [
        {
          title: 'Agile Scrum Framework and Software Design Patterns',
          slug: 'agile-scrum-and-software-design-patterns',
          summary: 'Master the Agile Scrum lifecycle (Sprints, Backlog, Daily Scrum, Retrospective), and Creational/Structural/Behavioral Design Patterns (Singleton, Factory, Observer).',
          minutes: 16,
          video_url: 'https://www.youtube.com/watch?v=XU0llDuquSI',
          video_title: 'Agile vs Waterfall and Scrum Methodology - Gate Smashers',
          video_source: 'Gate Smashers',
          video_objective: 'Understand Agile Manifesto values, Scrum roles (Product Owner, Scrum Master, Dev Team), Sprint cadences, and GoF design patterns.',
          content: `
            <div class="callout callout-def">
              <strong>1. Definition & Core Meaning:</strong>
              <strong>Agile Scrum</strong> is an iterative, incremental framework for managing complex software product development. Work is organized into fixed-length cycles of 1 to 4 weeks called <strong>Sprints</strong>, delivering a potentially shippable product increment at the end of each iteration.
            </div>

            <h2>2. The Three Scrum Roles</h2>
            <ul>
              <li><strong>Product Owner (PO):</strong> Owns the Product Backlog, prioritizes features based on business ROI, and represents client stakeholder interests.</li>
              <li><strong>Scrum Master (SM):</strong> Servant leader who removes team blockers, coaches the team on Scrum practices, and shields engineers from external distractions.</li>
              <li><strong>Development Team:</strong> Cross-functional, self-organizing group of software engineers, testers, and designers responsible for delivering working software increments.</li>
            </ul>

            <h2>3. Gang of Four (GoF) Design Patterns</h2>
            <div class="table-responsive">
              <table class="tutorial-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Pattern Name</th>
                    <th>Core Purpose</th>
                    <th>Practical Use Case</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Creational</strong></td>
                    <td><strong>Singleton</strong></td>
                    <td>Guarantees a class has strictly only one global instance with a single access point</td>
                    <td>Database Connection Pool, Logging Service</td>
                  </tr>
                  <tr>
                    <td><strong>Creational</strong></td>
                    <td><strong>Factory Method</strong></td>
                    <td>Defines an interface for creating objects, letting subclasses decide which class to instantiate</td>
                    <td>UI component themes, Payment processor gateways</td>
                  </tr>
                  <tr>
                    <td><strong>Behavioral</strong></td>
                    <td><strong>Observer</strong></td>
                    <td>Defines a 1-to-many dependency so that when one object changes state, all subscribers are notified</td>
                    <td>Event-driven systems, GUI button click listeners</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2>4. Thread-Safe Singleton Implementation in Java</h2>
            <pre class="code-block"><button class="copy-btn">Copy</button><code>public class DatabaseConnectionPool {
    // volatile ensures memory visibility across multiple CPU cores
    private static volatile DatabaseConnectionPool instance;

    // Private constructor prevents direct instantiation with 'new'
    private DatabaseConnectionPool() {
        System.out.println("Initializing Database Connection Pool...");
    }

    // Double-Checked Locking Pattern for Thread-Safe Performance
    public static DatabaseConnectionPool getInstance() {
        if (instance == null) { // First check (no lock overhead)
            synchronized (DatabaseConnectionPool.class) {
                if (instance == null) { // Second check (under lock)
                    instance = new DatabaseConnectionPool();
                }
            }
        }
        return instance;
    }
}</code></pre>
          `
        }
      ]
    }
  ],

  // Web Development
  'web-development': [
    {
      chapterTitle: '1. Web Architecture, REST & Authentication',
      chapterDescription: 'HTTP lifecycle, RESTful API constraints, stateless JWT authentication, and browser rendering.',
      topics: [
        {
          title: 'RESTful API Design, JWT Authentication, and the Critical Rendering Path',
          slug: 'restful-apis-jwt-auth-and-rendering-path',
          summary: 'Master REST architectural constraints, JSON Web Token (JWT) stateless auth vs sessions, and browser Critical Rendering Path performance.',
          minutes: 17,
          video_url: 'https://www.youtube.com/watch?v=lsMQRaeKNDk',
          video_title: 'REST API Concepts and Design Rules - Gate Smashers',
          video_source: 'Gate Smashers',
          video_objective: 'Understand REST constraints (stateless, uniform interface), JWT anatomy (Header.Payload.Signature), XSS vs CSRF prevention, and DOM/CSSOM render trees.',
          content: `
            <div class="callout callout-def">
              <strong>1. Definition & Core Meaning:</strong>
              <strong>REST (Representational State Transfer)</strong> is an architectural style for distributed hypermedia systems. <strong>JWT (JSON Web Token)</strong> is an open RFC 7519 standard defining a compact, self-contained way to securely transmit digitally signed claims between client and server.
            </div>

            <h2>2. The 6 Architectural Constraints of REST</h2>
            <ol>
              <li><strong>Client-Server Separation:</strong> User interface concerns are decoupled from data storage concerns.</li>
              <li><strong>Statelessness:</strong> Each request from client to server must contain all information necessary to understand and process the request. No client context is stored on the server session.</li>
              <li><strong>Cacheability:</strong> Responses must explicitly define themselves as cacheable or non-cacheable (via <code>Cache-Control</code> headers) to eliminate redundant network roundtrips.</li>
              <li><strong>Uniform Interface:</strong> Standard resource identification via URIs, resource manipulation through representations, and self-descriptive messages.</li>
              <li><strong>Layered System:</strong> A client cannot tell whether it is connected directly to the end server or an intermediate proxy, CDN, or load balancer.</li>
              <li><strong>Code on Demand (Optional):</strong> Servers can temporarily extend client functionality by transferring executable code (e.g., JavaScript).</li>
            </ol>

            <h2>3. Anatomy of a JSON Web Token (JWT)</h2>
            <p>A JWT string consists of three Base64URL-encoded parts separated by periods (<code>.</code>):</p>
            <div class="callout callout-points">
              <code>eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NSIsIm5hbWUiOiJBbGljZSJ9.4z9sK9jW8w_...</code>
            </div>
            <ul>
              <li><strong>Header:</strong> Specifies token type (<code>JWT</code>) and cryptographic signing algorithm (e.g., <code>HS256</code> or <code>RS256</code>).</li>
              <li><strong>Payload (Claims):</strong> Contains entity metadata (e.g., <code>userId</code>, <code>role</code>, expiration <code>exp</code>).</li>
              <li><strong>Signature:</strong> Cryptographic hash of the encoded header + encoded payload generated using a secret key: <code>HMACSHA256(base64Url(header) + "." + base64Url(payload), secret)</code>. Guarantees message integrity against tampering.</li>
            </ul>

            <h2>4. Browser Critical Rendering Path (CRP)</h2>
            <ol>
              <li><strong>DOM Construction:</strong> Parse HTML bytes &rarr; characters &rarr; tokens &rarr; nodes &rarr; Document Object Model (DOM).</li>
              <li><strong>CSSOM Construction:</strong> Parse external CSS and <code>&lt;style&gt;</code> blocks into CSS Object Model.</li>
              <li><strong>Render Tree:</strong> Merge visible DOM nodes with CSSOM computed styles (elements with <code>display: none</code> are excluded).</li>
              <li><strong>Layout (Reflow):</strong> Calculate exact physical pixel coordinates and box dimensions for each node.</li>
              <li><strong>Paint &amp; Composite:</strong> Convert layout boxes into actual screen pixels and combine GPU layers.</li>
            </ol>
          `
        }
      ]
    }
  ],

  // Discrete Mathematics
  'discrete-mathematics': [
    {
      chapterTitle: '1. Set Theory, Relations & Propositional Logic',
      chapterDescription: 'Equivalence relations, truth tables, logical equivalences, and graph theory.',
      topics: [
        {
          title: 'Set Relations, Propositional Logic & The Handshaking Theorem',
          slug: 'set-relations-propositional-logic-handshaking-theorem',
          summary: 'Master reflexive, symmetric, and transitive equivalence relations, truth tables, logical equivalences, and the Graph Theory Handshaking Lemma.',
          minutes: 16,
          video_url: 'https://www.youtube.com/watch?v=ylwQ8A4zI88',
          video_title: 'Handshaking Lemma and Graph Theory Fundamentals - Gate Smashers',
          video_source: 'Gate Smashers',
          video_objective: 'Prove equivalence relations, derive truth tables for p -> q, and apply the Handshaking Theorem: Sum of degrees = 2 * |E| to prove graph properties.',
          content: `
            <div class="callout callout-def">
              <strong>1. Definition & Core Meaning:</strong>
              <strong>Discrete Mathematics</strong> is the branch of mathematics dealing with objects that can assume only distinct, separated values (integers, graphs, statements in logic). It forms the rigorous theoretical foundation for computer algorithms, data structures, and cryptographic protocols.
            </div>

            <h2>2. Equivalence Relations on Sets</h2>
            <p>A binary relation <code>R</code> on a set <code>A</code> is an <strong>Equivalence Relation</strong> if and only if it satisfies all three foundational properties:</p>
            <ol>
              <li><strong>Reflexive:</strong> For all <code>a &isin; A</code>, <code>(a, a) &isin; R</code>. Every element is related to itself.</li>
              <li><strong>Symmetric:</strong> If <code>(a, b) &isin; R</code>, then <code>(b, a) &isin; R</code> for all <code>a, b &isin; A</code>.</li>
              <li><strong>Transitive:</strong> If <code>(a, b) &isin; R</code> and <code>(b, c) &isin; R</code>, then <code>(a, c) &isin; R</code> for all <code>a, b, c &isin; A</code>.</li>
            </ol>

            <h2>3. Propositional Logic: The Conditional Statement <code>p &rarr; q</code></h2>
            <p>In classical logic, a conditional proposition (implication) <code>p &rarr; q</code> ("if p, then q") is <strong>false in only one single case:</strong> when the hypothesis <code>p</code> is TRUE and the conclusion <code>q</code> is FALSE.</p>
            <div class="table-responsive">
              <table class="tutorial-table">
                <thead>
                  <tr>
                    <th>p</th>
                    <th>q</th>
                    <th>&not;p</th>
                    <th>p &rarr; q</th>
                    <th>&not;p &or; q</th>
                    <th>p &harr; q</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>T</td><td>T</td><td>F</td><td><strong>T</strong></td><td><strong>T</strong></td><td>T</td></tr>
                  <tr><td>T</td><td>F</td><td>F</td><td><strong>F</strong></td><td><strong>F</strong></td><td>F</td></tr>
                  <tr><td>F</td><td>T</td><td>T</td><td><strong>T</strong></td><td><strong>T</strong></td><td>F</td></tr>
                  <tr><td>F</td><td>F</td><td>T</td><td><strong>T</strong></td><td><strong>T</strong></td><td>T</td></tr>
                </tbody>
              </table>
            </div>
            <p><em>Notice that columns <code>p &rarr; q</code> and <code>&not;p &or; q</code> are identical, mathematically proving the fundamental logical equivalence: <code>(p &rarr; q) &equiv; (&not;p &or; q)</code>!</em></p>

            <h2>4. Graph Theory &amp; The Handshaking Theorem</h2>
            <div class="callout callout-points">
              <strong>The Handshaking Theorem:</strong> In any undirected graph <code>G = (V, E)</code>, the sum of the degrees of all vertices equals twice the total number of edges:
              <br><br>
              <code>&sum;_(v &isin; V) deg(v) = 2 &middot; |E|</code>
            </div>
            <p><strong>Immediate Corollary:</strong> In any undirected graph, the number of vertices with odd degree MUST ALWAYS BE EVEN. (It is mathematically impossible to have an odd number of odd-degree vertices!).</p>
          `
        }
      ]
    }
  ]
};
