/**
 * Verified C Sample Programs Library
 * 24 comprehensive programs spanning language constructs, phases, and error conditions.
 */

export const SAMPLE_PROGRAMS = [
  {
    id: 'hello_world',
    title: '1. Hello World',
    category: 'Basic',
    relevantPhase: 'Target Code Generation',
    learningObjective: 'Observe basic I/O calling convention and main function prologue/epilogue in assembly.',
    expectedBehavior: 'Prints greeting to stdout with exit code 0.',
    defaultStdin: '',
    sourceCode: `#include <stdio.h>

int main() {
    printf("Hello, C-Visualize!\\n");
    printf("Welcome to the 6-Phase Compiler Visualizer.\\n");
    return 0;
}
`,
  },
  {
    id: 'arithmetic',
    title: '2. Arithmetic Expressions',
    category: 'Expressions',
    relevantPhase: 'Intermediate Code Generation',
    learningObjective: 'Inspect how nested arithmetic expressions decompose into 3-address GIMPLE temporaries.',
    expectedBehavior: 'Calculates values and prints algebraic results.',
    defaultStdin: '',
    sourceCode: `#include <stdio.h>

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
    title: '3. Conditionals (if, else, switch)',
    category: 'Control Flow',
    relevantPhase: 'Syntax & Assembly',
    learningObjective: 'Understand how conditional branches create basic blocks and conditional jumps (je, jne, cmp).',
    expectedBehavior: 'Evaluates grade based on score and prints description.',
    defaultStdin: '',
    sourceCode: `#include <stdio.h>

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
    title: '4. Loops (for, while, do-while)',
    category: 'Control Flow',
    relevantPhase: 'Code Optimization',
    learningObjective: 'Observe loop induction variables, loop headers, and back-edges in GIMPLE and assembly.',
    expectedBehavior: 'Calculates sum of natural numbers using multiple loop constructs.',
    defaultStdin: '',
    sourceCode: `#include <stdio.h>

int main() {
    int n = 5;
    int forSum = 0;
    for (int i = 1; i <= n; i++) {
        forSum += i;
    }

    int whileSum = 0;
    int w = 1;
    while (w <= n) {
        whileSum += w;
        w++;
    }

    int doSum = 0;
    int d = 1;
    do {
        doSum += d;
        d++;
    } while (d <= n);

    printf("Sum of 1..%d using for: %d, while: %d, do-while: %d\\n", n, forSum, whileSum, doSum);
    return 0;
}
`,
  },
  {
    id: 'arrays_1d',
    title: '5. One-Dimensional Arrays',
    category: 'Data Structures',
    relevantPhase: 'Target Code Generation',
    learningObjective: 'Examine array base address indexing and byte offset calculation (base + index * 4).',
    expectedBehavior: 'Initializes and computes statistics over an integer array.',
    defaultStdin: '',
    sourceCode: `#include <stdio.h>

int main() {
    int numbers[6] = {10, 25, 4, 39, 18, 52};
    int sum = 0;
    int max = numbers[0];

    printf("Array Elements: ");
    for (int i = 0; i < 6; i++) {
        printf("%d ", numbers[i]);
        sum += numbers[i];
        if (numbers[i] > max) {
            max = numbers[i];
        }
    }
    printf("\\nSum: %d, Max: %d, Average: %.2f\\n", sum, max, (float)sum / 6);
    return 0;
}
`,
  },
  {
    id: 'arrays_2d',
    title: '6. Multidimensional Arrays (Matrix)',
    category: 'Data Structures',
    relevantPhase: 'Intermediate Code Generation',
    learningObjective: 'Understand row-major layout address computation in C (row * cols + col).',
    expectedBehavior: 'Performs matrix addition and prints the 2x3 result.',
    defaultStdin: '',
    sourceCode: `#include <stdio.h>

int main() {
    int A[2][3] = {{1, 2, 3}, {4, 5, 6}};
    int B[2][3] = {{7, 8, 9}, {1, 2, 3}};
    int C[2][3];

    printf("Matrix Addition (2x3):\\n");
    for (int i = 0; i < 2; i++) {
        for (int j = 0; j < 3; j++) {
            C[i][j] = A[i][j] + B[i][j];
            printf("%3d ", C[i][j]);
        }
        printf("\\n");
    }
    return 0;
}
`,
  },
  {
    id: 'strings',
    title: '7. String Operations',
    category: 'Strings',
    relevantPhase: 'Semantic & Target Code',
    learningObjective: 'Analyze null-terminated character array representation in the .rdata section.',
    expectedBehavior: 'Calculates string length, converts to uppercase, and prints result.',
    defaultStdin: '',
    sourceCode: `#include <stdio.h>

int main() {
    char str[] = "Compiler Design";
    int len = 0;

    while (str[len] != '\\0') {
        len++;
    }

    printf("Original String: %s\\n", str);
    printf("Computed Length: %d characters\\n", len);

    printf("Uppercase: ");
    for (int i = 0; i < len; i++) {
        char ch = str[i];
        if (ch >= 'a' && ch <= 'z') {
            ch = ch - ('a' - 'A');
        }
        putchar(ch);
    }
    putchar('\\n');
    return 0;
}
`,
  },
  {
    id: 'functions_prototypes',
    title: '8. Functions and Prototypes',
    category: 'Functions',
    relevantPhase: 'Semantic Analysis',
    learningObjective: 'Observe function signature matching, return types, and parameter verification in symbol table.',
    expectedBehavior: 'Calls separate helper functions and prints computed values.',
    defaultStdin: '',
    sourceCode: `#include <stdio.h>

/* Function prototypes */
int add(int x, int y);
int power(int base, int exp);

int main() {
    int a = 3, b = 4;
    printf("%d + %d = %d\\n", a, b, add(a, b));
    printf("%d ^ %d = %d\\n", a, b, power(a, b));
    return 0;
}

int add(int x, int y) {
    return x + y;
}

int power(int base, int exp) {
    int res = 1;
    for (int i = 0; i < exp; i++) {
        res *= base;
    }
    return res;
}
`,
  },
  {
    id: 'recursion',
    title: '9. Recursion (Factorial & Fibonacci)',
    category: 'Functions',
    relevantPhase: 'Target Code Generation',
    learningObjective: 'Observe recursive function stack frames pushing caller return addresses and allocating frame space.',
    expectedBehavior: 'Computes factorial of 5 and fibonacci sequence.',
    defaultStdin: '',
    sourceCode: `#include <stdio.h>

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
    int val = 6;
    printf("Factorial of %d is: %lld\\n", val, factorial(val));
    printf("First 7 Fibonacci numbers: ");
    for (int i = 0; i < 7; i++) {
        printf("%d ", fibonacci(i));
    }
    printf("\\n");
    return 0;
}
`,
  },
  {
    id: 'pointers',
    title: '10. Pointers and Pointer Arithmetic',
    category: 'Memory',
    relevantPhase: 'Target Code Generation',
    learningObjective: 'Inspect memory address dereferencing and register indirect addressing (%rax).',
    expectedBehavior: 'Swaps two variables using pointers and navigates an array with pointer arithmetic.',
    defaultStdin: '',
    sourceCode: `#include <stdio.h>

void swap(int *p1, int *p2) {
    int temp = *p1;
    *p1 = *p2;
    *p2 = temp;
}

int main() {
    int x = 100, y = 200;
    printf("Before swap: x = %d, y = %d\\n", x, y);
    swap(&x, &y);
    printf("After swap:  x = %d, y = %d\\n", x, y);

    int arr[3] = {11, 22, 33};
    int *ptr = arr;
    printf("Pointer traversal: ");
    for (int i = 0; i < 3; i++) {
        printf("%d ", *(ptr + i));
    }
    printf("\\n");
    return 0;
}
`,
  },
  {
    id: 'structs_unions',
    title: '11. Structures and Unions',
    category: 'Data Structures',
    relevantPhase: 'Semantic Analysis',
    learningObjective: 'Examine field byte offsets, struct padding, and union memory overlap.',
    expectedBehavior: 'Initializes a Student structure and demonstrates Union shared memory.',
    defaultStdin: '',
    sourceCode: `#include <stdio.h>

struct Student {
    int id;
    char grade;
    float gpa;
};

union DataHolder {
    int intVal;
    float floatVal;
};

int main() {
    struct Student s1 = {101, 'A', 3.85f};
    printf("Student Record: ID=%d, Grade=%c, GPA=%.2f\\n", s1.id, s1.grade, s1.gpa);
    printf("sizeof(struct Student) = %zu bytes\\n", sizeof(struct Student));

    union DataHolder u;
    u.intVal = 1090519040; // binary representation of float ~8.0
    printf("Union read as int: %d, read as float: %.2f\\n", u.intVal, u.floatVal);
    return 0;
}
`,
  },
  {
    id: 'dynamic_memory',
    title: '12. Dynamic Memory Allocation',
    category: 'Memory',
    relevantPhase: 'Linking Stage',
    learningObjective: 'Observe external libc function linking for malloc() and free().',
    expectedBehavior: 'Allocates dynamic memory, stores values, and frees heap memory.',
    defaultStdin: '',
    sourceCode: `#include <stdio.h>
#include <stdlib.h>

int main() {
    int size = 5;
    int *heapArr = (int *)malloc(size * sizeof(int));

    if (heapArr == NULL) {
        printf("Memory allocation failed.\\n");
        return 1;
    }

    for (int i = 0; i < size; i++) {
        heapArr[i] = (i + 1) * 10;
    }

    printf("Dynamic Heap Array: ");
    for (int i = 0; i < size; i++) {
        printf("%d ", heapArr[i]);
    }
    printf("\\n");

    free(heapArr);
    printf("Memory successfully freed.\\n");
    return 0;
}
`,
  },
  {
    id: 'standard_input',
    title: '13. Standard Input with scanf()',
    category: 'Input/Output',
    relevantPhase: 'Runtime Execution',
    learningObjective: 'Supply input via stdin and verify interactive program reception.',
    expectedBehavior: 'Reads two integers from stdin and prints sum and product.',
    defaultStdin: '18 24\n',
    sourceCode: `#include <stdio.h>

int main() {
    int num1, num2;
    printf("Enter two space-separated integers:\\n");
    if (scanf("%d %d", &num1, &num2) == 2) {
        printf("Read num1 = %d, num2 = %d\\n", num1, num2);
        printf("Sum = %d, Product = %d\\n", num1 + num2, num1 * num2);
    } else {
        printf("Invalid input received.\\n");
    }
    return 0;
}
`,
  },
  {
    id: 'dp_fibonacci_input',
    title: 'Dynamic Programming: Fibonacci with scanf()',
    category: 'Dynamic Programming',
    relevantPhase: 'Runtime Execution',
    learningObjective: 'Enter n in the Terminal / Input tab, then run the program to compute Fibonacci with tabulation.',
    expectedBehavior: 'Reads n from stdin and prints the nth Fibonacci number.',
    defaultStdin: '10\n',
    sourceCode: `#include <stdio.h>

int main(void) {
    int n;
    if (scanf("%d", &n) != 1 || n < 0 || n > 90) {
        printf("Enter an integer from 0 to 90.\\n");
        return 1;
    }

    unsigned long long dp[91] = {0, 1};
    for (int i = 2; i <= n; ++i) {
        dp[i] = dp[i - 1] + dp[i - 2];
    }
    printf("Fibonacci(%d) = %llu\\n", n, dp[n]);
    return 0;
}
`,
  },
  {
    id: 'preprocessor',
    title: '14. Preprocessor Macros & Directives',
    category: 'Preprocessing',
    relevantPhase: 'Preprocessing Stage',
    learningObjective: 'View macro expansion (#define) and conditional compilation (#ifdef) before parsing.',
    expectedBehavior: 'Expands macros SQUARE(x) and prints debug messages when enabled.',
    defaultStdin: '',
    sourceCode: `#include <stdio.h>

#define PI 3.14159
#define SQUARE(x) ((x) * (x))
#define DEBUG_MODE 1

int main() {
    double radius = 4.5;
    double area = PI * SQUARE(radius);

#if DEBUG_MODE
    printf("[DEBUG] Macro SQUARE evaluated successfully.\\n");
#endif

    printf("Radius: %.2f, Area: %.4f\\n", radius, area);
    return 0;
}
`,
  },
  {
    id: 'bubble_sort',
    title: '15. Bubble Sort Algorithm',
    category: 'Algorithms',
    relevantPhase: 'Intermediate Code & Optimization',
    learningObjective: 'Observe nested loop control flow and element swap intermediate instructions.',
    expectedBehavior: 'Sorts array in ascending order.',
    defaultStdin: '',
    sourceCode: `#include <stdio.h>

void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}

int main() {
    int data[] = {64, 34, 25, 12, 22, 11, 90};
    int n = sizeof(data) / sizeof(data[0]);

    printf("Original: ");
    for (int i = 0; i < n; i++) printf("%d ", data[i]);
    printf("\\n");

    bubbleSort(data, n);

    printf("Sorted:   ");
    for (int i = 0; i < n; i++) printf("%d ", data[i]);
    printf("\\n");
    return 0;
}
`,
  },
  {
    id: 'binary_search',
    title: '16. Binary Search Algorithm',
    category: 'Algorithms',
    relevantPhase: 'Intermediate Code',
    learningObjective: 'Analyze logarithmic search branching with low/high index updates.',
    expectedBehavior: 'Searches for key 42 and prints its index.',
    defaultStdin: '',
    sourceCode: `#include <stdio.h>

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
    id: 'nested_loops',
    title: '17. Nested Loops (Pattern Generation)',
    category: 'Control Flow',
    relevantPhase: 'Intermediate Code',
    learningObjective: 'Trace nested iteration counter increment and inner loop termination conditions.',
    expectedBehavior: 'Prints a 5-row star pyramid.',
    defaultStdin: '',
    sourceCode: `#include <stdio.h>

int main() {
    int rows = 5;
    for (int i = 1; i <= rows; i++) {
        // Print spaces
        for (int s = 1; s <= rows - i; s++) {
            putchar(' ');
        }
        // Print stars
        for (int k = 1; k <= (2 * i - 1); k++) {
            putchar('*');
        }
        putchar('\\n');
    }
    return 0;
}
`,
  },
  {
    id: 'multiple_functions',
    title: '18. Multiple Function Pipeline',
    category: 'Functions',
    relevantPhase: 'Target Code Generation',
    learningObjective: 'Observe multiple function definitions, call instructions, and stack isolation.',
    expectedBehavior: 'Computes statistical measures (mean, min, max) through helper functions.',
    defaultStdin: '',
    sourceCode: `#include <stdio.h>

int findMin(int a[], int n) {
    int m = a[0];
    for (int i = 1; i < n; i++) if (a[i] < m) m = a[i];
    return m;
}

int findMax(int a[], int n) {
    int m = a[0];
    for (int i = 1; i < n; i++) if (a[i] > m) m = a[i];
    return m;
}

double findAvg(int a[], int n) {
    double sum = 0;
    for (int i = 0; i < n; i++) sum += a[i];
    return sum / n;
}

int main() {
    int samples[] = {45, 12, 89, 34, 67, 23};
    int count = 6;
    printf("Min: %d, Max: %d, Avg: %.2f\\n", findMin(samples, count), findMax(samples, count), findAvg(samples, count));
    return 0;
}
`,
  },
  {
    id: 'optimization_demo',
    title: '19. Optimization Demonstration',
    category: 'Optimization',
    relevantPhase: 'Code Optimization',
    learningObjective: 'Observe Constant Folding and Dead Code Elimination by switching between -O0 and -O2.',
    expectedBehavior: 'Compiler calculates 100 * 50 - 200 at compile time and removes dead branch.',
    defaultStdin: '',
    sourceCode: `#include <stdio.h>

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
    id: 'error_syntax',
    title: '20. Intentional Syntax Error',
    category: 'Errors',
    relevantPhase: 'Syntax Analysis',
    learningObjective: 'Observe parser error detection and beginner-friendly suggested fixes for missing semicolons.',
    expectedBehavior: 'Compilation fails with Syntax Error diagnostic.',
    defaultStdin: '',
    sourceCode: `#include <stdio.h>

int main() {
    int x = 10
    int y = 20;
    printf("Sum: %d\\n", x + y);
    return 0;
}
`,
  },
  {
    id: 'error_semantic',
    title: '21. Intentional Semantic Error',
    category: 'Errors',
    relevantPhase: 'Semantic Analysis',
    learningObjective: 'Inspect type checker and undeclared identifier diagnostics in Phase 3.',
    expectedBehavior: 'Compilation fails with undeclared variable error.',
    defaultStdin: '',
    sourceCode: `#include <stdio.h>

int main() {
    int validNumber = 42;
    // 'undeclaredVariable' was never declared in this scope!
    printf("Value: %d\\n", undeclaredVariable);
    return 0;
}
`,
  },
  {
    id: 'error_linker',
    title: '22. Intentional Linker Error',
    category: 'Errors',
    relevantPhase: 'Linking Stage',
    learningObjective: 'Distinguish compilation success from linking failure when external symbols are missing.',
    expectedBehavior: 'Compiles to object code but fails at link stage with "undefined reference to nonExistentFunction".',
    defaultStdin: '',
    sourceCode: `#include <stdio.h>

// Declared prototype, but never defined in any library or object file!
void nonExistentFunction(void);

int main() {
    printf("About to call undefined function...\\n");
    nonExistentFunction();
    return 0;
}
`,
  },
  {
    id: 'error_runtime',
    title: '23. Intentional Runtime Failure',
    category: 'Errors',
    relevantPhase: 'Runtime Execution',
    learningObjective: 'Understand how a program compiles cleanly with GCC but crashes at runtime upon invalid operations.',
    expectedBehavior: 'Compiles successfully, but terminates with nonzero exit code upon division by zero.',
    defaultStdin: '',
    sourceCode: `#include <stdio.h>

int main() {
    printf("Starting division program...\\n");
    int numerator = 100;
    int divisor = 0; // Runtime divide-by-zero!
    int result = numerator / divisor;
    printf("Result = %d\\n", result);
    return 0;
}
`,
  },
  {
    id: 'warning_unused',
    title: '24. Compiler Warnings',
    category: 'Diagnostics',
    relevantPhase: 'Semantic Analysis',
    learningObjective: 'Inspect non-fatal compiler warnings such as unused variables.',
    expectedBehavior: 'Compiles successfully but outputs a warning note.',
    defaultStdin: '',
    sourceCode: `#include <stdio.h>

int main() {
    int activeValue = 50;
    int unusedVariable = 1000; // Declared but never used!

    printf("Active Value: %d\\n", activeValue);
    return 0;
}
`,
  },
];
