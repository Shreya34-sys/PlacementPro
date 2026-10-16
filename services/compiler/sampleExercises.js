'use strict';

/**
 * Educational C Compiler Practice Exercises
 * Reuses the real C-Visualize program library and organizes them into
 * beginner, intermediate, and advanced compiler exercises with test cases, hints, and debugging labs.
 */

const EXERCISES = [
  // --- BEGINNER ---
  {
    id: 'hello_world',
    title: '1. Hello World & Calling Conventions',
    difficulty: 'beginner',
    category: 'Basic',
    relevantPhase: 'Target Code Generation',
    learningObjective: 'Observe standard library I/O calling convention and main function prologue/epilogue in generated assembly.',
    problemStatement: 'Write a C program that outputs "Hello, C-Visualize!" followed by a welcome line. Observe how the compiler pushes the format string pointer into %rdi (System V AMD64 ABI) before calling puts or printf.',
    expectedBehavior: 'Prints greeting to stdout with exit code 0.',
    defaultStdin: '',
    hints: [
      'Ensure <stdio.h> is included for printf declaration.',
      'main should return 0 to indicate clean process termination.',
      'Check Phase 6 (Target Assembly) to see the call instruction.'
    ],
    testCases: [
      { id: 1, name: 'Standard Output Check', input: '', expectedOutput: 'Hello, C-Visualize!\nWelcome to the 6-Phase Compiler Visualizer.\n', description: 'Outputs greeting correctly' }
    ],
    starterCode: `#include <stdio.h>

int main() {
    printf("Hello, C-Visualize!\\n");
    printf("Welcome to the 6-Phase Compiler Visualizer.\\n");
    return 0;
}
`,
  },
  {
    id: 'arithmetic',
    title: '2. Arithmetic Expressions & 3-Address Code',
    difficulty: 'beginner',
    category: 'Expressions',
    relevantPhase: 'Intermediate Code Generation',
    learningObjective: 'Inspect how nested arithmetic expressions decompose into 3-address GIMPLE temporaries (D.xxxx).',
    problemStatement: 'Evaluate multiple arithmetic expressions involving addition, subtraction, multiplication, division, and modulo. Check Phase 4 to trace temporary register assignment.',
    expectedBehavior: 'Calculates values and prints algebraic results.',
    defaultStdin: '',
    hints: [
      'Notice how complex nested expressions are broken down into sequential two-operand instructions in GIMPLE.',
      'Observe division and modulo instructions in assembly (idivl).'
    ],
    testCases: [
      { id: 1, name: 'Arithmetic Evaluation', input: '', expectedOutput: 'a = 15, b = 4\nSum: 19, Diff: 11, Prod: 60, Quot: 3, Rem: 3\nComplex Expression ((a+b)*(a-b) + 2a): 239\n', description: 'Computes basic and compound math operations' }
    ],
    starterCode: `#include <stdio.h>

int main() {
    int a = 15;
    int b = 4;
    int sum = a + b;
    int diff = a - b;
    int prod = a * b;
    int quot = a / b;
    int rem = a % b;
    int complexExpr = (a + b) * (a - b) + (a * 2);

    printf("a = %d, b = %d\\n", a, b);
    printf("Sum: %d, Diff: %d, Prod: %d, Quot: %d, Rem: %d\\n", sum, diff, prod, quot, rem);
    printf("Complex Expression ((a+b)*(a-b) + 2a): %d\\n", complexExpr);
    return 0;
}
`,
  },
  {
    id: 'conditionals',
    title: '3. Conditionals & Branching (if, else, switch)',
    difficulty: 'beginner',
    category: 'Control Flow',
    relevantPhase: 'Syntax & Assembly',
    learningObjective: 'Understand how conditional branches create basic blocks and conditional jump instructions (je, jne, cmp).',
    problemStatement: 'Construct a letter-grading decision structure using if-else and switch-case. Inspect the Basic Block graph in GIMPLE and jump tables in assembly.',
    expectedBehavior: 'Evaluates score (85) to Grade B and prints honor description.',
    defaultStdin: '',
    hints: [
      'Compare Phase 4 (GIMPLE <bb 2>, <bb 3>) with the conditional jump labels in Phase 6.',
      'Check if switch statements use jump tables or cascaded comparisons.'
    ],
    testCases: [
      { id: 1, name: 'Grade B Branch', input: '', expectedOutput: 'Score: 85 -> Grade: B\nHonor: Very Good Work!\n', description: 'Executes grade B branch' }
    ],
    starterCode: `#include <stdio.h>

int main() {
    int score = 85;
    char grade;

    if (score >= 90) {
        grade = 'A';
    } else if (score >= 80) {
        grade = 'B';
    } else if (score >= 70) {
        grade = 'C';
    } else {
        grade = 'F';
    }

    printf("Score: %d -> Grade: %c\\n", score, grade);

    switch (grade) {
        case 'A':
            printf("Honor: Excellent Performance!\\n");
            break;
        case 'B':
            printf("Honor: Very Good Work!\\n");
            break;
        default:
            printf("Keep practicing!\\n");
            break;
    }

    return 0;
}
`,
  },
  {
    id: 'loops',
    title: '4. Loops & Induction Variables',
    difficulty: 'beginner',
    category: 'Control Flow',
    relevantPhase: 'Code Optimization',
    learningObjective: 'Observe loop induction variables, loop headers, back-edges, and loop unrolling potential in GIMPLE and assembly.',
    problemStatement: 'Compute the sum of natural numbers from 1 to 10 using a for loop. Inspect the loop condition test and increment in assembly.',
    expectedBehavior: 'Computes sum of 1..10 = 55.',
    defaultStdin: '',
    hints: [
      'Compare how while vs for loops are lowered to the same GIMPLE primitive goto statements.',
      'Notice that the loop condition is often placed at the bottom with a jump to condition.'
    ],
    testCases: [
      { id: 1, name: 'Sum 1 to 10', input: '', expectedOutput: 'Sum of 1 to 10 = 55\n', description: 'Computes correct cumulative sum' }
    ],
    starterCode: `#include <stdio.h>

int main() {
    int n = 10;
    int sum = 0;

    for (int i = 1; i <= n; i++) {
        sum += i;
    }

    printf("Sum of 1 to %d = %d\\n", n, sum);
    return 0;
}
`,
  },
  {
    id: 'arrays',
    title: '5. Arrays & Address Calculation',
    difficulty: 'beginner',
    category: 'Data Structures',
    relevantPhase: 'Target Code Generation',
    learningObjective: 'Observe base + (index * element_size) address calculation in x86_64 SIB (Scale-Index-Base) addressing.',
    problemStatement: 'Declare an array of integers, compute its length dynamically with sizeof, and find the maximum element.',
    expectedBehavior: 'Identifies max element 89 in array.',
    defaultStdin: '',
    hints: [
      'In assembly, look for instructions using displacement: (%rax,%rdx,4).',
      'The factor 4 corresponds to sizeof(int).'
    ],
    testCases: [
      { id: 1, name: 'Find Max in Array', input: '', expectedOutput: 'Maximum element = 89\n', description: 'Finds maximum array value' }
    ],
    starterCode: `#include <stdio.h>

int main() {
    int arr[] = {23, 45, 12, 89, 34, 67};
    int n = sizeof(arr) / sizeof(arr[0]);
    int max = arr[0];

    for (int i = 1; i < n; i++) {
        if (arr[i] > max) {
            max = arr[i];
        }
    }

    printf("Maximum element = %d\\n", max);
    return 0;
}
`,
  },

  // --- INTERMEDIATE ---
  {
    id: 'functions_recursion',
    title: '6. Functions & Recursive Stack Frames',
    difficulty: 'intermediate',
    category: 'Functions & Recursion',
    relevantPhase: 'Target Code Generation',
    learningObjective: 'Inspect stack frame allocation (pushq %rbp, subq $..., %rsp) and recursive base case unwind.',
    problemStatement: 'Implement recursive factorial and recursive Fibonacci functions. Inspect the stack growth in assembly.',
    expectedBehavior: 'Calculates factorial(5)=120 and fib(7)=13.',
    defaultStdin: '',
    hints: [
      'Notice the call instruction followed by the base case branch test.',
      'Check how return values are stored in the %eax / %rax register.'
    ],
    testCases: [
      { id: 1, name: 'Factorial & Fibonacci', input: '', expectedOutput: 'Factorial(5) = 120\nFibonacci(7) = 13\n', description: 'Computes correct recursive values' }
    ],
    starterCode: `#include <stdio.h>

long long factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

int fibonacci(int n) {
    if (n <= 0) return 0;
    if (n == 1) return 1;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main() {
    printf("Factorial(5) = %lld\\n", factorial(5));
    printf("Fibonacci(7) = %d\\n", fibonacci(7));
    return 0;
}
`,
  },
  {
    id: 'pointers_memory',
    title: '7. Pointers, Dereferencing & Pass-by-Reference',
    difficulty: 'intermediate',
    category: 'Pointers & Memory',
    relevantPhase: 'Intermediate & Target Code',
    learningObjective: 'Analyze indirect memory addressing and pointer dereferences in GIMPLE and x86_64 assembly.',
    problemStatement: 'Implement a pointer-based swap function that exchanges two integer values through memory references.',
    expectedBehavior: 'Exchanges values from x=10, y=20 to x=20, y=10.',
    defaultStdin: '',
    hints: [
      'In GIMPLE, pointer dereferences appear as *px = ...',
      'In assembly, pointer dereferencing uses parentheses: movl (%rdi), %eax.'
    ],
    testCases: [
      { id: 1, name: 'Pointer Swap', input: '', expectedOutput: 'Before: x = 10, y = 20\nAfter:  x = 20, y = 10\n', description: 'Swaps values via pointers' }
    ],
    starterCode: `#include <stdio.h>

void swap(int *a, int *b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}

int main() {
    int x = 10, y = 20;
    printf("Before: x = %d, y = %d\\n", x, y);
    swap(&x, &y);
    printf("After:  x = %d, y = %d\\n", x, y);
    return 0;
}
`,
  },
  {
    id: 'structs_memory',
    title: '8. Structs & Memory Alignment (Padding)',
    difficulty: 'intermediate',
    category: 'Data Structures',
    relevantPhase: 'Semantic & Target Code',
    learningObjective: 'Observe struct member offset calculations, natural data alignment, and compiler padding bytes.',
    problemStatement: 'Define a struct Student with char, int, and double fields. Inspect member offsets and the total struct size due to 8-byte alignment.',
    expectedBehavior: 'Prints student record details and demonstrates struct alignment.',
    defaultStdin: '',
    hints: [
      'In Phase 3 (Semantic), check the symbol table for struct field offsets.',
      'Notice that sizeof(Student) is larger than the sum of its members due to compiler alignment padding.'
    ],
    testCases: [
      { id: 1, name: 'Student Struct Display', input: '', expectedOutput: 'ID: 101, Grade: A, GPA: 3.85\n', description: 'Displays struct fields cleanly' }
    ],
    starterCode: `#include <stdio.h>

struct Student {
    int id;        // 4 bytes
    char grade;    // 1 byte (+ 3 padding bytes)
    double gpa;    // 8 bytes
};

int main() {
    struct Student s1 = {101, 'A', 3.85};
    printf("ID: %d, Grade: %c, GPA: %.2f\\n", s1.id, s1.grade, s1.gpa);
    return 0;
}
`,
  },
  {
    id: 'optimization_demo',
    title: '9. Constant Folding & Dead-Code Elimination',
    difficulty: 'intermediate',
    category: 'Optimization Demos',
    relevantPhase: 'Code Optimization',
    learningObjective: 'Observe how the optimizer evaluates constant mathematical operations at compile time and purges unreachable branches.',
    problemStatement: 'Write code with compile-time constant math (100 * 50 - 200) and an unreachable `if (0)` block. Compile with -O0 and then -O2 to inspect the difference in Phase 5.',
    expectedBehavior: 'Prints 4800; unoptimized contains branch, optimized removes branch completely.',
    defaultStdin: '',
    hints: [
      'Under -O0, the compiler emits instructions for the conditional check.',
      'Under -O2, constant folding computes 4800 directly and removes the unused branch.'
    ],
    testCases: [
      { id: 1, name: 'Optimization Evaluation', input: '', expectedOutput: 'Calculated Value: 4800\n', description: 'Prints folded result' }
    ],
    starterCode: `#include <stdio.h>

int main() {
    // Constant folding candidate: 100 * 50 - 200 = 4800 computed at compile time!
    int compileTimeConst = 100 * 50 - 200;

    // Dead code candidate: condition is always false, branch eliminated under -O1/-O2
    int unusedResult = 999;
    if (0) {
        printf("This branch is never executed!\\n");
        unusedResult = 12345;
    }

    printf("Calculated Value: %d\\n", compileTimeConst);
    return 0;
}
`,
  },
  {
    id: 'scanf_stdin',
    title: '10. Interactive Standard Input (scanf)',
    difficulty: 'intermediate',
    category: 'Input & Processing',
    relevantPhase: 'Runtime Execution',
    learningObjective: 'Understand runtime stdin buffering and address-passing (&var) for user input in C.',
    problemStatement: 'Read two numbers from standard input using scanf, add them together, and print the result. Use the stdin input box in the console.',
    expectedBehavior: 'Reads values from stdin and outputs sum.',
    defaultStdin: '40 60\n',
    hints: [
      'Provide inputs in the Terminal / Input pane before running.',
      'scanf requires memory addresses: scanf("%d %d", &a, &b).'
    ],
    testCases: [
      { id: 1, name: 'Sum 40 and 60', input: '40 60\n', expectedOutput: 'Sum = 100\n', description: 'Correctly reads and sums input' }
    ],
    starterCode: `#include <stdio.h>

int main() {
    int a, b;
    if (scanf("%d %d", &a, &b) == 2) {
        printf("Sum = %d\\n", a + b);
    } else {
        printf("Input reading failed.\\n");
    }
    return 0;
}
`,
  },

  // --- ADVANCED & DEBUGGING LABS ---
  {
    id: 'binary_search',
    title: '11. Binary Search & Loop Invariant',
    difficulty: 'advanced',
    category: 'Algorithms',
    relevantPhase: 'Intermediate Code',
    learningObjective: 'Analyze logarithmic search branching with low/high index updates and basic block loops.',
    problemStatement: 'Implement binary search over a sorted array. Inspect how the middle index calculation and conditional narrowing of search space are represented in GIMPLE IR.',
    expectedBehavior: 'Finds key 42 at index 5.',
    defaultStdin: '',
    hints: [
      'Check Phase 4 to trace how mid = low + (high - low) / 2 avoids integer overflow.',
      'Observe the multiple return paths in GIMPLE.'
    ],
    testCases: [
      { id: 1, name: 'Find 42 in array', input: '', expectedOutput: 'Found key 42 at sorted index 5.\n', description: 'Locates key at index 5' }
    ],
    starterCode: `#include <stdio.h>

int binarySearch(int arr[], int low, int high, int key) {
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == key) return mid;
        if (arr[mid] < key) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}

int main() {
    int sorted[] = {2, 7, 14, 23, 31, 42, 55, 68, 79, 90};
    int n = sizeof(sorted) / sizeof(sorted[0]);
    int key = 42;

    int idx = binarySearch(sorted, 0, n - 1, key);
    if (idx != -1) {
        printf("Found key %d at sorted index %d.\\n", key, idx);
    } else {
        printf("Key not found.\\n");
    }
    return 0;
}
`,
  },
  {
    id: 'error_syntax',
    title: '12. [Lab] Debugging Syntax Errors',
    difficulty: 'advanced',
    category: 'Compiler Error Debugging',
    relevantPhase: 'Syntax Analysis',
    isDebuggingExercise: true,
    learningObjective: 'Identify missing tokens (semicolons, braces) from GCC error diagnostics and fix grammar violations.',
    problemStatement: 'This program contains an intentional syntax error (missing semicolon on line 6). Inspect Phase 1 and Phase 2 diagnostics, fix the error, and re-compile successfully.',
    expectedBehavior: 'Initial state: Fails with Syntax Error. Fixed state: Prints Sum = 30.',
    defaultStdin: '',
    hints: [
      'Inspect the error diagnostic: "expected \';\' before \'int\'".',
      'Add the missing semicolon at the end of `int x = 10` on line 6.'
    ],
    testCases: [
      { id: 1, name: 'Corrected Sum Output', input: '', expectedOutput: 'Sum: 30\n', description: 'Fixed code compiles and runs with sum 30' }
    ],
    starterCode: `#include <stdio.h>

int main() {
    // Intentional Syntax Error: Missing semicolon below!
    int x = 10
    int y = 20;
    printf("Sum: %d\\n", x + y);
    return 0;
}
`,
  },
  {
    id: 'error_semantic',
    title: '13. [Lab] Debugging Semantic & Scoping Errors',
    difficulty: 'advanced',
    category: 'Compiler Error Debugging',
    relevantPhase: 'Semantic Analysis',
    isDebuggingExercise: true,
    learningObjective: 'Diagnose undeclared identifiers and variable scoping rules reported by Phase 3 semantic analysis.',
    problemStatement: 'This program references an undeclared variable (`undeclaredVariable`). Inspect the symbol table in Phase 3, declare the variable with an initial value of 100, and re-compile.',
    expectedBehavior: 'Initial state: Fails with "undeclared identifier". Fixed state: Prints Value: 100.',
    defaultStdin: '',
    hints: [
      'The compiler symbol table tracks all active identifiers in the current block scope.',
      'Declare `int undeclaredVariable = 100;` before using it in printf.'
    ],
    testCases: [
      { id: 1, name: 'Corrected Identifier Output', input: '', expectedOutput: 'Value: 100\n', description: 'Declares variable and prints value' }
    ],
    starterCode: `#include <stdio.h>

int main() {
    int validNumber = 42;
    // Intentional Semantic Error: 'undeclaredVariable' is not declared in this scope!
    printf("Value: %d\\n", undeclaredVariable);
    return 0;
}
`,
  },
  {
    id: 'error_linker',
    title: '14. [Lab] Debugging Linker & Missing Symbol Errors',
    difficulty: 'advanced',
    category: 'Compiler Error Debugging',
    relevantPhase: 'Linking Stage',
    isDebuggingExercise: true,
    learningObjective: 'Distinguish between successful translation unit compilation and linker failure due to unresolved external references.',
    problemStatement: 'The code calls a prototype `void nonExistentFunction(void)` whose implementation is nowhere to be found. Implement the body of `nonExistentFunction` so the linker can resolve the symbol.',
    expectedBehavior: 'Initial state: Fails at link stage with "undefined reference to nonExistentFunction". Fixed state: Links cleanly and executes.',
    defaultStdin: '',
    hints: [
      'Notice that Phase 1 through Phase 6 compile successfully, but Linking fails.',
      'Define `void nonExistentFunction(void) { printf("Function defined!\\n"); }` above main.'
    ],
    testCases: [
      { id: 1, name: 'Resolved Linker Output', input: '', expectedOutput: 'About to call undefined function...\nFunction executed successfully!\n', description: 'Resolves missing symbol definition' }
    ],
    starterCode: `#include <stdio.h>

// Intentional Linker Error: Prototype exists, but implementation is missing!
void nonExistentFunction(void);

int main() {
    printf("About to call undefined function...\\n");
    nonExistentFunction();
    return 0;
}
`,
  }
];

function getAllExercises() {
  return EXERCISES.map(({ starterCode, hints, testCases, ...meta }) => meta);
}

function getExerciseById(id) {
  return EXERCISES.find((e) => e.id === id) || null;
}

module.exports = {
  EXERCISES,
  getAllExercises,
  getExerciseById
};
