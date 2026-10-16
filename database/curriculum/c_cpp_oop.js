/**
 * PlacementPro Theory Learning Library - C, C++, and OOP Curriculum
 * Covers:
 * 1. C Programming: Pointers, Memory Layout, Dynamic Memory Allocation, Structs & Unions
 * 2. C++ Programming: Virtual Functions, VTable / VPTR Runtime Polymorphism, Templates & STL
 * 3. Object-Oriented Programming (OOP): 4 Pillars, Abstraction vs Encapsulation, SOLID Principles
 */

module.exports = {
  // C Programming Curriculum
  c: [
    {
      chapterTitle: '1. Pointers, Memory Layout & Dynamic Allocation in C',
      chapterDescription: 'Virtual address space, pointer arithmetic, stack vs heap, and dynamic memory safety.',
      topics: [
        {
          title: 'C Pointers, Memory Segments, and Dynamic Memory Management',
          slug: 'c-pointers-memory-segments-and-dynamic-allocation',
          summary: 'Master pointers, dereferencing, pointer arithmetic, C memory layout (Text, Data, BSS, Heap, Stack), and malloc/calloc/free.',
          minutes: 13,
          video_url: 'https://www.youtube.com/watch?v=2ybLDQptoFg',
          video_title: 'Pointers in C/C++ - Memory Layout and Pointer Arithmetic - freeCodeCamp / Harvard CS50',
          video_source: 'freeCodeCamp / CS50',
          video_objective: 'Understand pointer memory addressing, stack vs heap allocation, dynamic memory lifecycle, and prevention of memory leaks and dangling pointers.',
          content: `
            <div class="callout callout-def">
              <strong>1. Definition & Core Meaning:</strong>
              A <strong>Pointer</strong> in C is a distinct variable whose value is the <strong>physical or virtual memory address</strong> of another variable in RAM. The address-of operator (<code>&amp;</code>) extracts an address, while the dereference operator (<code>*</code>) accesses the data residing at that memory location.
            </div>

            <h2>2. Why the Concept Is Needed</h2>
            <p>Standard variables in C pass values by copy. If a function needs to mutate large structures or return modified data back to the caller without making expensive memory copies, direct memory addressing is required.</p>
            <p>Furthermore, compile-time memory allocations (static and stack arrays) require fixed sizes known beforehand. Pointers enable <strong>Dynamic Memory Allocation</strong>: reserving variable amounts of heap RAM at runtime based on real-time input size.</p>

            <h2>3. Internal Working Explained Step by Step</h2>
            <ol>
              <li><strong>C Virtual Memory Layout:</strong>
                <ul>
                  <li><strong>Text / Code Segment:</strong> Read-only region storing compiled CPU machine instructions.</li>
                  <li><strong>Initialized Data Segment:</strong> Stores global and static variables explicitly initialized (e.g., <code>int count = 10;</code>).</li>
                  <li><strong>BSS (Block Started by Symbol):</strong> Stores uninitialized global and static variables, zero-initialized by the OS loader before <code>main()</code>.</li>
                  <li><strong>Heap:</strong> Managed via <code>malloc()</code>/<code>free()</code>; grows <em>upward</em> toward higher memory addresses.</li>
                  <li><strong>Stack:</strong> Stores local method variables, return addresses, and saved registers; grows <em>downward</em> toward lower memory addresses.</li>
                </ul>
              </li>
              <li><strong>Pointer Arithmetic:</strong> Adding an integer <code>k</code> to a pointer <code>ptr</code> does not increment by <code>k</code> bytes; it increments by <code>k &times; sizeof(*ptr)</code> bytes (e.g., advancing an <code>int*</code> by 1 increments the underlying memory address by 4 bytes on a 64-bit architecture).</li>
              <li><strong>Dynamic Memory Lifecycle:</strong>
                <ul>
                  <li><code>malloc(size_t n)</code>: Allocates <code>n</code> contiguous bytes from the heap without initializing the memory (contains indeterminate garbage bytes).</li>
                  <li><code>calloc(size_t num, size_t size)</code>: Allocates memory and clears all bits to zero.</li>
                  <li><code>realloc(void* ptr, size_t new_size)</code>: Resizes an existing heap block, relocating data if contiguous space is unavailable.</li>
                  <li><code>free(void* ptr)</code>: Marks the heap block as available to the OS memory manager. (Does NOT clear the pointer variable itself!).</li>
                </ul>
              </li>
            </ol>

            <h2>4. Real-World Analogy</h2>
            <div class="callout callout-points">
              <strong>Analogy:</strong> Hotel Room Keycard vs Room Contents:
              <ul>
                <li><strong>The Variable:</strong> The furniture and television inside Hotel Room 402.</li>
                <li><strong>The Pointer:</strong> The plastic keycard envelope labeled "Room 402". The card itself contains no furniture—it simply stores the coordinates to access the room.</li>
                <li><strong>Dangling Pointer:</strong> If the guest checks out and the hotel demolishes the room, but the guest keeps the old keycard, attempting to enter Room 402 results in a catastrophic structural hazard (Undefined Behavior / Segmentation Fault).</li>
              </ul>
            </div>

            <h2>5. Architectural Diagram: C Process Memory Layout</h2>
            <div style="margin: 24px 0; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center;">
              <svg viewBox="0 0 650 360" width="100%" height="auto" style="max-width: 600px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <rect x="150" y="20" width="350" height="320" rx="6" fill="#ffffff" stroke="#334155" stroke-width="2" />
                <text x="325" y="45" text-anchor="middle" font-size="14" font-weight="bold" fill="#0f172a">C PROCESS MEMORY ADDRESS SPACE</text>

                <!-- High Address: Stack -->
                <rect x="170" y="60" width="310" height="50" fill="#fee2e2" stroke="#ef4444" stroke-width="1.5" />
                <text x="325" y="85" text-anchor="middle" font-size="12" font-weight="bold" fill="#991b1b">STACK SEGMENT (Grows Downwards &darr;)</text>
                <text x="325" y="100" text-anchor="middle" font-size="10" fill="#7f1d1d">Local variables, function frames, return addresses</text>

                <!-- Arrow down -->
                <line x1="325" y1="110" x2="325" y2="135" stroke="#ef4444" stroke-width="2" marker-end="url(#arrow)" />

                <!-- Unallocated Virtual Memory Space -->
                <rect x="170" y="140" width="310" height="35" fill="#f8fafc" stroke="#cbd5e1" stroke-dasharray="4" />
                <text x="325" y="162" text-anchor="middle" font-size="10" fill="#94a3b8">&uarr; Free Virtual Address Space &darr;</text>

                <!-- Arrow up -->
                <line x1="325" y1="200" x2="325" y2="175" stroke="#2563eb" stroke-width="2" />

                <!-- Heap -->
                <rect x="170" y="200" width="310" height="45" fill="#eff6ff" stroke="#2563eb" stroke-width="1.5" />
                <text x="325" y="222" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e40af">HEAP SEGMENT (Grows Upwards &uarr;)</text>
                <text x="325" y="237" text-anchor="middle" font-size="10" fill="#1e3a8a">Dynamic allocations: malloc(), calloc(), realloc()</text>

                <!-- BSS & Data -->
                <rect x="170" y="250" width="310" height="35" fill="#f1f5f9" stroke="#64748b" />
                <text x="325" y="272" text-anchor="middle" font-size="11" font-weight="bold" fill="#334155">BSS &amp; Initialized Data Segments (Globals/Statics)</text>

                <!-- Text -->
                <rect x="170" y="290" width="310" height="35" fill="#e2e8f0" stroke="#475569" />
                <text x="325" y="312" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e293b">TEXT SEGMENT (Binary Instructions - Read Only)</text>
              </svg>
              <div style="font-size: 0.85rem; color: #64748b; margin-top: 8px;">Figure 2.1: Virtual Memory Organization of a Compiled C Program</div>
            </div>

            <h2>6. Code Implementations & Fully Explained Examples</h2>
            <pre class="code-block"><button class="copy-btn">Copy</button><code>#include &lt;stdio.h&gt;
#include &lt;stdlib.h&gt;

void allocateAndCompute(int n) {
    // Dynamically allocate array of n integers on the Heap
    int *arr = (int *)malloc(n * sizeof(int));

    // MANDATORY: Verify allocation succeeded (prevent NULL pointer dereference)
    if (arr == NULL) {
        fprintf(stderr, "Fatal: Out of Heap memory!\\n");
        exit(EXIT_FAILURE);
    }

    // Populate array using pointer arithmetic
    for (int i = 0; i &lt; n; i++) {
        *(arr + i) = (i + 1) * 10; // Equivalent to arr[i] = (i + 1) * 10
    }

    printf("Dynamic Heap Array Values: ");
    for (int i = 0; i &lt; n; i++) {
        printf("%d ", *(arr + i));
    }
    printf("\\n");

    // Free allocated heap memory to prevent memory leak
    free(arr);

    // Defensive programming: Neutralize dangling pointer
    arr = NULL;
}

int main() {
    int x = 42;
    int *p = &amp;x; // Pointer p stores address of x

    printf("Value of x: %d\\n", x);
    printf("Address of x (&amp;x): %p\\n", (void *)&amp;x);
    printf("Value stored in pointer p: %p\\n", (void *)p);
    printf("Dereferenced value (*p): %d\\n", *p);

    // Dynamic memory demonstration
    allocateAndCompute(5);

    return 0;
}</code></pre>

            <h3>Expected Output:</h3>
            <pre class="code-block"><code>Value of x: 42
Address of x (&amp;x): 0x7ffd5e3a8c14
Value stored in pointer p: 0x7ffd5e3a8c14
Dereferenced value (*p): 42
Dynamic Heap Array Values: 10 20 30 40 50</code></pre>

            <h2>7. Comparison Analysis: <code>malloc</code> vs <code>calloc</code></h2>
            <div class="table-responsive">
              <table class="tutorial-table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th><code>malloc()</code></th>
                    <th><code>calloc()</code></th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Syntax</strong></td>
                    <td><code>void* malloc(size_t size)</code></td>
                    <td><code>void* calloc(size_t num, size_t size)</code></td>
                  </tr>
                  <tr>
                    <td><strong>Memory Initialization</strong></td>
                    <td>Does NOT initialize memory (contains random garbage bytes)</td>
                    <td>Initializes all allocated bits to <strong>zero</strong></td>
                  </tr>
                  <tr>
                    <td><strong>Execution Speed</strong></td>
                    <td>Faster (no zero-fill operation)</td>
                    <td>Slightly slower due to zero-clearing overhead</td>
                  </tr>
                  <tr>
                    <td><strong>Typical Use Case</strong></td>
                    <td>When memory will be immediately overwritten by new data</td>
                    <td>When clean zero-state is required (e.g., matrices, counters)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2>8. Common Mistakes & Anti-Patterns</h2>
            <ul>
              <li><strong>Dangling Pointers:</strong> Accessing a pointer after its pointed-to memory has been freed with <code>free(ptr)</code>. Fix: immediately set <code>ptr = NULL;</code> after freeing.</li>
              <li><strong>Memory Leaks:</strong> Allocating heap memory inside a loop or function without corresponding <code>free()</code> calls. Over time, the application consumes all host RAM and crashes.</li>
              <li><strong>Double Free:</strong> Calling <code>free(ptr)</code> twice on the same pointer corrupts internal heap allocators and triggers immediate process termination.</li>
            </ul>

            <h2>9. University Exam & Interview Questions</h2>
            <div class="theory-card" style="margin-bottom: 16px;">
              <h3>Q1: What is a Segmentation Fault and what causes it in C?</h3>
              <p><strong>Answer:</strong> A Segmentation Fault (SIGSEGV) is an OS hardware interrupt triggered by the Memory Management Unit (MMU) when a program attempts to access a memory address that it does not have permission to read or write. Common causes include: dereferencing a <code>NULL</code> or uninitialized pointer, writing to the read-only Text segment, or overflowing stack frames into protected pages.</p>
            </div>

            <h2>10. Chapter Summary & Key Terminology</h2>
            <div class="callout callout-points">
              <ul>
                <li><strong>Dereference (<code>*</code>):</strong> Reading or writing the data stored at the target memory address.</li>
                <li><strong>Heap:</strong> Dynamically managed memory region requiring explicit programmer allocation and deallocation.</li>
                <li><strong>Memory Leak:</strong> Unreferenced heap memory that is never returned to the OS.</li>
              </ul>
            </div>
          `
        }
      ]
    }
  ],

  // C++ Programming Curriculum
  cpp: [
    {
      chapterTitle: '1. Object-Oriented C++, Virtual Functions & STL',
      chapterDescription: 'Virtual Method Tables (vtable), dynamic polymorphism, templates, and standard containers.',
      topics: [
        {
          title: 'C++ Virtual Functions, VTable Mechanics, and Runtime Polymorphism',
          slug: 'cpp-virtual-functions-and-vtable-internals',
          summary: 'Understand virtual functions, pure virtual functions, abstract classes, virtual destructors, and internal VTable and VPTR memory layouts.',
          minutes: 14,
          video_url: 'https://www.youtube.com/watch?v=oIV2KchSyGQ',
          video_title: 'Virtual Functions and VTable in C++ - Gate Smashers',
          video_source: 'Gate Smashers',
          video_objective: 'Master runtime dynamic binding, the structure of the virtual method table (vtable), virtual pointer (vptr) offsets, and virtual destructors.',
          content: `
            <div class="callout callout-def">
              <strong>1. Definition & Core Meaning:</strong>
              A <strong>Virtual Function</strong> in C++ is a member function declared with the <code>virtual</code> keyword in a base class and redefined (overridden) in derived classes. It signals the compiler to resolve calls using <strong>late / dynamic binding</strong> at runtime rather than early static binding at compile time.
            </div>

            <h2>2. Why the Concept Is Needed</h2>
            <p>In standard C++, when a base class pointer points to a derived class object (e.g., <code>Shape* s = new Circle();</code>), calling <code>s-&gt;draw()</code> without virtual functions causes the compiler to bind to <code>Shape::draw()</code> because the reference type is <code>Shape*</code>. This makes true polymorphic behavior impossible without explicit runtime type checking.</p>
            <p>Virtual functions allow treating diverse derived objects uniformly through common base pointers, invoking the appropriate derived implementations dynamically.</p>

            <h2>3. Internal Working Explained Step by Step</h2>
            <p>C++ compilers implement runtime polymorphism using two internal compiler-generated artifacts:</p>
            <ol>
              <li><strong>The VTable (Virtual Method Table):</strong> A static array of function pointers created once per class containing virtual functions. Each entry in the VTable stores the memory address of the corresponding virtual function.</li>
              <li><strong>The VPTR (Virtual Pointer):</strong> An internal hidden pointer inserted into every object instance of a class that has virtual functions. The VPTR points directly to the class's VTable.</li>
              <li><strong>Resolution Sequence:</strong>
                <ul>
                  <li>When <code>s-&gt;draw()</code> is called:</li>
                  <li>The CPU reads the object's hidden <code>vptr</code>.</li>
                  <li>The CPU indexes into the VTable at the fixed offset assigned to <code>draw()</code>.</li>
                  <li>The CPU fetches the function address (<code>Circle::draw</code>) and jumps to execute it.</li>
                </ul>
              </li>
              <li><strong>Virtual Destructors:</strong> Deleting a derived object through a base pointer (<code>delete basePtr;</code>) without a virtual destructor only calls the base destructor, leaking derived class resources. Making the base destructor <code>virtual</code> ensures destruction cascades from derived to base.</li>
            </ol>

            <h2>4. Architectural Diagram: VTable & VPTR Memory Layout</h2>
            <div style="margin: 24px 0; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center;">
              <svg viewBox="0 0 680 300" width="100%" height="auto" style="max-width: 640px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <!-- Object Instance -->
                <rect x="50" y="50" width="220" height="150" rx="6" fill="#eff6ff" stroke="#2563eb" stroke-width="2" />
                <text x="160" y="75" text-anchor="middle" font-size="13" font-weight="bold" fill="#1e3a8a">Circle Object Instance (Heap)</text>
                <line x1="50" y1="85" x2="270" y2="85" stroke="#93c5fd" />

                <!-- vptr field -->
                <rect x="65" y="95" width="190" height="40" rx="4" fill="#ffffff" stroke="#3b82f6" />
                <text x="160" y="120" text-anchor="middle" font-size="12" font-weight="bold" fill="#2563eb">__vptr (8 bytes)</text>

                <!-- Data members -->
                <rect x="65" y="145" width="190" height="40" rx="4" fill="#f8fafc" stroke="#cbd5e1" />
                <text x="160" y="170" text-anchor="middle" font-size="11" fill="#475569">radius = 5.0 (double)</text>

                <!-- Pointer arrow -->
                <line x1="255" y1="115" x2="380" y2="115" stroke="#2563eb" stroke-width="2.5" />
                <polygon points="390,115 378,110 378,120" fill="#2563eb" />

                <!-- VTable -->
                <rect x="390" y="50" width="250" height="180" rx="6" fill="#f0fdf4" stroke="#16a34a" stroke-width="2" />
                <text x="515" y="75" text-anchor="middle" font-size="13" font-weight="bold" fill="#14532d">Circle VTable (Code Segment)</text>
                <line x1="390" y1="85" x2="640" y2="85" stroke="#86efac" />

                <!-- VTable entries -->
                <rect x="405" y="95" width="220" height="35" rx="4" fill="#ffffff" stroke="#86efac" />
                <text x="515" y="117" text-anchor="middle" font-size="11" fill="#14532d">[0] &amp;Circle::~Circle()</text>

                <rect x="405" y="135" width="220" height="35" rx="4" fill="#ffffff" stroke="#86efac" />
                <text x="515" y="157" text-anchor="middle" font-size="11" font-weight="bold" fill="#059669">[1] &amp;Circle::draw()</text>

                <rect x="405" y="175" width="220" height="35" rx="4" fill="#ffffff" stroke="#86efac" />
                <text x="515" y="197" text-anchor="middle" font-size="11" fill="#14532d">[2] &amp;Shape::area()</text>
              </svg>
              <div style="font-size: 0.85rem; color: #64748b; margin-top: 8px;">Figure 2.2: Virtual Pointer (__vptr) and Virtual Method Table (vtable) Resolution</div>
            </div>

            <h2>5. Code Implementations & Fully Explained Examples</h2>
            <pre class="code-block"><button class="copy-btn">Copy</button><code>#include &lt;iostream&gt;
#include &lt;memory&gt;

// Abstract Base Class
class Shape {
public:
    // Pure Virtual Function makes Shape an abstract class
    virtual void draw() const = 0;

    // Virtual Destructor ensures derived destructors fire correctly
    virtual ~Shape() {
        std::cout &lt;&lt; "Shape Base Destructor invoked\\n";
    }
};

class Circle : public Shape {
private:
    double radius;
public:
    Circle(double r) : radius(r) {}

    void draw() const override {
        std::cout &lt;&lt; "Drawing Circle with radius: " &lt;&lt; radius &lt;&lt; "\\n";
    }

    ~Circle() override {
        std::cout &lt;&lt; "Circle Derived Destructor invoked\\n";
    }
};

class Rectangle : public Shape {
private:
    double width, height;
public:
    Rectangle(double w, double h) : width(w), height(h) {}

    void draw() const override {
        std::cout &lt;&lt; "Drawing Rectangle of dimensions: " &lt;&lt; width &lt;&lt; " x " &lt;&lt; height &lt;&lt; "\\n";
    }

    ~Rectangle() override {
        std::cout &lt;&lt; "Rectangle Derived Destructor invoked\\n";
    }
};

int main() {
    // Polymorphic array using smart pointers (RAII memory management)
    std::unique_ptr&lt;Shape&gt; shapes[] = {
        std::make_unique&lt;Circle&gt;(7.5),
        std::make_unique&lt;Rectangle&gt;(10.0, 4.0)
    };

    std::cout &lt;&lt; "--- Executing Dynamic Polymorphic Dispatch ---\\n";
    for (const auto&amp; shape : shapes) {
        shape-&gt;draw(); // Dispatches dynamically via VTable!
    }

    std::cout &lt;&lt; "--- Exiting scope (Invoking Virtual Destructors) ---\\n";
    return 0;
}</code></pre>

            <h3>Expected Output:</h3>
            <pre class="code-block"><code>--- Executing Dynamic Polymorphic Dispatch ---
Drawing Circle with radius: 7.5
Drawing Rectangle of dimensions: 10 x 4
--- Exiting scope (Invoking Virtual Destructors) ---
Rectangle Derived Destructor invoked
Shape Base Destructor invoked
Circle Derived Destructor invoked
Shape Base Destructor invoked</code></pre>

            <h2>6. Comparison Analysis: Static vs Dynamic Binding</h2>
            <div class="table-responsive">
              <table class="tutorial-table">
                <thead>
                  <tr>
                    <th>Characteristic</th>
                    <th>Static Binding (Early / Non-Virtual)</th>
                    <th>Dynamic Binding (Late / Virtual)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Decision Time</strong></td>
                    <td>Compile time (Link time)</td>
                    <td>Runtime (Execution time via vtable lookup)</td>
                  </tr>
                  <tr>
                    <td><strong>Resolution Mechanism</strong></td>
                    <td>Pointer/reference type</td>
                    <td>Underlying object type pointed to by vptr</td>
                  </tr>
                  <tr>
                    <td><strong>Memory Overhead</strong></td>
                    <td>Zero extra bytes</td>
                    <td>Extra 8 bytes per object (vptr) + 1 VTable per class</td>
                  </tr>
                  <tr>
                    <td><strong>Call Performance</strong></td>
                    <td>Direct function jump (Can be inlined)</td>
                    <td>One extra memory dereference (Cannot easily inline)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2>7. University Exam & Interview Questions</h2>
            <div class="theory-card" style="margin-bottom: 16px;">
              <h3>Q1: Why must base class destructors be declared virtual when deleting via base pointers?</h3>
              <p><strong>Answer:</strong> If a base class destructor is non-virtual, calling <code>delete basePtr;</code> invokes static binding, meaning only <code>Base::~Base()</code> executes. If the derived class allocated heap resources (e.g., dynamic arrays, file handles), its derived destructor is completely bypassed, producing severe resource leaks. Declaring <code>virtual ~Base()</code> ensures dynamic dispatch invokes <code>Derived::~Derived()</code> first, followed automatically by <code>Base::~Base()</code>.</p>
            </div>
          `
        }
      ]
    }
  ],

  // Object-Oriented Programming (OOP) Curriculum
  oop: [
    {
      chapterTitle: '1. The Four Pillars of OOP & SOLID Principles',
      chapterDescription: 'Encapsulation, abstraction, inheritance, polymorphism, and enterprise design principles.',
      topics: [
        {
          title: 'The Four Pillars of OOP and SOLID Design Principles',
          slug: 'four-pillars-of-oop-and-solid-principles',
          summary: 'Detailed explanation of Encapsulation, Abstraction, Inheritance, and Polymorphism, followed by the five SOLID architectural design principles.',
          minutes: 15,
          video_url: 'https://www.youtube.com/watch?v=1prN_uUOBxY',
          video_title: 'SOLID Principles in Software Engineering - Gate Smashers',
          video_source: 'Gate Smashers',
          video_objective: 'Master Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion principles.',
          content: `
            <div class="callout callout-def">
              <strong>1. Definition & Core Meaning:</strong>
              The <strong>Object-Oriented Programming (OOP)</strong> paradigm is a software engineering methodology that structures programs as collections of cooperating entities called <strong>Objects</strong>, which bind state (data) and behavior (methods) together. The architecture rests upon <strong>Four Foundational Pillars</strong>: Encapsulation, Abstraction, Inheritance, and Polymorphism.
            </div>

            <h2>2. The Four Pillars Explained in Depth</h2>
            <div class="grid-2-col" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0;">
              <div class="theory-card">
                <h3>1. Encapsulation</h3>
                <p>Bundling data fields and the methods that operate on them inside a single class while restricting direct external access via access modifiers (<code>private</code>, <code>protected</code>). State mutations must pass through controlled getters and validation setters.</p>
              </div>
              <div class="theory-card">
                <h3>2. Abstraction</h3>
                <p>Hiding complex internal implementation details and exposing only the essential interface to the user. Realized via abstract classes and interfaces (e.g., a car driver interacts with the steering wheel and pedals without needing to understand fuel injection algorithms).</p>
              </div>
              <div class="theory-card">
                <h3>3. Inheritance</h3>
                <p>Mechanism where a subclass reuses fields and behaviors of a superclass, modeling an <strong>IS-A relationship</strong> and promoting code reuse.</p>
              </div>
              <div class="theory-card">
                <h3>4. Polymorphism</h3>
                <p>"Many forms." The ability of an object or method invocation to take on different behaviors at runtime depending on the underlying concrete instance (Dynamic Method Dispatch).</p>
              </div>
            </div>

            <h2>3. Enterprise SOLID Design Principles</h2>
            <p>Formulated by Robert C. Martin ("Uncle Bob"), the SOLID principles prevent architectural rot in enterprise software:</p>
            <ol>
              <li><strong>S - Single Responsibility Principle (SRP):</strong> A class should have one, and only one, reason to change. Separate business calculations from database persistence and UI formatting.</li>
              <li><strong>O - Open/Closed Principle (OCP):</strong> Software entities should be <em>open for extension</em>, but <em>closed for modification</em>. Add new features by creating new classes rather than modifying existing tested code.</li>
              <li><strong>L - Liskov Substitution Principle (LSP):</strong> Subtypes must be substitutable for their base types without altering the correctness of the program (e.g., a <code>Square</code> should not extend <code>Rectangle</code> if altering width changes height).</li>
              <li><strong>I - Interface Segregation Principle (ISP):</strong> Clients should not be forced to depend on methods they do not use. Split fat interfaces into small, cohesive interfaces.</li>
              <li><strong>D - Dependency Inversion Principle (DIP):</strong> High-level modules should not depend on low-level modules; both should depend on abstractions. Abstractions should not depend on details; details should depend on abstractions.</li>
            </ol>

            <h2>4. Real-World Analogy: Smartphone Architecture</h2>
            <div class="callout callout-points">
              <strong>Analogy:</strong> Modern Smartphone:
              <ul>
                <li><strong>Encapsulation:</strong> The lithium battery is sealed inside the phone chassis. Users cannot touch the bare chemistry; they only interact through safe charging pins.</li>
                <li><strong>Abstraction:</strong> The touchscreen displays a "Capture Photo" button. Tapping it triggers focus algorithms and image sensor calibration without exposing sensor voltage controls.</li>
                <li><strong>Polymorphism:</strong> The audio subsystem can route music to internal speakers, Bluetooth headphones, or USB-C DACs through a single common <code>AudioOutput</code> interface.</li>
              </ul>
            </div>

            <h2>5. Architectural Diagram: The SOLID Principles Matrix</h2>
            <div style="margin: 24px 0; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center;">
              <svg viewBox="0 0 700 280" width="100%" height="auto" style="max-width: 660px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <rect x="20" y="20" width="660" height="240" rx="8" fill="#ffffff" stroke="#2563eb" stroke-width="2" />
                <text x="350" y="45" text-anchor="middle" font-size="15" font-weight="bold" fill="#1e293b">ENTERPRISE SOLID DESIGN PRINCIPLES</text>

                <!-- S Card -->
                <rect x="40" y="65" width="110" height="175" rx="6" fill="#eff6ff" stroke="#3b82f6" />
                <text x="95" y="95" text-anchor="middle" font-size="18" font-weight="bold" fill="#1d4ed8">S</text>
                <text x="95" y="115" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e40af">Single</text>
                <text x="95" y="128" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e40af">Responsibility</text>
                <text x="95" y="155" text-anchor="middle" font-size="9" fill="#475569">One class,</text>
                <text x="95" y="170" text-anchor="middle" font-size="9" fill="#475569">one reason to</text>
                <text x="95" y="185" text-anchor="middle" font-size="9" fill="#475569">change.</text>

                <!-- O Card -->
                <rect x="165" y="65" width="110" height="175" rx="6" fill="#eff6ff" stroke="#3b82f6" />
                <text x="220" y="95" text-anchor="middle" font-size="18" font-weight="bold" fill="#1d4ed8">O</text>
                <text x="220" y="115" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e40af">Open /</text>
                <text x="220" y="128" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e40af">Closed</text>
                <text x="220" y="155" text-anchor="middle" font-size="9" fill="#475569">Open for extension,</text>
                <text x="220" y="170" text-anchor="middle" font-size="9" fill="#475569">closed for</text>
                <text x="220" y="185" text-anchor="middle" font-size="9" fill="#475569">modification.</text>

                <!-- L Card -->
                <rect x="290" y="65" width="115" height="175" rx="6" fill="#eff6ff" stroke="#3b82f6" />
                <text x="347" y="95" text-anchor="middle" font-size="18" font-weight="bold" fill="#1d4ed8">L</text>
                <text x="347" y="115" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e40af">Liskov</text>
                <text x="347" y="128" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e40af">Substitution</text>
                <text x="347" y="155" text-anchor="middle" font-size="9" fill="#475569">Subtypes must</text>
                <text x="347" y="170" text-anchor="middle" font-size="9" fill="#475569">safely replace</text>
                <text x="347" y="185" text-anchor="middle" font-size="9" fill="#475569">base types.</text>

                <!-- I Card -->
                <rect x="420" y="65" width="115" height="175" rx="6" fill="#eff6ff" stroke="#3b82f6" />
                <text x="477" y="95" text-anchor="middle" font-size="18" font-weight="bold" fill="#1d4ed8">I</text>
                <text x="477" y="115" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e40af">Interface</text>
                <text x="477" y="128" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e40af">Segregation</text>
                <text x="477" y="155" text-anchor="middle" font-size="9" fill="#475569">Prefer lean,</text>
                <text x="477" y="170" text-anchor="middle" font-size="9" fill="#475569">client-specific</text>
                <text x="477" y="185" text-anchor="middle" font-size="9" fill="#475569">interfaces.</text>

                <!-- D Card -->
                <rect x="550" y="65" width="115" height="175" rx="6" fill="#eff6ff" stroke="#3b82f6" />
                <text x="607" y="95" text-anchor="middle" font-size="18" font-weight="bold" fill="#1d4ed8">D</text>
                <text x="607" y="115" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e40af">Dependency</text>
                <text x="607" y="128" text-anchor="middle" font-size="10" font-weight="bold" fill="#1e40af">Inversion</text>
                <text x="607" y="155" text-anchor="middle" font-size="9" fill="#475569">Depend on</text>
                <text x="607" y="170" text-anchor="middle" font-size="9" fill="#475569">abstractions,</text>
                <text x="607" y="185" text-anchor="middle" font-size="9" fill="#475569">not concretions.</text>
              </svg>
              <div style="font-size: 0.85rem; color: #64748b; margin-top: 8px;">Figure 2.3: The Five Foundational SOLID Architecture Principles</div>
            </div>

            <h2>6. Code Implementations: Violating vs Respecting DIP</h2>
            <pre class="code-block"><button class="copy-btn">Copy</button><code>// --- VIOLATION OF DEPENDENCY INVERSION (Tightly Coupled) ---
class MySQLDatabase {
    public void executeQuery(String query) {
        System.out.println("Executing query on MySQL Database: " + query);
    }
}

class BadReportingService {
    // Tightly coupled directly to concrete MySQLDatabase!
    private MySQLDatabase database = new MySQLDatabase();

    public void generateReport() {
        database.executeQuery("SELECT * FROM metrics");
    }
}

// --- RESPECTING DEPENDENCY INVERSION (Decoupled via Abstraction) ---
interface DatabaseConnection {
    void executeQuery(String query);
}

class PostgreSQLConnection implements DatabaseConnection {
    @Override
    public void executeQuery(String query) {
        System.out.println("Executing on PostgreSQL via Connection Pool: " + query);
    }
}

class GoodReportingService {
    private final DatabaseConnection database;

    // Dependency Injection: High-level service depends on abstraction
    public GoodReportingService(DatabaseConnection db) {
        this.database = db;
    }

    public void generateReport() {
        database.executeQuery("SELECT * FROM metrics");
    }
}</code></pre>

            <h2>7. University Exam & Interview Questions</h2>
            <div class="theory-card" style="margin-bottom: 16px;">
              <h3>Q1: Distinguish between Abstraction and Encapsulation with a concrete software example.</h3>
              <p><strong>Answer:</strong></p>
              <ul>
                <li><strong>Encapsulation is about Information Hiding:</strong> Keeping fields private and preventing external objects from directly corrupting state (e.g., maintaining an internal <code>private double balance</code> and ensuring negative withdrawals are rejected).</li>
                <li><strong>Abstraction is about Implementation Hiding:</strong> Presenting a simplified conceptual model that hides mechanical details (e.g., calling <code>paymentGateway.charge(100.0)</code> without needing to know whether Stripe or PayPal is communicating over TLS underneath).</li>
              </ul>
            </div>
          `
        }
      ]
    }
  ]
};
