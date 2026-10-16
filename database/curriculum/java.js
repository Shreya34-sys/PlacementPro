/**
 * PlacementPro Theory Learning Library - Java Programming Curriculum
 * Covers:
 * 1. JVM, JRE, JDK & Memory Architecture (Heap, Stack, Metaspace, JIT, Garbage Collection)
 * 2. Java Inheritance, Polymorphism, Super & Method Overriding
 * 3. Java Collections Framework & HashMap Internal Hashing
 * 4. Exception Handling Architecture & Stack Unwinding
 * 5. Multithreading, Concurrency, Thread Lifecycle & Synchronization
 */

module.exports = [
  {
    chapterTitle: '1. Java Virtual Machine (JVM) Architecture & Runtime',
    chapterDescription: 'Deep dive into the execution engine, class loaders, JVM memory areas, and bytecode compilation.',
    topics: [
      {
        title: 'JVM, JRE, JDK & Java Memory Architecture',
        slug: 'jvm-jre-jdk-and-memory-architecture',
        summary: 'Understand how the Java Virtual Machine manages memory, performs JIT compilation, and coordinates the ClassLoader subsystem.',
        minutes: 12,
        video_url: 'https://www.youtube.com/watch?v=ZBJ0u9MaKtM',
        video_title: 'JVM Architecture and Memory Management - NPTEL IIT Kharagpur',
        video_source: 'NPTEL / IIT Kharagpur',
        video_objective: 'Master JVM memory organization (Heap, Stack, Metaspace), ClassLoader delegation hierarchy, and the Execution Engine.',
        content: `
          <div class="callout callout-def">
            <strong>1. Definition & Core Meaning:</strong>
            The <strong>Java Virtual Machine (JVM)</strong> is an abstract computing machine that provides a runtime environment in which Java bytecode (<code>.class</code> files) can be executed. It acts as an abstraction layer between compiled Java programs and the underlying hardware platform, realizing Java's foundational philosophy: <em>"Write Once, Run Anywhere" (WORA)</em>.
          </div>

          <h2>2. Why the Concept Is Needed</h2>
          <p>In traditional compiled languages like C/C++, code is compiled directly into platform-specific machine code (e.g., x86-64 binary for Windows). An executable generated on Windows will fail on Linux or ARM architectures without recompilation.</p>
          <p>Java solves this by compiling source code into an intermediate platform-neutral bytecode. The JVM translates bytecode into native CPU instructions at runtime. The tripartite division serves distinct development and execution roles:</p>
          <ul>
            <li><strong>JDK (Java Development Kit):</strong> The comprehensive development suite containing the compiler (<code>javac</code>), archiver (<code>jar</code>), documentation generator (<code>javadoc</code>), and debugging tools, plus the JRE.</li>
            <li><strong>JRE (Java Runtime Environment):</strong> The bundle containing the JVM plus standard Java Class Libraries (e.g., <code>rt.jar</code>, <code>java.lang.*</code>, <code>java.util.*</code>) needed strictly to <em>run</em> Java applications.</li>
            <li><strong>JVM (Java Virtual Machine):</strong> The core execution engine that allocates memory, loads bytecode, verifies bytecode security, and executes instructions via interpretation and JIT compilation.</li>
          </ul>

          <h2>3. Internal Working Explained Step by Step</h2>
          <p>The JVM runtime lifecycle proceeds through three coordinated subsystems:</p>
          <ol>
            <li><strong>ClassLoader Subsystem:</strong>
              <ul>
                <li><em>Loading:</em> Finds and imports binary data for classes. Follows the <strong>Delegation Hierarchy Algorithm</strong>: Bootstrap ClassLoader &rarr; Platform/Extension ClassLoader &rarr; Application/System ClassLoader.</li>
                <li><em>Linking:</em> Verification (ensures bytecode conforms to JVM specifications and is safe), Preparation (allocates static memory and initializes default zeros/nulls), and Resolution (maps symbolic memory references to direct physical addresses).</li>
                <li><em>Initialization:</em> Executes static initializers and static blocks (<code>&lt;clinit&gt;</code>).</li>
              </ul>
            </li>
            <li><strong>JVM Runtime Data Areas (Memory Layout):</strong>
              <ul>
                <li><strong>Method Area / Metaspace:</strong> Shared across all threads. Stores class-level data, bytecode, static variables, and runtime constant pools. (Since Java 8, Metaspace resides in native OS memory rather than contiguous heap memory).</li>
                <li><strong>Heap Memory:</strong> Shared across all threads. The central storage for all instantiated objects and instance arrays. Divided into Young Generation (Eden space, Survivor S0, Survivor S1) and Old/Tenured Generation. Garbage collectors (G1, ZGC) reclaim unreferenced objects here.</li>
                <li><strong>JVM Thread Stacks:</strong> Private to each OS thread. Created concurrently with thread launch. Stores <strong>Stack Frames</strong> containing local variables, operand stacks, and frame data for return values. Destroyed when the method terminates.</li>
                <li><strong>Program Counter (PC) Registers:</strong> Private to each thread. Tracks the memory address of the JVM bytecode instruction currently being executed.</li>
                <li><strong>Native Method Stacks:</strong> Holds state and native pointers for C/C++ libraries called via Java Native Interface (JNI).</li>
              </ul>
            </li>
            <li><strong>Execution Engine:</strong>
              <ul>
                <li><strong>Interpreter:</strong> Reads bytecode instructions one by one and translates them into machine code sequentially (fast initial startup, slower steady-state).</li>
                <li><strong>Just-In-Time (JIT) Compiler:</strong> Identifies "hot spots" (frequently executed loops/methods) using internal invocation counters and compiles their bytecode directly into optimized native machine code. Contains the C1 (Client) compiler and C2 (Server) optimizing compiler.</li>
                <li><strong>Garbage Collector (GC):</strong> Automatically tracks object reachability via root set traversal (GC Roots) and clears unreferenced memory.</li>
              </ul>
            </li>
          </ol>

          <h2>4. Real-World Analogy</h2>
          <div class="callout callout-points">
            <strong>Analogy:</strong> Think of Java development as an international musical production:
            <ul>
              <li><strong>The Java Source Code (<code>.java</code>):</strong> A musical composition written by a composer in standard musical notation.</li>
              <li><strong>The Java Compiler (<code>javac</code>):</strong> The publisher who translates the hand-written notes into a standardized sheet-music booklet (<strong>Bytecode <code>.class</code></strong>).</li>
              <li><strong>The JVM:</strong> A master orchestra conductor who reads the standardized sheet music and directs the local instruments (the host CPU and RAM) to produce the live physical sound. The sheet music is identical worldwide, but each conductor knows how to adapt it to the acoustics of their specific concert hall.</li>
            </ul>
          </div>

          <h2>5. Architectural Diagram</h2>
          <div style="margin: 24px 0; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center;">
            <svg viewBox="0 0 780 440" width="100%" height="auto" style="max-width: 760px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <!-- Outer Frame -->
              <rect x="10" y="10" width="760" height="420" rx="8" fill="#ffffff" stroke="#2563eb" stroke-width="2" />
              <text x="390" y="36" text-anchor="middle" font-size="16" font-weight="bold" fill="#1e293b">JAVA VIRTUAL MACHINE (JVM) ARCHITECTURE</text>

              <!-- ClassLoader Box -->
              <rect x="30" y="60" width="720" height="70" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.5" />
              <text x="50" y="85" font-size="14" font-weight="bold" fill="#1d4ed8">1. ClassLoader Subsystem</text>
              <rect x="50" y="95" width="200" height="25" rx="4" fill="#ffffff" stroke="#93c5fd" />
              <text x="150" y="112" text-anchor="middle" font-size="11" fill="#1e3a8a">Loading (Bootstrap, App)</text>
              <rect x="270" y="95" width="200" height="25" rx="4" fill="#ffffff" stroke="#93c5fd" />
              <text x="370" y="112" text-anchor="middle" font-size="11" fill="#1e3a8a">Linking (Verify, Prep, Resolve)</text>
              <rect x="490" y="95" width="230" height="25" rx="4" fill="#ffffff" stroke="#93c5fd" />
              <text x="605" y="112" text-anchor="middle" font-size="11" fill="#1e3a8a">Initialization (&lt;clinit&gt;)</text>

              <!-- Runtime Data Areas -->
              <rect x="30" y="150" width="720" height="135" rx="6" fill="#f8fafc" stroke="#64748b" stroke-width="1.5" />
              <text x="50" y="172" font-size="14" font-weight="bold" fill="#334155">2. JVM Memory / Runtime Data Areas</text>

              <!-- Shared Areas -->
              <rect x="50" y="185" width="310" height="85" rx="4" fill="#f1f5f9" stroke="#94a3b8" />
              <text x="65" y="205" font-size="12" font-weight="bold" fill="#0f172a">Shared Across All Threads</text>
              <rect x="65" y="215" width="130" height="45" rx="4" fill="#ffffff" stroke="#cbd5e1" />
              <text x="130" y="235" text-anchor="middle" font-size="11" font-weight="bold" fill="#2563eb">Heap Memory</text>
              <text x="130" y="250" text-anchor="middle" font-size="9" fill="#64748b">Objects &amp; Arrays</text>
              <rect x="210" y="215" width="135" height="45" rx="4" fill="#ffffff" stroke="#cbd5e1" />
              <text x="277" y="235" text-anchor="middle" font-size="11" font-weight="bold" fill="#2563eb">Metaspace</text>
              <text x="277" y="250" text-anchor="middle" font-size="9" fill="#64748b">Class Metadata, Static</text>

              <!-- Per-Thread Areas -->
              <rect x="380" y="185" width="350" height="85" rx="4" fill="#f1f5f9" stroke="#94a3b8" />
              <text x="395" y="205" font-size="12" font-weight="bold" fill="#0f172a">Private Per Thread</text>
              <rect x="395" y="215" width="95" height="45" rx="4" fill="#ffffff" stroke="#cbd5e1" />
              <text x="442" y="235" text-anchor="middle" font-size="11" font-weight="bold" fill="#059669">JVM Stack</text>
              <text x="442" y="250" text-anchor="middle" font-size="9" fill="#64748b">Stack Frames</text>
              <rect x="505" y="215" width="105" height="45" rx="4" fill="#ffffff" stroke="#cbd5e1" />
              <text x="557" y="235" text-anchor="middle" font-size="11" font-weight="bold" fill="#059669">PC Register</text>
              <text x="557" y="250" text-anchor="middle" font-size="9" fill="#64748b">Instruction Addr</text>
              <rect x="625" y="215" width="90" height="45" rx="4" fill="#ffffff" stroke="#cbd5e1" />
              <text x="670" y="235" text-anchor="middle" font-size="11" font-weight="bold" fill="#059669">Native Stack</text>
              <text x="670" y="250" text-anchor="middle" font-size="9" fill="#64748b">C/C++ Calls</text>

              <!-- Execution Engine -->
              <rect x="30" y="305" width="720" height="105" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.5" />
              <text x="50" y="328" font-size="14" font-weight="bold" fill="#1d4ed8">3. Execution Engine &amp; Native Interface</text>

              <rect x="50" y="340" width="140" height="55" rx="4" fill="#ffffff" stroke="#93c5fd" />
              <text x="120" y="363" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e40af">Interpreter</text>
              <text x="120" y="380" text-anchor="middle" font-size="10" fill="#64748b">Line-by-line Bytecode</text>

              <rect x="210" y="340" width="160" height="55" rx="4" fill="#ffffff" stroke="#93c5fd" />
              <text x="290" y="363" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e40af">JIT Compiler</text>
              <text x="290" y="380" text-anchor="middle" font-size="10" fill="#64748b">Native Code (C1 / C2)</text>

              <rect x="390" y="340" width="160" height="55" rx="4" fill="#ffffff" stroke="#93c5fd" />
              <text x="470" y="363" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e40af">Garbage Collector</text>
              <text x="470" y="380" text-anchor="middle" font-size="10" fill="#64748b">Heap Memory Reclaim</text>

              <rect x="570" y="340" width="160" height="55" rx="4" fill="#ffffff" stroke="#93c5fd" />
              <text x="650" y="363" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e40af">JNI &amp; Native Libs</text>
              <text x="650" y="380" text-anchor="middle" font-size="10" fill="#64748b">OS Shared Libs (.so/.dll)</text>
            </svg>
            <div style="font-size: 0.85rem; color: #64748b; margin-top: 8px;">Figure 1.1: Complete Java Virtual Machine (JVM) Architectural Subsystems &amp; Memory Layout</div>
          </div>

          <h2>6. Code Implementations & Fully Explained Examples</h2>
          <p>The following Java program illustrates object allocation on the Heap, method call frames on the Stack, and runtime inspection of JVM memory parameters:</p>

          <pre class="code-block"><button class="copy-btn">Copy</button><code>public class JVMMemoryInspector {

    // Stored in Metaspace (static field)
    private static final String APP_NAME = "JVM Demo";

    // Instance field stored in Heap as part of the object
    private int counter = 100;

    public static void main(String[] args) {
        // 'args' and 'inspector' references live in the Stack frame of main()
        // The actual JVMMemoryInspector instance is allocated on the Heap
        JVMMemoryInspector inspector = new JVMMemoryInspector();

        // Query JVM runtime via Runtime instance
        Runtime runtime = Runtime.getRuntime();
        long maxMemory = runtime.maxMemory() / (1024 * 1024);
        long totalMemory = runtime.totalMemory() / (1024 * 1024);
        long freeMemory = runtime.freeMemory() / (1024 * 1024);

        System.out.println("Application: " + APP_NAME);
        System.out.println("Available Processors: " + runtime.availableProcessors());
        System.out.println("Max Heap Memory:      " + maxMemory + " MB");
        System.out.println("Total Allocated Heap: " + totalMemory + " MB");
        System.out.println("Free Heap Memory:     " + freeMemory + " MB");

        // Execute stack invocation
        inspector.computeFactorial(5);
    }

    public int computeFactorial(int n) {
        // Each recursive call pushes a new Stack Frame containing 'n'
        if (n &lt;= 1) return 1;
        return n * computeFactorial(n - 1);
    }
}</code></pre>

          <h3>Expected Output:</h3>
          <pre class="code-block"><code>Application: JVM Demo
Available Processors: 8
Max Heap Memory:      4096 MB
Total Allocated Heap: 260 MB
Free Heap Memory:     254 MB</code></pre>

          <h2>7. Comparison Analysis</h2>
          <div class="table-responsive">
            <table class="tutorial-table">
              <thead>
                <tr>
                  <th>Dimension</th>
                  <th>Stack Memory</th>
                  <th>Heap Memory</th>
                  <th>Metaspace (Java 8+)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Scope &amp; Sharing</strong></td>
                  <td>Thread-private (per execution thread)</td>
                  <td>Globally shared by all application threads</td>
                  <td>Globally shared by all application threads</td>
                </tr>
                <tr>
                  <td><strong>Stored Contents</strong></td>
                  <td>Method frames, local primitives, object reference pointers</td>
                  <td>Class instances (objects) and all arrays</td>
                  <td>Class metadata, method bytecode, static variables</td>
                </tr>
                <tr>
                  <td><strong>Allocation Mechanism</strong></td>
                  <td>LIFO contiguous block (pointer increment)</td>
                  <td>Dynamic non-contiguous memory management</td>
                  <td>Native memory allocated directly by OS</td>
                </tr>
                <tr>
                  <td><strong>Memory Exhaustion Error</strong></td>
                  <td><code>java.lang.StackOverflowError</code></td>
                  <td><code>java.lang.OutOfMemoryError: Java heap space</code></td>
                  <td><code>java.lang.OutOfMemoryError: Metaspace</code></td>
                </tr>
                <tr>
                  <td><strong>Access Speed</strong></td>
                  <td>Extremely fast (direct CPU pointer offset)</td>
                  <td>Relatively slower (pointer dereferencing &amp; cache misses)</td>
                  <td>Fast native memory access</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>8. Advantages, Limitations & Use Cases</h2>
          <h3>Advantages</h3>
          <ul>
            <li><strong>Hardware Independence:</strong> Write once on macOS or Linux, run directly on Windows or cloud containers without recompilation.</li>
            <li><strong>Automated Memory Safety:</strong> Prevents buffer overflows, dangling pointer corruptions, and wild memory writes common in C/C++.</li>
            <li><strong>Dynamic Adaptive Optimization:</strong> The JIT compiler optimizes code dynamically using runtime performance profiling data unavailable to ahead-of-time (AOT) compilers.</li>
          </ul>
          <h3>Limitations</h3>
          <ul>
            <li><strong>Initial Warm-up Latency:</strong> Cold JVM starts incur overhead while classes are loaded, verified, and interpreted before JIT compilation fires.</li>
            <li><strong>GC Pause Times:</strong> Stop-The-World (STW) garbage collection pauses can cause latency spikes in high-frequency trading or ultra-low-latency systems.</li>
          </ul>

          <h2>9. Common Mistakes & Anti-Patterns</h2>
          <ul>
            <li><strong>Accidental Memory Leaks via Static References:</strong> Adding objects to a <code>static List</code> or <code>Map</code> without eviction prevents the Garbage Collector from freeing them, leading to an eventual <code>OutOfMemoryError</code>.</li>
            <li><strong>Unbounded Recursion:</strong> Missing base termination conditions causes infinite recursive method calls that rapidly exhaust thread stack depth, triggering <code>StackOverflowError</code>.</li>
            <li><strong>Creating Redundant Objects Inside Loops:</strong> Instantiating temporary objects (like <code>new String()</code> or large arrays) inside tight loops creates intense Young Generation memory churn and frequent GC pauses.</li>
          </ul>

          <h2>10. University Exam & Interview Questions</h2>
          <div class="theory-card" style="margin-bottom: 16px;">
            <h3>Q1: What happens under the hood when you execute <code>java MyClass</code> in the command line?</h3>
            <p><strong>Answer:</strong></p>
            <ol>
              <li>The OS launches the <code>java</code> launcher process, creating a native OS thread.</li>
              <li>The launcher initializes the JVM and invokes the <code>JNI_CreateJavaVM</code> API.</li>
              <li>The <strong>Bootstrap ClassLoader</strong> loads core runtime classes (<code>java.base</code> module).</li>
              <li>The <strong>Application ClassLoader</strong> locates <code>MyClass.class</code> from the classpath, verifies the bytecode, and loads it into Metaspace.</li>
              <li>The JVM locates the entrypoint method: <code>public static void main(String[] args)</code>.</li>
              <li>The main thread stack frame is created, and the execution engine begins interpreting/compiling bytecode instructions.</li>
            </ol>
          </div>

          <div class="theory-card">
            <h3>Q2: Why was PermGen replaced by Metaspace in Java 8?</h3>
            <p><strong>Answer:</strong> PermGen (Permanent Generation) had a fixed maximum size configured via <code>-XX:MaxPermSize</code>, contiguous with the Java heap. Heavy use of runtime bytecode generators (Spring CGLIB, Hibernate proxies) routinely exceeded this ceiling, producing <code>java.lang.OutOfMemoryError: PermGen space</code>. Metaspace resolves this by allocating class metadata directly from contiguous native OS memory, expanding dynamically up to the host system's total available RAM (unless capped via <code>-XX:MaxMetaspaceSize</code>).</p>
          </div>

          <h2>11. Chapter Summary & Key Terminology</h2>
          <div class="callout callout-points">
            <ul>
              <li><strong>Bytecode:</strong> Compact 8-bit instruction set executed by the JVM rather than physical silicon.</li>
              <li><strong>JIT Compiler:</strong> Translates frequently executed bytecode ("hot spots") into direct native machine instructions at runtime.</li>
              <li><strong>Heap Memory:</strong> Thread-shared storage for all instantiated objects, reclaimed automatically by Garbage Collectors.</li>
              <li><strong>Stack Frame:</strong> LIFO data structure pushed onto a thread stack upon method invocation and popped upon return.</li>
            </ul>
          </div>
        `
      },
      {
        title: 'Java Inheritance, Polymorphism, and Method Overriding',
        slug: 'java-inheritance-and-polymorphism',
        summary: 'Master class extension, superclass member accessibility, constructor chaining, dynamic method dispatch, and object substitution.',
        minutes: 14,
        video_url: 'https://www.youtube.com/watch?v=zbKGJ4cWd3k',
        video_title: 'Inheritance and Polymorphism in Java - Gate Smashers',
        video_source: 'Gate Smashers',
        video_objective: 'Understand the extends keyword, protected vs private visibility, super() constructor chaining, dynamic method dispatch, and Liskov Substitution Principle.',
        content: `
          <div class="callout callout-def">
            <strong>1. Definition & Core Meaning:</strong>
            <strong>Inheritance</strong> is an Object-Oriented mechanism whereby a new class (derived or subclass) acquires the state (fields) and behavior (methods) of an existing class (base or superclass) using the <code>extends</code> keyword. It represents an <strong>IS-A relationship</strong> and enables code reuse and polymorphism.
          </div>

          <h2>2. Why the Concept Is Needed</h2>
          <p>Without inheritance, software systems suffer from massive code duplication across related domains. For example, in an enterprise payroll system, <code>FullTimeEmployee</code>, <code>Contractor</code>, and <code>Manager</code> all share foundational properties (<code>id</code>, <code>name</code>, <code>email</code>, <code>calculateTaxes()</code>). Duplicating these fields across 10 classes creates maintenance nightmares: fixing a tax computation bug requires editing 10 identical files.</p>
          <p>Inheritance establishes a hierarchical abstraction where common attributes reside once in a common ancestor (<code>Employee</code>), while specific subclasses only add distinct specializations.</p>

          <h2>3. Internal Working Explained Step by Step</h2>
          <ol>
            <li><strong>Subclass Memory Layout:</strong> When a subclass object is instantiated with <code>new Car()</code>, the JVM allocates a single contiguous block on the Heap that contains <em>both</em> the superclass instance variables (including private ones, though unexposed directly) and the subclass instance variables.</li>
            <li><strong>Constructor Chaining via <code>super()</code>:</strong> The first statement of any subclass constructor must be a call to its immediate superclass constructor (<code>super(...)</code>). If omitted, the Java compiler automatically inserts an implicit call to the no-argument constructor: <code>super();</code>. This guarantees base invariants are initialized before derived logic executes.</li>
            <li><strong>Dynamic Method Dispatch (Runtime Polymorphism):</strong> When an overridden method is called on a reference variable (e.g., <code>Vehicle v = new Car(); v.accelerate();</code>), the compiler only verifies that <code>Vehicle</code> contains an <code>accelerate()</code> signature. At runtime, the JVM looks up the actual runtime class of the object (<code>Car</code>) and executes <code>Car.accelerate()</code> using the <strong>Virtual Method Table (vtable)</strong>.</li>
            <li><strong>Inherited vs Non-Inherited Members:</strong>
              <ul>
                <li><code>public</code> and <code>protected</code> members are inherited.</li>
                <li>Default (package-private) members are inherited only within the same package.</li>
                <li><code>private</code> members are allocated in the heap object but cannot be accessed directly by name in the subclass.</li>
                <li>Constructors and <code>static</code> methods are NOT inherited (static methods can be shadowed/hidden, not overridden).</li>
              </ul>
            </li>
          </ol>

          <h2>4. Real-World Analogy</h2>
          <div class="callout callout-points">
            <strong>Analogy:</strong> Biological genetics and vehicle blueprints:
            <ul>
              <li><strong>Superclass (Blueprint):</strong> The general concept of a <strong>Four-Wheeled Road Vehicle</strong> specifies a chassis, steering mechanism, brakes, and acceleration controls.</li>
              <li><strong>Subclass (Specialization):</strong> An <strong>Electric Vehicle (Tesla)</strong> inherits the steering and braking mechanisms without redesigning them from scratch, but overrides the internal propulsion mechanism (replaces the internal combustion engine with dual electric motors) and adds regenerative braking.</li>
            </ul>
          </div>

          <h2>5. Architectural Class Diagram</h2>
          <div style="margin: 24px 0; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center;">
            <svg viewBox="0 0 650 340" width="100%" height="auto" style="max-width: 600px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <!-- Superclass: Employee -->
              <rect x="200" y="20" width="250" height="110" rx="6" fill="#eff6ff" stroke="#2563eb" stroke-width="2" />
              <text x="325" y="45" text-anchor="middle" font-size="14" font-weight="bold" fill="#1e3a8a">&lt;&lt;Superclass&gt;&gt; Employee</text>
              <line x1="200" y1="55" x2="450" y2="55" stroke="#93c5fd" />
              <text x="215" y="73" font-size="11" fill="#1e293b">- id: String, name: String, baseSalary: double</text>
              <line x1="200" y1="83" x2="450" y2="83" stroke="#93c5fd" />
              <text x="215" y="100" font-size="11" fill="#1e293b">+ calculateCompensation(): double</text>
              <text x="215" y="117" font-size="11" fill="#1e293b">+ getProfile(): String</text>

              <!-- Inheritance Arrow Lines -->
              <line x1="325" y1="130" x2="325" y2="170" stroke="#2563eb" stroke-width="2" />
              <line x1="130" y1="170" x2="520" y2="170" stroke="#2563eb" stroke-width="2" />
              <line x1="130" y1="170" x2="130" y2="200" stroke="#2563eb" stroke-width="2" />
              <line x1="520" y1="170" x2="520" y2="200" stroke="#2563eb" stroke-width="2" />

              <!-- Hollow Arrowhead at Superclass -->
              <polygon points="325,130 317,145 333,145" fill="#ffffff" stroke="#2563eb" stroke-width="2" />

              <!-- Subclass 1: SoftwareEngineer -->
              <rect x="20" y="200" width="220" height="110" rx="6" fill="#ffffff" stroke="#3b82f6" stroke-width="1.5" />
              <text x="130" y="225" text-anchor="middle" font-size="13" font-weight="bold" fill="#1e40af">SoftwareEngineer</text>
              <line x1="20" y1="235" x2="240" y2="235" stroke="#e2e8f0" />
              <text x="35" y="253" font-size="11" fill="#1e293b">+ techStack: String</text>
              <line x1="20" y1="263" x2="240" y2="263" stroke="#e2e8f0" />
              <text x="35" y="280" font-size="11" fill="#059669">+ calculateCompensation() &lt;override&gt;</text>
              <text x="35" y="297" font-size="11" fill="#1e293b">+ reviewCode(): void</text>

              <!-- Subclass 2: EngineeringManager -->
              <rect x="410" y="200" width="220" height="110" rx="6" fill="#ffffff" stroke="#3b82f6" stroke-width="1.5" />
              <text x="520" y="225" text-anchor="middle" font-size="13" font-weight="bold" fill="#1e40af">EngineeringManager</text>
              <line x1="410" y1="235" x2="630" y2="235" stroke="#e2e8f0" />
              <text x="425" y="253" font-size="11" fill="#1e293b">+ teamBonus: double</text>
              <line x1="410" y1="263" x2="630" y2="263" stroke="#e2e8f0" />
              <text x="425" y="280" font-size="11" fill="#059669">+ calculateCompensation() &lt;override&gt;</text>
              <text x="425" y="297" font-size="11" fill="#1e293b">+ approveBudget(): void</text>
            </svg>
            <div style="font-size: 0.85rem; color: #64748b; margin-top: 8px;">Figure 1.2: UML Class Inheritance Hierarchy with Dynamic Polymorphic Dispatch</div>
          </div>

          <h2>6. Code Implementations & Fully Explained Examples</h2>
          <pre class="code-block"><button class="copy-btn">Copy</button><code>// 1. Superclass
class Employee {
    protected String id;
    protected String name;
    protected double baseSalary;

    // Superclass Constructor
    public Employee(String id, String name, double baseSalary) {
        this.id = id;
        this.name = name;
        this.baseSalary = baseSalary;
    }

    // Method to be overridden
    public double calculateCompensation() {
        return this.baseSalary;
    }

    public void printDetails() {
        System.out.printf("[%s] %s | Base: $%.2f | Total Pay: $%.2f%n",
            id, name, baseSalary, calculateCompensation());
    }
}

// 2. Subclass: SoftwareEngineer
class SoftwareEngineer extends Employee {
    private String techStack;
    private double performanceBonus;

    public SoftwareEngineer(String id, String name, double baseSalary, String techStack, double performanceBonus) {
        // Explicit superclass constructor invocation must be first statement
        super(id, name, baseSalary);
        this.techStack = techStack;
        this.performanceBonus = performanceBonus;
    }

    // Method Overriding: Runtime Polymorphism
    @Override
    public double calculateCompensation() {
        // Reusing superclass calculation via super keyword
        return super.calculateCompensation() + this.performanceBonus;
    }
}

// 3. Subclass: EngineeringManager
class EngineeringManager extends Employee {
    private double stockGrant;

    public EngineeringManager(String id, String name, double baseSalary, double stockGrant) {
        super(id, name, baseSalary);
        this.stockGrant = stockGrant;
    }

    @Override
    public double calculateCompensation() {
        return super.calculateCompensation() + this.stockGrant;
    }
}

// Main Driver Application
public class PolymorphismDemo {
    public static void main(String[] args) {
        // Heterogeneous polymorphic collection
        Employee[] payroll = new Employee[] {
            new SoftwareEngineer("E-101", "Alice Chen", 120000.0, "Java / Spring", 15000.0),
            new EngineeringManager("M-201", "Bob Smith", 160000.0, 45000.0),
            new Employee("G-301", "Charlie Ray", 75000.0)
        };

        System.out.println("--- PlacementPro Automated Payroll Processing ---");
        for (Employee emp : payroll) {
            // Dynamic Method Dispatch occurs here at runtime!
            emp.printDetails();
        }
    }
}</code></pre>

          <h3>Expected Output:</h3>
          <pre class="code-block"><code>--- PlacementPro Automated Payroll Processing ---
[E-101] Alice Chen | Base: $120000.00 | Total Pay: $135000.00
[M-201] Bob Smith | Base: $160000.00 | Total Pay: $205000.00
[G-301] Charlie Ray | Base: $75000.00 | Total Pay: $75000.00</code></pre>

          <h2>7. Comparison Analysis: Overriding vs Overloading</h2>
          <div class="table-responsive">
            <table class="tutorial-table">
              <thead>
                <tr>
                  <th>Characteristic</th>
                  <th>Method Overriding (Dynamic / Runtime)</th>
                  <th>Method Overloading (Static / Compile-Time)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Class Scope</strong></td>
                  <td>Occurs across parent and child classes (Inheritance required)</td>
                  <td>Occurs within the same class (or across subclasses)</td>
                </tr>
                <tr>
                  <td><strong>Method Signature</strong></td>
                  <td><strong>Must be identical</strong> (same name, parameter count and types)</td>
                  <td><strong>Must differ</strong> in arguments (count, types, or order)</td>
                </tr>
                <tr>
                  <td><strong>Return Type</strong></td>
                  <td>Must be identical or covariant (subtype of super return type)</td>
                  <td>Can be identical or different (cannot overload on return type alone)</td>
                </tr>
                <tr>
                  <td><strong>Binding Time</strong></td>
                  <td>Runtime (Dynamic dispatch via vtable)</td>
                  <td>Compile-time (Static binding by compiler based on arguments)</td>
                </tr>
                <tr>
                  <td><strong>Access Modifiers</strong></td>
                  <td>Cannot reduce visibility (e.g., cannot override public with protected)</td>
                  <td>Can have any visibility independent of other overloads</td>
                </tr>
                <tr>
                  <td><strong>Exception Handling</strong></td>
                  <td>Cannot throw broader checked exceptions than superclass method</td>
                  <td>Can throw any checked or unchecked exceptions freely</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>8. Advantages, Limitations & Use Cases</h2>
          <h3>Advantages</h3>
          <ul>
            <li><strong>Polymorphic Extensibility:</strong> New subclasses (e.g., <code>DataScientist</code>) can be integrated into existing processing loops without modifying legacy driver code (Open-Closed Principle).</li>
            <li><strong>DRY Principle (Don't Repeat Yourself):</strong> Shared state and validation routines reside in one authoritative place.</li>
          </ul>
          <h3>Limitations</h3>
          <ul>
            <li><strong>Tight Coupling (Fragile Base Class Problem):</strong> A modification to a base class method contract can inadvertently break functionality across hundreds of subclasses.</li>
            <li><strong>No Multiple Class Inheritance:</strong> Java does not permit <code>class C extends A, B</code> to avoid the Diamond Problem (resolved using Interfaces).</li>
          </ul>

          <h2>9. Common Mistakes & Anti-Patterns</h2>
          <ul>
            <li><strong>Forgetting <code>@Override</code>:</strong> If you misspell the method name or alter a parameter type, the compiler treats it as a new overloaded method rather than an override. Always use the <code>@Override</code> annotation so the compiler catches mismatches.</li>
            <li><strong>Attempting to Override <code>private</code> or <code>static</code> Methods:</strong> <code>private</code> methods are not visible to subclasses; defining a method with the same signature in the subclass simply creates an unrelated method. <code>static</code> methods belong to the class, not the instance, resulting in method hiding rather than dynamic dispatch.</li>
            <li><strong>Calling Overridable Methods inside Constructors:</strong> If a superclass constructor calls an overridden method, the subclass version will execute <em>before</em> the subclass constructor has initialized its own fields, reading default zeros or <code>null</code>s!</li>
          </ul>

          <h2>10. University Exam & Interview Questions</h2>
          <div class="theory-card" style="margin-bottom: 16px;">
            <h3>Q1: Explain Covariant Return Types in Java with an example.</h3>
            <p><strong>Answer:</strong> Since Java 5, an overriding method in a subclass is permitted to return a subtype of the return type declared in the superclass method, known as a covariant return type. For example:</p>
            <pre class="code-block"><code>class BaseFactory {
    public Employee create() { return new Employee(); }
}
class EngineerFactory extends BaseFactory {
    @Override
    public SoftwareEngineer create() { return new SoftwareEngineer(); } // Valid covariant return!
}</code></pre>
            <p>This avoids explicit casting at the call site when invoking <code>engineerFactory.create()</code>.</p>
          </div>

          <div class="theory-card">
            <h3>Q2: Why doesn't Java support multiple inheritance of classes?</h3>
            <p><strong>Answer:</strong> Java avoids the <strong>Diamond Problem</strong>. If class <code>D</code> extends both <code>B</code> and <code>C</code>, and both <code>B</code> and <code>C</code> override a method <code>display()</code> from superclass <code>A</code>, the compiler cannot deterministically deduce whether <code>d.display()</code> should invoke <code>B.display()</code> or <code>C.display()</code>. Java cleanly resolves this by allowing multiple inheritance of <em>type/interface</em> via <code>implements InterfaceA, InterfaceB</code>, with explicit resolution rules for default methods.</p>
          </div>

          <h2>11. Chapter Summary & Key Terminology</h2>
          <div class="callout callout-points">
            <ul>
              <li><strong>IS-A Relationship:</strong> Semantic test for inheritance (a SoftwareEngineer IS-A Employee).</li>
              <li><strong>super():</strong> Explicit invocation of the immediate parent constructor.</li>
              <li><strong>Dynamic Method Dispatch:</strong> Runtime resolution of overridden methods based on the underlying object instance rather than the reference type.</li>
              <li><strong>Method Hiding:</strong> When a subclass declares a static method with the same signature as a static method in its superclass.</li>
            </ul>
          </div>
        `
      }
    ]
  },
  {
    chapterTitle: '2. Java Collections, Generics & Data Structures',
    chapterDescription: 'Deep architectural coverage of List, Set, Map, and internal hashing mechanisms.',
    topics: [
      {
        title: 'Java Collections Framework & HashMap Internals',
        slug: 'java-collections-framework-and-hashmap-internals',
        summary: 'Explore the Java Collections hierarchy, ArrayList vs LinkedList trade-offs, and how HashMap resolves hash collisions via bucket chaining and red-black trees.',
        minutes: 15,
        video_url: 'https://www.youtube.com/watch?v=70qy6_GW1c4',
        video_title: 'HashMap Internal Working in Java - Gate Smashers',
        video_source: 'Gate Smashers',
        video_objective: 'Understand hashing algorithms, bucket index calculation (hash & (n-1)), hashCode and equals contract, collision resolution, and Java 8 treeification.',
        content: `
          <div class="callout callout-def">
            <strong>1. Definition & Core Meaning:</strong>
            The <strong>Java Collections Framework (JCF)</strong> is a unified architecture for representing, manipulating, and storing collections of objects. It provides standard abstract interfaces (<code>Collection</code>, <code>List</code>, <code>Set</code>, <code>Queue</code>, <code>Map</code>), concrete data structure implementations (<code>ArrayList</code>, <code>LinkedList</code>, <code>HashSet</code>, <code>HashMap</code>), and polymorphic algorithms (sorting, binary searching).
          </div>

          <h2>2. Why the Concept Is Needed</h2>
          <p>Prior to Java 1.2, Java lacked a standard collection library; developers relied on ad-hoc legacy containers like <code>Vector</code>, <code>Stack</code>, <code>Hashtable</code>, and primitive arrays. Primitive arrays suffer from fixed capacity: once allocated as <code>new int[10]</code>, they cannot dynamically expand without manual reallocation and array copy. Legacy containers were synchronized on every method call, severely bottlenecking multi-threaded performance.</p>
          <p>The Collections Framework introduces generic, high-performance, dynamic data structures with guaranteed time complexities, enabling developers to choose optimal data structures (e.g., O(1) random access vs O(1) midpoint insertion).</p>

          <h2>3. Internal Working of HashMap Explained Step by Step</h2>
          <p>The most heavily tested component in CS interviews is the internal operation of <code>java.util.HashMap</code>:</p>
          <ol>
            <li><strong>Internal Storage Array:</strong> A <code>HashMap</code> maintains an array of <code>Node&lt;K,V&gt;[] table</code> (also called "buckets"). Default initial capacity is <code>16</code> (always a power of 2) with a default <strong>Load Factor of 0.75</strong>.</li>
            <li><strong>Bucket Index Calculation:</strong> When <code>map.put(key, value)</code> is invoked:
              <ul>
                <li>The key's <code>hashCode()</code> is retrieved.</li>
                <li>A supplementary bit-spread hash function is applied to minimize clustering: <code>h = key.hashCode() ^ (h &gt;&gt;&gt; 16)</code>.</li>
                <li>The bucket index is computed using fast bitwise AND: <code>index = (n - 1) &amp; h</code> (where <code>n</code> is array capacity). This is mathematically equivalent to <code>h % n</code> but executes in a single CPU cycle.</li>
              </ul>
            </li>
            <li><strong>Collision Resolution (Chaining):</strong> If two distinct keys map to the same bucket index (a <em>hash collision</em>), HashMap stores them in a linked list at that bucket node.</li>
            <li><strong>Treeification (Java 8 Optimization):</strong> If a bucket's linked list reaches <strong>TREEIFY_THRESHOLD = 8</strong> and the total table capacity is at least <strong>MIN_TREEIFY_CAPACITY = 64</strong>, the linked list is dynamically converted into a self-balancing <strong>Red-Black Tree (TreeNode)</strong>. This guarantees that worst-case lookup degrades to <code>O(log n)</code> instead of linear <code>O(n)</code>.</li>
            <li><strong>Rehashing &amp; Resizing:</strong> When the number of stored entries exceeds <code>threshold = capacity &times; loadFactor</code> (e.g., <code>16 &times; 0.75 = 12</code> entries), the bucket array doubles in size (16 &rarr; 32 &rarr; 64), and all existing keys are re-indexed.</li>
          </ol>

          <h2>4. Real-World Analogy</h2>
          <div class="callout callout-points">
            <strong>Analogy:</strong> Hotel Luggage Storage Room:
            <ul>
              <li><strong>The Bucket Array:</strong> A wall containing 16 numbered shelves (Buckets 0 to 15).</li>
              <li><strong>The Hash Function:</strong> The concierge takes your claim ticket (Key), calculates a shelf number using a mathematical formula, and directs you to Shelf 7.</li>
              <li><strong>Collision Handling:</strong> If two guests are assigned Shelf 7, their bags are stacked in a neat vertical line. If too many bags pile up on Shelf 7 (more than 8), the concierge installs an automated sorting carousel (Red-Black Tree) so retrieval remains instant.</li>
            </ul>
          </div>

          <h2>5. Architectural Diagram: HashMap Bucket Hashing</h2>
          <div style="margin: 24px 0; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center;">
            <svg viewBox="0 0 720 360" width="100%" height="auto" style="max-width: 680px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <!-- Bucket Array Header -->
              <text x="360" y="30" text-anchor="middle" font-size="15" font-weight="bold" fill="#1e293b">JAVA 8+ HASHMAP BUCKET ARRAY &amp; COLLISION HANDLING</text>

              <!-- Array Boxes -->
              <rect x="50" y="60" width="90" height="40" fill="#eff6ff" stroke="#2563eb" stroke-width="1.5" />
              <text x="95" y="85" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e40af">Bucket [0]</text>

              <rect x="50" y="110" width="90" height="40" fill="#eff6ff" stroke="#2563eb" stroke-width="1.5" />
              <text x="95" y="135" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e40af">Bucket [1]</text>

              <rect x="50" y="160" width="90" height="40" fill="#eff6ff" stroke="#2563eb" stroke-width="1.5" />
              <text x="95" y="185" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e40af">Bucket [2]</text>

              <rect x="50" y="210" width="90" height="40" fill="#eff6ff" stroke="#2563eb" stroke-width="1.5" />
              <text x="95" y="235" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e40af">Bucket [3]</text>

              <rect x="50" y="260" width="90" height="40" fill="#eff6ff" stroke="#2563eb" stroke-width="1.5" />
              <text x="95" y="285" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e40af">Bucket [4..15]</text>

              <!-- Bucket 0: null pointer -->
              <line x1="140" y1="80" x2="200" y2="80" stroke="#94a3b8" stroke-width="2" />
              <text x="220" y="85" font-size="12" fill="#94a3b8">null (Empty)</text>

              <!-- Bucket 1: Singly-linked list collision -->
              <line x1="140" y1="130" x2="190" y2="130" stroke="#2563eb" stroke-width="2" marker-end="url(#arrow)" />
              <rect x="190" y="112" width="130" height="36" rx="4" fill="#ffffff" stroke="#3b82f6" />
              <text x="255" y="134" text-anchor="middle" font-size="11" fill="#1e293b">Key: "USA" &rarr; Val: 1</text>

              <line x1="320" y1="130" x2="370" y2="130" stroke="#2563eb" stroke-width="2" />
              <rect x="370" y="112" width="130" height="36" rx="4" fill="#ffffff" stroke="#3b82f6" />
              <text x="435" y="134" text-anchor="middle" font-size="11" fill="#1e293b">Key: "IND" &rarr; Val: 2</text>
              <line x1="500" y1="130" x2="540" y2="130" stroke="#94a3b8" stroke-width="2" />
              <text x="560" y="134" font-size="11" fill="#94a3b8">null</text>

              <!-- Bucket 2: Direct Single Node -->
              <line x1="140" y1="180" x2="190" y2="180" stroke="#2563eb" stroke-width="2" />
              <rect x="190" y="162" width="140" height="36" rx="4" fill="#ffffff" stroke="#3b82f6" />
              <text x="260" y="184" text-anchor="middle" font-size="11" fill="#1e293b">Key: "JPN" &rarr; Val: 81</text>
              <line x1="330" y1="180" x2="370" y2="180" stroke="#94a3b8" stroke-width="2" />
              <text x="385" y="184" font-size="11" fill="#94a3b8">null</text>

              <!-- Bucket 3: Treeified Red-Black Tree (> 8 entries) -->
              <line x1="140" y1="230" x2="190" y2="230" stroke="#dc2626" stroke-width="2" />
              <rect x="190" y="210" width="310" height="40" rx="4" fill="#fef2f2" stroke="#ef4444" stroke-width="1.5" />
              <text x="345" y="235" text-anchor="middle" font-size="11" font-weight="bold" fill="#b91c1c">Treeified into Red-Black Tree (O(log n) Search)</text>

              <!-- Annotation Footer -->
              <rect x="50" y="315" width="620" height="32" rx="4" fill="#f1f5f9" />
              <text x="360" y="336" text-anchor="middle" font-size="11" fill="#475569">Index = (n - 1) &amp; hash | Default Capacity = 16 | Load Factor = 0.75 | Tree Threshold = 8</text>
            </svg>
            <div style="font-size: 0.85rem; color: #64748b; margin-top: 8px;">Figure 1.3: HashMap Internal Bucket Indexing, Node Chaining, and Red-Black Treeification</div>
          </div>

          <h2>6. Code Implementations & Fully Explained Examples</h2>
          <pre class="code-block"><button class="copy-btn">Copy</button><code>import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

// Custom Class Demonstrating the hashCode &amp; equals Contract
class StudentKey {
    private final int rollNumber;
    private final String department;

    public StudentKey(int rollNumber, String department) {
        this.rollNumber = rollNumber;
        this.department = department;
    }

    // MANDATORY: Both hashCode and equals MUST evaluate the exact same fields!
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        StudentKey that = (StudentKey) o;
        return rollNumber == that.rollNumber &amp;&amp;
               Objects.equals(department, that.department);
    }

    @Override
    public int hashCode() {
        return Objects.hash(rollNumber, department);
    }

    @Override
    public String toString() {
        return rollNumber + " (" + department + ")";
    }
}

public class CollectionsDemo {
    public static void main(String[] args) {
        Map&lt;StudentKey, Double&gt; gpaMap = new HashMap&lt;&gt;();

        StudentKey s1 = new StudentKey(101, "CSE");
        StudentKey s2 = new StudentKey(102, "ECE");
        StudentKey s3 = new StudentKey(101, "CSE"); // Same fields as s1

        // Insert records
        gpaMap.put(s1, 3.85);
        gpaMap.put(s2, 3.70);

        // Put with s3 will UPDATE s1 because s1.equals(s3) is true!
        gpaMap.put(s3, 3.92);

        System.out.println("Total Map Size (Expected 2): " + gpaMap.size());
        System.out.println("GPA for Roll 101 CSE: " + gpaMap.get(new StudentKey(101, "CSE")));

        // Iterate map entries
        for (Map.Entry&lt;StudentKey, Double&gt; entry : gpaMap.entrySet()) {
            System.out.printf("Student: %s -&gt; GPA: %.2f%n", entry.getKey(), entry.getValue());
        }
    }
}</code></pre>

          <h3>Expected Output:</h3>
          <pre class="code-block"><code>Total Map Size (Expected 2): 2
GPA for Roll 101 CSE: 3.92
Student: 101 (CSE) -&gt; GPA: 3.92
Student: 102 (ECE) -&gt; GPA: 3.70</code></pre>

          <h2>7. Comparison Analysis: Core Collections Compared</h2>
          <div class="table-responsive">
            <table class="tutorial-table">
              <thead>
                <tr>
                  <th>Collection Type</th>
                  <th>Underlying Data Structure</th>
                  <th>Order Preservation</th>
                  <th>Duplicates Allowed?</th>
                  <th>Get by Index</th>
                  <th>Insert/Delete (Midpoint)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>ArrayList</strong></td>
                  <td>Resizable contiguous array</td>
                  <td>Insertion order</td>
                  <td>Yes</td>
                  <td><code>O(1)</code> Instant</td>
                  <td><code>O(N)</code> (Array shift)</td>
                </tr>
                <tr>
                  <td><strong>LinkedList</strong></td>
                  <td>Doubly-linked list</td>
                  <td>Insertion order</td>
                  <td>Yes</td>
                  <td><code>O(N)</code> Traversal</td>
                  <td><code>O(1)</code> (If pointer held)</td>
                </tr>
                <tr>
                  <td><strong>HashSet</strong></td>
                  <td>HashMap instance</td>
                  <td>No order</td>
                  <td>No (Unique only)</td>
                  <td>N/A (Key-based)</td>
                  <td><code>O(1)</code> Average</td>
                </tr>
                <tr>
                  <td><strong>TreeSet</strong></td>
                  <td>Red-Black Tree (TreeMap)</td>
                  <td>Sorted (Natural / Comparator)</td>
                  <td>No</td>
                  <td>N/A</td>
                  <td><code>O(log N)</code> Balanced</td>
                </tr>
                <tr>
                  <td><strong>HashMap</strong></td>
                  <td>Array + LinkedList + Red-Black Tree</td>
                  <td>No order</td>
                  <td>Keys: No | Values: Yes</td>
                  <td><code>O(1)</code> Avg by Key</td>
                  <td><code>O(1)</code> Average</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>8. Advantages, Limitations & Use Cases</h2>
          <h3>Advantages</h3>
          <ul>
            <li><strong>Polymorphic Interfaces:</strong> Programming to abstractions (<code>List&lt;String&gt; list = new ArrayList&lt;&gt;();</code>) allows swapping implementation classes with zero caller changes.</li>
            <li><strong>Optimized Constant-Time Lookups:</strong> Hashing containers provide near-instant retrieval across millions of records.</li>
          </ul>
          <h3>Limitations</h3>
          <ul>
            <li><strong>Thread Non-Safety:</strong> Standard collections (<code>ArrayList</code>, <code>HashMap</code>) are not thread-safe. Concurrent modifications throw <code>ConcurrentModificationException</code> (use <code>ConcurrentHashMap</code> or <code>CopyOnWriteArrayList</code> instead).</li>
            <li><strong>Boxing Overhead:</strong> Storing primitive types requires autoboxing wrappers (<code>int</code> &rarr; <code>Integer</code>), increasing heap footprint.</li>
          </ul>

          <h2>9. Common Mistakes & Anti-Patterns</h2>
          <ul>
            <li><strong>Violating the <code>equals()</code> and <code>hashCode()</code> Contract:</strong> If <code>a.equals(b) == true</code>, then <code>a.hashCode() == b.hashCode()</code> MUST be true. Overriding <code>equals</code> without overriding <code>hashCode</code> causes HashMap to lose objects during <code>map.get(key)</code>.</li>
            <li><strong>Mutating a Key Object After Insertion:</strong> Modifying a field that participates in <code>hashCode()</code> after putting the key into a <code>HashSet</code> or <code>HashMap</code> alters its hash value. The object becomes permanently unretrievable (orphaned). Always make Map keys <strong>immutable</strong> (e.g., <code>String</code>, <code>Integer</code>, or record types).</li>
          </ul>

          <h2>10. University Exam & Interview Questions</h2>
          <div class="theory-card" style="margin-bottom: 16px;">
            <h3>Q1: What is a Fail-Fast vs Fail-Safe Iterator?</h3>
            <p><strong>Answer:</strong></p>
            <ul>
              <li><strong>Fail-Fast Iterators (e.g., <code>ArrayList</code>, <code>HashMap</code>):</strong> Maintain an internal modification counter (<code>modCount</code>). If the collection is structurally modified (added/removed) after the iterator is created by any means other than the iterator's own <code>remove()</code> method, the iterator immediately throws <code>ConcurrentModificationException</code>.</li>
              <li><strong>Fail-Safe / Weakly Consistent Iterators (e.g., <code>ConcurrentHashMap</code>, <code>CopyOnWriteArrayList</code>):</strong> Work on a clone or snapshot of the underlying data structure. They do not throw exceptions if the collection is modified during iteration.</li>
            </ul>
          </div>

          <div class="theory-card">
            <h3>Q2: Why does HashMap require array capacity to always be a power of two?</h3>
            <p><strong>Answer:</strong> When capacity <code>n</code> is a power of 2 (e.g., 16 = <code>00010000</code> in binary), then <code>(n - 1)</code> is an all-ones bitmask (15 = <code>00001111</code> in binary). Computing <code>hash &amp; (n - 1)</code> acts as a bitwise modulo operator, preserving all lower bits uniformly across the bucket indices. If <code>n</code> was not a power of 2 (say 15 = <code>1110</code>), the last bit would always be 0, meaning all odd-numbered buckets would remain permanently empty, causing 50% wasted space and double the collision rate!</p>
          </div>

          <h2>11. Chapter Summary & Key Terminology</h2>
          <div class="callout callout-points">
            <ul>
              <li><strong>Load Factor:</strong> Threshold measure (default 0.75) determining when the capacity of a hash table is doubled.</li>
              <li><strong>Treeification:</strong> Converting a collision linked list into a Red-Black Tree when chain length &ge; 8.</li>
              <li><strong>Fail-Fast:</strong> Immediate crash-early behavior upon detecting concurrent structural collection modification.</li>
            </ul>
          </div>
        `
      }
    ]
  },
  {
    chapterTitle: '3. Exception Handling & Robust System Architecture',
    chapterDescription: 'JVM call stack unwinding, checked vs unchecked exceptions, and fault-tolerant design.',
    topics: [
      {
        title: 'Java Exception Hierarchy, Call Stack Unwinding & Best Practices',
        slug: 'java-exception-hierarchy-and-handling',
        summary: 'Understand Throwable, Error vs Exception, checked vs unchecked exceptions, try-with-resources, and JVM call stack unwinding.',
        minutes: 11,
        video_url: 'https://www.youtube.com/watch?v=1XATy_b-iTE',
        video_title: 'Exception Handling in Java - Gate Smashers',
        video_source: 'Gate Smashers',
        video_objective: 'Differentiate Checked vs Unchecked exceptions, master try-catch-finally control flow, custom exceptions, and AutoCloseable resource cleanup.',
        content: `
          <div class="callout callout-def">
            <strong>1. Definition & Core Meaning:</strong>
            An <strong>Exception</strong> is an abnormal event or condition that occurs during program execution that disrupts the normal sequential flow of JVM instructions. Java's <strong>Exception Handling</strong> architecture provides a clean, object-oriented mechanism to decouple error-detection logic from error-recovery logic.
          </div>

          <h2>2. Why the Concept Is Needed</h2>
          <p>In legacy procedural programming (like standard C), error handling is performed using returned error code integers (e.g., returning <code>-1</code> or <code>NULL</code>). This approach is fraught with danger:</p>
          <ul>
            <li>Developers routinely ignore return codes, allowing corrupted state to cascade into catastrophic crashes later.</li>
            <li>Return codes mix application domain return values with error indicators, cluttering functional logic with endless <code>if (err &lt; 0)</code> checks.</li>
          </ul>
          <p>Java exceptions guarantee that errors cannot be quietly ignored: unhandled exceptions propagate up the call stack until intercepted by an enclosing <code>try-catch</code> handler or, if unhandled, terminate the offending thread while printing a descriptive stack trace.</p>

          <h2>3. Internal Working Explained Step by Step</h2>
          <ol>
            <li><strong>Exception Object Instantiation:</strong> When an abnormal condition arises (e.g., dividing by zero or missing file), an exception class instance (e.g., <code>ArithmeticException</code>) is created on the heap, capturing the thread call stack, error message, and cause.</li>
            <li><strong>Throwing:</strong> The keyword <code>throw</code> transfers the exception object to the JVM execution engine.</li>
            <li><strong>Call Stack Unwinding:</strong> The JVM scans the current method's stack frame for an enclosing <code>try-catch</code> block matching the thrown exception type:
              <ul>
                <li>If a matching <code>catch</code> block is found, control jumps directly to that block, and execution resumes normally after the try-catch construct.</li>
                <li>If no matching block exists in the current method, the JVM <strong>pops the current stack frame</strong> and repeats the search in the calling method.</li>
                <li>This process repeats until a handler is found or the bottom of the call stack (<code>main()</code>) is reached. If unhandled, the default <code>UncaughtExceptionHandler</code> logs the trace and terminates the thread.</li>
              </ul>
            </li>
            <li><strong>The <code>finally</code> Guarantee:</strong> A <code>finally</code> block executes unconditionally after its associated <code>try</code> and <code>catch</code> blocks complete, regardless of whether an exception was thrown, caught, or completely unhandled (essential for releasing external OS resources).</li>
            <li><strong>Try-With-Resources (Java 7+):</strong> Any object implementing <code>java.lang.AutoCloseable</code> declared in <code>try (Resource r = ...)</code> has its <code>close()</code> method invoked automatically by compiler-generated synthetic bytecode, eliminating manual <code>finally</code> boilerplate.</li>
          </ol>

          <h2>4. Real-World Analogy</h2>
          <div class="callout callout-points">
            <strong>Analogy:</strong> Corporate Escalation Chain of Command:
            <ul>
              <li><strong>The Exception:</strong> A cashier encounters a counterfeit $100 bill at a retail counter.</li>
              <li><strong>Throwing:</strong> The cashier cannot resolve counterfeit money autonomously, so they "raise an incident" (throw an exception).</li>
              <li><strong>Call Stack Unwinding:</strong> The cashier checks if their station manual has a procedure (Catch). If not, they escalate to the Shift Manager (Calling Frame). If the manager has no procedure, it escalates to the Store Director. If nobody handles it, the store shuts down (Thread termination).</li>
            </ul>
          </div>

          <h2>5. Architectural Diagram: Exception Hierarchy</h2>
          <div style="margin: 24px 0; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center;">
            <svg viewBox="0 0 680 320" width="100%" height="auto" style="max-width: 620px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <!-- Root: Throwable -->
              <rect x="260" y="20" width="160" height="40" rx="6" fill="#eff6ff" stroke="#2563eb" stroke-width="2" />
              <text x="340" y="45" text-anchor="middle" font-size="14" font-weight="bold" fill="#1e3a8a">Throwable</text>

              <!-- Split lines -->
              <line x1="340" y1="60" x2="340" y2="85" stroke="#2563eb" stroke-width="2" />
              <line x1="160" y1="85" x2="520" y2="85" stroke="#2563eb" stroke-width="2" />
              <line x1="160" y1="85" x2="160" y2="110" stroke="#2563eb" stroke-width="2" />
              <line x1="520" y1="85" x2="520" y2="110" stroke="#2563eb" stroke-width="2" />

              <!-- Left Branch: Error -->
              <rect x="70" y="110" width="180" height="40" rx="6" fill="#fef2f2" stroke="#ef4444" stroke-width="1.5" />
              <text x="160" y="135" text-anchor="middle" font-size="13" font-weight="bold" fill="#b91c1c">Error (Fatal JVM Issues)</text>

              <rect x="50" y="170" width="220" height="45" rx="4" fill="#ffffff" stroke="#fca5a5" />
              <text x="160" y="190" text-anchor="middle" font-size="11" fill="#7f1d1d">StackOverflowError</text>
              <text x="160" y="205" text-anchor="middle" font-size="11" fill="#7f1d1d">OutOfMemoryError</text>

              <!-- Right Branch: Exception -->
              <rect x="420" y="110" width="200" height="40" rx="6" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5" />
              <text x="520" y="135" text-anchor="middle" font-size="13" font-weight="bold" fill="#15803d">Exception (Recoverable)</text>

              <!-- Split Exception into Checked and Runtime -->
              <line x1="520" y1="150" x2="520" y2="180" stroke="#16a34a" stroke-width="2" />
              <line x1="380" y1="180" x2="630" y2="180" stroke="#16a34a" stroke-width="2" />
              <line x1="380" y1="180" x2="380" y2="205" stroke="#16a34a" stroke-width="2" />
              <line x1="630" y1="180" x2="630" y2="205" stroke="#16a34a" stroke-width="2" />

              <!-- Checked Exceptions -->
              <rect x="280" y="205" width="200" height="65" rx="4" fill="#ffffff" stroke="#86efac" />
              <text x="380" y="225" text-anchor="middle" font-size="11" font-weight="bold" fill="#14532d">Checked Exceptions</text>
              <text x="380" y="243" text-anchor="middle" font-size="10" fill="#475569">IOException, SQLException</text>
              <text x="380" y="258" text-anchor="middle" font-size="9" fill="#16a34a">(Compiler Enforced)</text>

              <!-- Unchecked / RuntimeExceptions -->
              <rect x="520" y="205" width="220" height="65" rx="4" fill="#ffffff" stroke="#86efac" />
              <text x="630" y="225" text-anchor="middle" font-size="11" font-weight="bold" fill="#14532d">RuntimeException (Unchecked)</text>
              <text x="630" y="243" text-anchor="middle" font-size="10" fill="#475569">NullPointerException, IndexOutOfBounds</text>
              <text x="630" y="258" text-anchor="middle" font-size="9" fill="#dc2626">(Programming Logic Flaws)</text>
            </svg>
            <div style="font-size: 0.85rem; color: #64748b; margin-top: 8px;">Figure 1.4: Java Throwable Hierarchy: Error vs Checked Exception vs RuntimeException</div>
          </div>

          <h2>6. Code Implementations & Fully Explained Examples</h2>
          <pre class="code-block"><button class="copy-btn">Copy</button><code>import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;

// Custom Checked Exception for Domain Failures
class InsufficientFundsException extends Exception {
    private final double deficit;

    public InsufficientFundsException(String message, double deficit) {
        super(message);
        this.deficit = deficit;
    }

    public double getDeficit() {
        return deficit;
    }
}

class BankAccount {
    private double balance;

    public BankAccount(double initialBalance) {
        this.balance = initialBalance;
    }

    // Method declares that it may throw a Checked Exception
    public void withdraw(double amount) throws InsufficientFundsException {
        if (amount &gt; balance) {
            double deficit = amount - balance;
            throw new InsufficientFundsException("Withdrawal rejected: Exceeds balance", deficit);
        }
        balance -= amount;
        System.out.println("Withdrawal successful! Remaining balance: $" + balance);
    }
}

public class ExceptionHandlingDemo {
    public static void main(String[] args) {
        BankAccount account = new BankAccount(500.0);

        try {
            System.out.println("Attempting to withdraw $200...");
            account.withdraw(200.0);

            System.out.println("Attempting to withdraw $400...");
            account.withdraw(400.0); // Will trigger exception

        } catch (InsufficientFundsException ex) {
            System.err.println("Transaction Error: " + ex.getMessage());
            System.err.printf("Shortfall: $%.2f. Please deposit funds.%n", ex.getDeficit());
        } finally {
            System.out.println("Audit Log: Transaction session concluded.");
        }

        // Try-with-resources demonstrating auto-closing
        try (AutoCloseableResource res = new AutoCloseableResource()) {
            res.executeTask();
        } catch (Exception e) {
            System.err.println("Resource error: " + e.getMessage());
        }
    }
}

class AutoCloseableResource implements AutoCloseable {
    public void executeTask() {
        System.out.println("Executing automated task with protected resource...");
    }

    @Override
    public void close() {
        System.out.println("AutoCloseable: Resource safely released by JVM!");
    }
}</code></pre>

          <h3>Expected Output:</h3>
          <pre class="code-block"><code>Attempting to withdraw $200...
Withdrawal successful! Remaining balance: $300.0
Attempting to withdraw $400...
Transaction Error: Withdrawal rejected: Exceeds balance
Shortfall: $100.00. Please deposit funds.
Audit Log: Transaction session concluded.
Executing automated task with protected resource...
AutoCloseable: Resource safely released by JVM!</code></pre>

          <h2>7. Comparison Analysis: Checked vs Unchecked Exceptions</h2>
          <div class="table-responsive">
            <table class="tutorial-table">
              <thead>
                <tr>
                  <th>Dimension</th>
                  <th>Checked Exceptions (Compile-Time)</th>
                  <th>Unchecked Exceptions (Runtime / Logic)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Inheritance</strong></td>
                  <td>Direct subclasses of <code>java.lang.Exception</code> (excluding RuntimeException)</td>
                  <td>Direct subclasses of <code>java.lang.RuntimeException</code></td>
                </tr>
                <tr>
                  <td><strong>Compiler Enforcement</strong></td>
                  <td><strong>Mandatory:</strong> Must be caught via <code>catch</code> or declared in method signature via <code>throws</code></td>
                  <td><strong>Optional:</strong> Compiler does not check or mandate declarations</td>
                </tr>
                <tr>
                  <td><strong>Semantic Meaning</strong></td>
                  <td>Represents expected external failures that well-written systems should recover from (e.g., missing network connection, file not found)</td>
                  <td>Represents internal programming logic flaws, illegal arguments, or violated invariants (e.g., <code>NullPointerException</code>)</td>
                </tr>
                <tr>
                  <td><strong>Examples</strong></td>
                  <td><code>IOException</code>, <code>SQLException</code>, <code>ClassNotFoundException</code></td>
                  <td><code>NullPointerException</code>, <code>ArrayIndexOutOfBoundsException</code>, <code>IllegalArgumentException</code></td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>8. Advantages, Limitations & Common Anti-Patterns</h2>
          <h3>Advantages</h3>
          <ul>
            <li><strong>Guaranteed Resource Cleanup:</strong> Try-with-resources guarantees file handles, database sockets, and network ports are closed even if fatal exceptions arise.</li>
            <li><strong>Centralized Fault Handling:</strong> Error handling can be consolidated in higher-level application gateways rather than duplicating logging across every method.</li>
          </ul>
          <h3>Common Mistakes & Anti-Patterns</h3>
          <ul>
            <li><strong>Empty Catch Blocks (Swallowing Exceptions):</strong> Writing <code>catch (Exception e) {}</code> completely silences critical failure signals, creating impossible-to-debug "ghost failures". Always log or rethrow!</li>
            <li><strong>Catching <code>Throwable</code> or <code>Error</code>:</strong> Catching <code>Throwable</code> intercepts fatal JVM errors like <code>OutOfMemoryError</code>, preventing the JVM from terminating gracefully.</li>
            <li><strong>Using Exceptions for Regular Flow Control:</strong> Throwing an exception creates massive overhead because the JVM must populate the stack trace. Never use exceptions to exit standard loops!</li>
          </ul>

          <h2>9. University Exam & Interview Questions</h2>
          <div class="theory-card" style="margin-bottom: 16px;">
            <h3>Q1: Can a <code>finally</code> block ever fail to execute?</h3>
            <p><strong>Answer:</strong> Yes, in four specific scenarios: (1) Calling <code>System.exit(0)</code> inside the <code>try</code> or <code>catch</code> block, which immediately terminates the host JVM process; (2) The underlying OS thread executing the try block is killed; (3) The host machine suffers a catastrophic power outage or hardware crash; (4) The <code>try</code> block enters an infinite loop.</p>
          </div>

          <div class="theory-card">
            <h3>Q2: What is "Exception Chaining" and how does it prevent loss of root cause?</h3>
            <p><strong>Answer:</strong> Exception chaining is wrapping a low-level exception into a high-level domain exception using <code>throw new ServiceException("Database unavailable", sqlException);</code>. The original exception is passed to the constructor as the "cause". When <code>printStackTrace()</code> is called, the JVM prints both the high-level exception and the "Caused by:" root trace, preserving diagnostic context.</p>
          </div>

          <h2>10. Chapter Summary & Key Terminology</h2>
          <div class="callout callout-points">
            <ul>
              <li><strong>Call Stack Unwinding:</strong> Popping method frames until a matching catch handler is located.</li>
              <li><strong>AutoCloseable:</strong> Interface requiring a <code>close()</code> method, managed automatically by try-with-resources.</li>
              <li><strong>Checked Exception:</strong> Anticipated external conditions enforced by the Java compiler.</li>
            </ul>
          </div>
        `
      }
    ]
  },
  {
    chapterTitle: '4. Multithreading, Concurrency & Synchronization',
    chapterDescription: 'Thread lifecycle, race conditions, memory visibility, monitors, and the Java Concurrency Utilities.',
    topics: [
      {
        title: 'Java Multithreading, Thread Lifecycle, and Monitor Synchronization',
        slug: 'java-multithreading-and-synchronization',
        summary: 'Master the 6 thread states, race condition mitigation, the synchronized keyword, intrinsic object locks (Monitors), volatile variables, and inter-thread communication.',
        minutes: 16,
        video_url: 'https://www.youtube.com/watch?v=L95ODu4iEms',
        video_title: 'Multithreading and Synchronization in Java - Gate Smashers',
        video_source: 'Gate Smashers',
        video_objective: 'Understand thread lifecycle state transitions, synchronized methods vs blocks, deadlocks and prevention, wait/notify mechanisms, and ThreadPoolExecutor basics.',
        content: `
          <div class="callout callout-def">
            <strong>1. Definition & Core Meaning:</strong>
            <strong>Multithreading</strong> is a concurrent execution mechanism that allows multiple lightweight sub-processes (threads) to run concurrently within a single process. In Java, threads share the same process memory space (Heap and Metaspace) while maintaining independent Program Counters and Stack allocations.
          </div>

          <h2>2. Why the Concept Is Needed</h2>
          <p>Modern microprocessors feature 8, 16, or 64 physical cores. A single-threaded application can only utilize a single core at any given millisecond, wasting up to 95% of available server hardware throughput.</p>
          <p>Multithreading provides two major advantages:</p>
          <ul>
            <li><strong>Responsive User Interfaces:</strong> Background tasks (file downloads, heavy computations) execute on worker threads while the UI thread remains fluid.</li>
            <li><strong>High-Throughput Server Systems:</strong> Web servers like Tomcat or Netty assign incoming HTTP requests to worker thread pools, serving tens of thousands of concurrent client connections simultaneously.</li>
          </ul>

          <h2>3. Internal Working Explained Step by Step</h2>
          <ol>
            <li><strong>The 6 Thread States (<code>Thread.State</code>):</strong>
              <ul>
                <li><strong>NEW:</strong> The thread instance has been created (<code>new Thread()</code>) but <code>start()</code> has not yet been invoked.</li>
                <li><strong>RUNNABLE:</strong> The thread is executing in the JVM or ready to execute, waiting for the OS CPU scheduler to dispatch a timeslice.</li>
                <li><strong>BLOCKED:</strong> The thread is waiting to acquire an intrinsic monitor lock to enter or re-enter a <code>synchronized</code> block/method.</li>
                <li><strong>WAITING:</strong> The thread is waiting indefinitely for another thread to perform a specific action (e.g., waiting via <code>Object.wait()</code> or <code>Thread.join()</code>).</li>
                <li><strong>TIMED_WAITING:</strong> The thread is waiting for a specified maximum duration (e.g., <code>Thread.sleep(ms)</code>, <code>Object.wait(timeout)</code>).</li>
                <li><strong>TERMINATED:</strong> The thread has completed execution of its <code>run()</code> method or was aborted by an uncaught exception.</li>
              </ul>
            </li>
            <li><strong>Race Conditions &amp; Critical Sections:</strong> When multiple threads read and write shared mutable memory without synchronization, instructions interleave non-deterministically, corrupting state (e.g., <code>count++</code> is NOT atomic; it involves three CPU operations: READ, INCREMENT, WRITE).</li>
            <li><strong>Intrinsic Locks (Monitors):</strong> Every Java object contains an internal header component called a <strong>Monitor</strong>. When a thread executes a <code>synchronized</code> block:
              <ul>
                <li>It attempts to acquire the object's monitor via the bytecode instruction <code>monitorenter</code>.</li>
                <li>If the lock is free, the JVM increments the monitor's entry count to 1 and records the thread as the lock owner (locks are <strong>reentrant</strong>).</li>
                <li>If another thread owns the lock, the arriving thread is placed into the monitor's <strong>Contention/Entry Set</strong> and transitions to the <code>BLOCKED</code> state.</li>
                <li>Upon exiting the block, the <code>monitorexit</code> instruction decrements the counter; when zero, waiting threads contend for the lock.</li>
              </ul>
            </li>
            <li><strong>Inter-Thread Communication:</strong> Threads coordinate using <code>wait()</code>, <code>notify()</code>, and <code>notifyAll()</code> (which must be called from within a synchronized context). Calling <code>wait()</code> atomically releases the monitor lock and places the thread into the object's <strong>Wait Set</strong> until another thread calls <code>notify()</code>.</li>
          </ol>

          <h2>4. Real-World Analogy</h2>
          <div class="callout callout-points">
            <strong>Analogy:</strong> A Single-Occupancy Restroom with a Lock:
            <ul>
              <li><strong>Shared Resource:</strong> The restroom (Critical Section).</li>
              <li><strong>The Threads:</strong> People waiting in line to use the restroom.</li>
              <li><strong>The Intrinsic Lock:</strong> The key hung on the door. The first person takes the key inside and locks the latch (<code>monitorenter</code>).</li>
              <li><strong>Blocked State:</strong> Everyone else in the hallway is blocked, unable to enter until the key is returned (<code>monitorexit</code>).</li>
            </ul>
          </div>

          <h2>5. Architectural Diagram: Thread Lifecycle Transitions</h2>
          <div style="margin: 24px 0; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center;">
            <svg viewBox="0 0 740 330" width="100%" height="auto" style="max-width: 700px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <!-- Header -->
              <text x="370" y="30" text-anchor="middle" font-size="15" font-weight="bold" fill="#1e293b">JAVA THREAD LIFECYCLE STATE TRANSITIONS</text>

              <!-- State: NEW -->
              <circle cx="80" cy="100" r="40" fill="#f1f5f9" stroke="#64748b" stroke-width="2" />
              <text x="80" y="105" text-anchor="middle" font-size="13" font-weight="bold" fill="#334155">NEW</text>

              <!-- Transition to RUNNABLE -->
              <line x1="120" y1="100" x2="220" y2="100" stroke="#2563eb" stroke-width="2" />
              <polygon points="220,100 210,95 210,105" fill="#2563eb" />
              <text x="170" y="90" text-anchor="middle" font-size="11" fill="#2563eb">start()</text>

              <!-- State: RUNNABLE -->
              <rect x="220" y="70" width="160" height="60" rx="8" fill="#eff6ff" stroke="#2563eb" stroke-width="2" />
              <text x="300" y="97" text-anchor="middle" font-size="14" font-weight="bold" fill="#1e40af">RUNNABLE</text>
              <text x="300" y="115" text-anchor="middle" font-size="10" fill="#64748b">(Ready / Running)</text>

              <!-- Transition to TERMINATED -->
              <line x1="380" y1="100" x2="580" y2="100" stroke="#16a34a" stroke-width="2" />
              <polygon points="580,100 570,95 570,105" fill="#16a34a" />
              <text x="480" y="90" text-anchor="middle" font-size="11" fill="#16a34a">run() completes</text>

              <!-- State: TERMINATED -->
              <circle cx="620" cy="100" r="40" fill="#f0fdf4" stroke="#16a34a" stroke-width="2" />
              <text x="620" y="105" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">TERMINATED</text>

              <!-- Waiting / Blocked Box -->
              <rect x="140" y="200" width="460" height="100" rx="8" fill="#fff7ed" stroke="#ea580c" stroke-width="1.5" />
              <text x="370" y="222" text-anchor="middle" font-size="12" font-weight="bold" fill="#c2410c">SUSPENDED / NON-RUNNABLE STATES</text>

              <rect x="160" y="235" width="120" height="50" rx="6" fill="#ffffff" stroke="#fdba74" />
              <text x="220" y="258" text-anchor="middle" font-size="12" font-weight="bold" fill="#9a3412">BLOCKED</text>
              <text x="220" y="273" text-anchor="middle" font-size="9" fill="#7c2d12">Waiting for monitor lock</text>

              <rect x="310" y="235" width="120" height="50" rx="6" fill="#ffffff" stroke="#fdba74" />
              <text x="370" y="258" text-anchor="middle" font-size="12" font-weight="bold" fill="#9a3412">WAITING</text>
              <text x="370" y="273" text-anchor="middle" font-size="9" fill="#7c2d12">wait(), join()</text>

              <rect x="460" y="235" width="120" height="50" rx="6" fill="#ffffff" stroke="#fdba74" />
              <text x="520" y="258" text-anchor="middle" font-size="11" font-weight="bold" fill="#9a3412">TIMED_WAITING</text>
              <text x="520" y="273" text-anchor="middle" font-size="9" fill="#7c2d12">sleep(ms), wait(t)</text>

              <!-- Arrows between RUNNABLE and SUSPENDED -->
              <line x1="260" y1="130" x2="260" y2="200" stroke="#ea580c" stroke-width="1.5" stroke-dasharray="4" />
              <line x1="340" y1="200" x2="340" y2="130" stroke="#16a34a" stroke-width="1.5" />
            </svg>
            <div style="font-size: 0.85rem; color: #64748b; margin-top: 8px;">Figure 1.5: Complete 6-State JVM Thread Lifecycle and Non-Runnable Transitions</div>
          </div>

          <h2>6. Code Implementations & Fully Explained Examples</h2>
          <pre class="code-block"><button class="copy-btn">Copy</button><code>// Thread-safe Counter demonstrating Monitor Locking
class SynchronizedCounter {
    private int count = 0;

    // Synchronized method locks on 'this' instance
    public synchronized void increment() {
        count++; // Non-atomic compound operation made safe
    }

    public synchronized int getCount() {
        return count;
    }
}

public class ThreadConcurrencyDemo {
    public static void main(String[] args) throws InterruptedException {
        SynchronizedCounter counter = new SynchronizedCounter();
        int totalThreads = 10;
        int incrementsPerThread = 1000;

        Thread[] threads = new Thread[totalThreads];

        // Launch 10 concurrent threads incrementing the shared counter
        for (int i = 0; i &lt; totalThreads; i++) {
            threads[i] = new Thread(() -&gt; {
                for (int j = 0; j &lt; incrementsPerThread; j++) {
                    counter.increment();
                }
            });
            threads[i].start();
        }

        // Wait for all 10 threads to terminate
        for (Thread t : threads) {
            t.join();
        }

        // Without synchronization, race conditions cause the count to be &lt; 10,000!
        System.out.println("Expected Final Count: " + (totalThreads * incrementsPerThread));
        System.out.println("Actual Measured Count:   " + counter.getCount());
    }
}</code></pre>

          <h3>Expected Output:</h3>
          <pre class="code-block"><code>Expected Final Count: 10000
Actual Measured Count:   10000</code></pre>

          <h2>7. Comparison Analysis: Thread Creation Approaches</h2>
          <div class="table-responsive">
            <table class="tutorial-table">
              <thead>
                <tr>
                  <th>Dimension</th>
                  <th>Extending <code>Thread</code></th>
                  <th>Implementing <code>Runnable</code></th>
                  <th>Implementing <code>Callable&lt;V&gt;</code></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Inheritance Flexibility</strong></td>
                  <td>Consumes the single inheritance slot (cannot extend other classes)</td>
                  <td>Leaves inheritance open; can implement multiple interfaces</td>
                  <td>Leaves inheritance open; supports generics</td>
                </tr>
                <tr>
                  <td><strong>Return Values</strong></td>
                  <td><code>run()</code> returns <code>void</code></td>
                  <td><code>run()</code> returns <code>void</code></td>
                  <td><code>call()</code> returns typed value <code>V</code> via <code>Future&lt;V&gt;</code></td>
                </tr>
                <tr>
                  <td><strong>Checked Exceptions</strong></td>
                  <td>Cannot throw checked exceptions</td>
                  <td>Cannot throw checked exceptions</td>
                  <td>Can throw checked exceptions directly</td>
                </tr>
                <tr>
                  <td><strong>Thread Pool Compatibility</strong></td>
                  <td>Poor (couples task with thread lifecycle)</td>
                  <td>Excellent (submittable to <code>ExecutorService</code>)</td>
                  <td>Excellent (submittable to <code>ExecutorService</code>)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>8. Common Mistakes & Anti-Patterns</h2>
          <ul>
            <li><strong>Invoking <code>run()</code> Instead of <code>start()</code>:</strong> Calling <code>thread.run()</code> executes the code synchronously on the <em>calling thread</em>, completely defeating concurrency. Always invoke <code>thread.start()</code> so the JVM spawns an OS thread!</li>
            <li><strong>Deadlocks (Circular Lock Wait):</strong> Occurs when Thread 1 holds Lock A and waits for Lock B, while Thread 2 holds Lock B and waits for Lock A. Prevent deadlocks by always acquiring locks in a <strong>globally consistent order</strong>.</li>
            <li><strong>Assuming <code>volatile</code> Guarantees Atomicity:</strong> The <code>volatile</code> keyword ensures immediate memory visibility across CPU caches, but it does NOT provide mutual exclusion or atomic increments (e.g., <code>volatile int count; count++</code> is still prone to race conditions).</li>
          </ul>

          <h2>9. University Exam & Interview Questions</h2>
          <div class="theory-card" style="margin-bottom: 16px;">
            <h3>Q1: What are the 4 Coffman conditions required for a Deadlock to occur?</h3>
            <p><strong>Answer:</strong></p>
            <ol>
              <li><strong>Mutual Exclusion:</strong> At least one resource must be held in a non-shareable mode.</li>
              <li><strong>Hold and Wait:</strong> A process must be holding at least one resource while requesting additional resources held by others.</li>
              <li><strong>No Preemption:</strong> Resources cannot be forcibly seized; they can only be released voluntarily by the holding thread.</li>
              <li><strong>Circular Wait:</strong> A closed chain of threads exists such that each thread holds a resource needed by the next thread.</li>
            </ol>
            <p>Breaking any ONE of these four conditions mathematically guarantees deadlock freedom.</p>
          </div>

          <h2>10. Chapter Summary & Key Terminology</h2>
          <div class="callout callout-points">
            <ul>
              <li><strong>Critical Section:</strong> A block of code accessing shared mutable state requiring mutual exclusion.</li>
              <li><strong>Monitor:</strong> Synchronization synchronization primitive providing mutual exclusion and condition synchronization.</li>
              <li><strong>Reentrant Lock:</strong> A lock that allows the owning thread to re-acquire the same lock without self-deadlocking.</li>
            </ul>
          </div>
        `
      }
    ]
  }
];
