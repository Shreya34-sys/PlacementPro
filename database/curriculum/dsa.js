/**
 * PlacementPro Theory Learning Library - Data Structures & Algorithms (DSA) Curriculum
 * Covers:
 * 1. Asymptotic Analysis, Growth Rates & Master Theorem
 * 2. Binary Search Trees (BST) & AVL Self-Balancing Rotations
 * 3. Binary Heaps, Priority Queues & HeapSort
 * 4. Graph Traversals (BFS, DFS) & Dijkstra's Shortest Path Algorithm
 */

module.exports = [
  {
    chapterTitle: '1. Algorithmic Complexity & Asymptotic Analysis',
    chapterDescription: 'Mathematical foundations of computational complexity, upper/lower bounds, and recurrence relations.',
    topics: [
      {
        title: 'Asymptotic Notations, Master Theorem & Recurrence Relations',
        slug: 'asymptotic-notations-master-theorem-complexity',
        summary: 'Master Big-O, Big-Omega, and Big-Theta asymptotic bounds, solve divide-and-conquer recurrences with the Master Theorem, and evaluate algorithm growth rates.',
        minutes: 16,
        video_url: 'https://www.youtube.com/watch?v=2T-A_3vwGSo',
        video_title: 'Master Theorem for Divide and Conquer Recurrences - Abdul Bari',
        video_source: 'Abdul Bari / Algorithms',
        video_objective: 'Understand Big-O, Omega, and Theta formal definitions, solve T(n) = aT(n/b) + f(n) across all three Master Theorem cases, and evaluate runtime growth curves.',
        content: `
          <div class="callout callout-def">
            <strong>1. Definition & Core Meaning:</strong>
            <strong>Asymptotic Analysis</strong> is a mathematical technique used to evaluate the efficiency and resource consumption (runtime and memory) of an algorithm as the input size <code>n</code> grows arbitrarily large (approaches infinity), completely independent of physical CPU clock speed, compiler optimizations, or operating system quirks.
          </div>

          <h2>2. Why the Concept Is Needed</h2>
          <p>Measuring algorithm performance in physical milliseconds produces misleading conclusions: an inefficient algorithm running on a 64-core supercomputer will appear faster than an optimal algorithm on a smartphone. Furthermore, benchmark timings vary wildly based on background OS processes and cache warming.</p>
          <p>Asymptotic notation characterizes the <strong>intrinsic rate of growth</strong> of an algorithm's execution steps, allowing engineers to mathematically prove which approach will scale when processing billions of records.</p>

          <h2>3. Internal Working & Mathematical Formulations</h2>
          <div class="table-responsive">
            <table class="tutorial-table">
              <thead>
                <tr>
                  <th>Notation</th>
                  <th>Mathematical Definition</th>
                  <th>Computational Meaning</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Big O (O)</strong></td>
                  <td><code>0 &le; f(n) &le; c &middot; g(n)</code> for all <code>n &ge; n0</code> (where <code>c &gt; 0, n0 &ge; 1</code>)</td>
                  <td><strong>Asymptotic Upper Bound:</strong> Worst-case runtime ceiling. The algorithm will never perform worse than this curve.</td>
                </tr>
                <tr>
                  <td><strong>Big Omega (&Omega;)</strong></td>
                  <td><code>0 &le; c &middot; g(n) &le; f(n)</code> for all <code>n &ge; n0</code> (where <code>c &gt; 0, n0 &ge; 1</code>)</td>
                  <td><strong>Asymptotic Lower Bound:</strong> Best-case runtime floor. The algorithm requires at least this many operations.</td>
                </tr>
                <tr>
                  <td><strong>Big Theta (&Theta;)</strong></td>
                  <td><code>c1 &middot; g(n) &le; f(n) &le; c2 &middot; g(n)</code> for all <code>n &ge; n0</code></td>
                  <td><strong>Tight Asymptotic Bound:</strong> Exact growth rate (both upper and lower bounds match).</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>The Master Theorem for Divide-and-Conquer</h3>
          <p>The Master Theorem provides an immediate closed-form asymptotic solution for recurrences of the form:</p>
          <div class="callout callout-points">
            <code>T(n) = a &middot; T(n / b) + f(n)</code><br>
            Where:
            <ul>
              <li><code>a &ge; 1</code>: Number of recursive subproblems generated at each step.</li>
              <li><code>b &gt; 1</code>: Factor by which the subproblem size is divided.</li>
              <li><code>f(n)</code>: Work performed outside the recursive calls (divide and combine cost).</li>
            </ul>
          </div>
          <p>We compare <code>f(n)</code> against the watershed function <code>n^(log_b(a))</code>:</p>
          <ol>
            <li><strong>Case 1 (Subproblem Bound Dominates):</strong> If <code>f(n) = O(n^(log_b(a) - &epsilon;))</code> for some constant <code>&epsilon; &gt; 0</code>, then <strong><code>T(n) = &Theta;(n^(log_b(a)))</code></strong>.</li>
            <li><strong>Case 2 (Even Balance):</strong> If <code>f(n) = &Theta;(n^(log_b(a)) &middot; log^k(n))</code> for <code>k &ge; 0</code>, then <strong><code>T(n) = &Theta;(n^(log_b(a)) &middot; log^(k+1)(n))</code></strong>.</li>
            <li><strong>Case 3 (Combine Work Dominates):</strong> If <code>f(n) = &Omega;(n^(log_b(a) + &epsilon;))</code> and the regularity condition holds (<code>a &middot; f(n/b) &le; c &middot; f(n)</code> for <code>c &lt; 1</code>), then <strong><code>T(n) = &Theta;(f(n))</code></strong>.</li>
          </ol>

          <h2>4. Real-World Analogy</h2>
          <div class="callout callout-points">
            <strong>Analogy:</strong> Transportation Logistics:
            <ul>
              <li><strong>O(1) - Constant:</strong> Grabbing a wrench from your toolbelt. Takes the exact same 2 seconds whether your workshop holds 5 tools or 50,000 tools.</li>
              <li><strong>O(log n) - Logarithmic:</strong> Guessing a secret number between 1 and 1,000,000 using binary search ("Higher / Lower"). Takes at most 20 questions!</li>
              <li><strong>O(n) - Linear:</strong> Manually scanning each page of a novel looking for a missing word. Reading time scales proportionally with the page count.</li>
              <li><strong>O(2^n) - Exponential:</strong> Trying every possible combination on an N-digit padlock by brute force. Adding one single digit doubles the search time!</li>
            </ul>
          </div>

          <h2>5. Architectural Diagram: Asymptotic Growth Rate Curves</h2>
          <div style="margin: 24px 0; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center;">
            <svg viewBox="0 0 700 320" width="100%" height="auto" style="max-width: 660px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <!-- Graph Axes -->
              <line x1="80" y1="280" x2="650" y2="280" stroke="#475569" stroke-width="2" />
              <line x1="80" y1="280" x2="80" y2="30" stroke="#475569" stroke-width="2" />
              <text x="645" y="305" font-size="12" fill="#475569" font-weight="bold">Input Size (n) &rarr;</text>
              <text x="35" y="45" font-size="12" fill="#475569" font-weight="bold" transform="rotate(-90 35,45)">Time Operations &rarr;</text>

              <!-- O(1) -->
              <line x1="80" y1="260" x2="620" y2="260" stroke="#16a34a" stroke-width="2.5" />
              <text x="630" y="265" font-size="11" font-weight="bold" fill="#16a34a">O(1)</text>

              <!-- O(log n) -->
              <path d="M 80 280 Q 200 240, 620 220" fill="none" stroke="#059669" stroke-width="2.5" />
              <text x="630" y="225" font-size="11" font-weight="bold" fill="#059669">O(log n)</text>

              <!-- O(n) -->
              <line x1="80" y1="280" x2="600" y2="150" stroke="#2563eb" stroke-width="2.5" />
              <text x="610" y="150" font-size="11" font-weight="bold" fill="#2563eb">O(n)</text>

              <!-- O(n log n) -->
              <path d="M 80 280 Q 300 180, 560 80" fill="none" stroke="#7c3aed" stroke-width="2.5" />
              <text x="570" y="80" font-size="11" font-weight="bold" fill="#7c3aed">O(n log n)</text>

              <!-- O(n^2) -->
              <path d="M 80 280 Q 250 250, 420 40" fill="none" stroke="#ea580c" stroke-width="2.5" />
              <text x="430" y="45" font-size="11" font-weight="bold" fill="#ea580c">O(n&sup2;)</text>

              <!-- O(2^n) -->
              <path d="M 80 280 Q 180 240, 240 40" fill="none" stroke="#dc2626" stroke-width="2.5" />
              <text x="250" y="45" font-size="11" font-weight="bold" fill="#dc2626">O(2&#8319;)</text>
            </svg>
            <div style="font-size: 0.85rem; color: #64748b; margin-top: 8px;">Figure 4.1: Asymptotic Runtime Complexity Hierarchy from Constant to Exponential Growth</div>
          </div>

          <h2>6. Code Implementations & Master Theorem Worked Example</h2>
          <h3>Worked Problem: Merge Sort Recurrence</h3>
          <p>Merge Sort divides the array into 2 halves, recursively sorts both, and merges them in linear time:</p>
          <pre class="code-block"><code>T(n) = 2 &middot; T(n / 2) + &Theta;(n)</code></pre>
          <p><strong>Step-by-step Master Theorem Application:</strong></p>
          <ol>
            <li>Identify parameters: <code>a = 2</code>, <code>b = 2</code>, <code>f(n) = &Theta;(n)</code>.</li>
            <li>Compute the critical threshold: <code>n^(log_b(a)) = n^(log_2(2)) = n^1 = n</code>.</li>
            <li>Compare <code>f(n) = &Theta;(n)</code> with <code>n^1</code>: They are asymptotically identical!</li>
            <li>This satisfies <strong>Case 2</strong> with <code>k = 0</code>.</li>
            <li>Therefore: <strong><code>T(n) = &Theta;(n^(log_b(a)) &middot; log^(k+1)(n)) = &Theta;(n log n)</code></strong>.</li>
          </ol>

          <h2>7. Comparison Analysis: Sorting Algorithm Complexities</h2>
          <div class="table-responsive">
            <table class="tutorial-table">
              <thead>
                <tr>
                  <th>Algorithm</th>
                  <th>Best Case</th>
                  <th>Average Case</th>
                  <th>Worst Case</th>
                  <th>Space Complexity</th>
                  <th>Stability</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Quick Sort</strong></td>
                  <td><code>&Omega;(n log n)</code></td>
                  <td><code>&Theta;(n log n)</code></td>
                  <td><code>O(n&sup2;)</code> (Degenerate pivot)</td>
                  <td><code>O(log n)</code> Stack</td>
                  <td>No</td>
                </tr>
                <tr>
                  <td><strong>Merge Sort</strong></td>
                  <td><code>&Omega;(n log n)</code></td>
                  <td><code>&Theta;(n log n)</code></td>
                  <td><code>O(n log n)</code> Guaranteed</td>
                  <td><code>O(n)</code> Auxiliary</td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td><strong>Heap Sort</strong></td>
                  <td><code>&Omega;(n log n)</code></td>
                  <td><code>&Theta;(n log n)</code></td>
                  <td><code>O(n log n)</code> Guaranteed</td>
                  <td><code>O(1)</code> In-place</td>
                  <td>No</td>
                </tr>
                <tr>
                  <td><strong>Insertion Sort</strong></td>
                  <td><code>&Omega;(n)</code> (Already sorted)</td>
                  <td><code>&Theta;(n&sup2;)</code></td>
                  <td><code>O(n&sup2;)</code> (Reverse sorted)</td>
                  <td><code>O(1)</code> In-place</td>
                  <td>Yes</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>8. Multiple Choice Questions (MCQ) & Practice Exercises</h2>
          <div class="mcq-container">
            <div class="mcq-card">
              <div class="mcq-header">
                <span class="mcq-badge">MCQ Practice 1</span>
                <span style="font-size:0.8rem; color:var(--study-text-muted);">GATE &amp; Tech Interview Prep</span>
              </div>
              <div class="mcq-question">
                What is the tight asymptotic time complexity of the recurrence relation: <code>T(n) = 8 &middot; T(n / 2) + 1000 &middot; n&sup2;</code>?
              </div>
              <div class="mcq-options-list">
                <div class="mcq-option"><span class="mcq-option-letter">A)</span> <span>&Theta;(n&sup2;)</span></div>
                <div class="mcq-option"><span class="mcq-option-letter">B)</span> <span>&Theta;(n&sup2; log n)</span></div>
                <div class="mcq-option"><span class="mcq-option-letter">C)</span> <span>&Theta;(n&sup3;)</span></div>
                <div class="mcq-option"><span class="mcq-option-letter">D)</span> <span>&Theta;(n&#8308;)</span></div>
              </div>
              <button type="button" class="mcq-reveal-btn">Show Answer &amp; Detailed Explanation</button>
              <div class="mcq-explanation" style="display: none;">
                <strong>Correct Answer: C) &Theta;(n&sup3;)</strong><br>
                <em>Explanation:</em> Here <code>a = 8</code> and <code>b = 2</code>. We calculate <code>n^(log_2(8)) = n^3</code>. Since <code>f(n) = 1000 &middot; n&sup2; = O(n^(3 - 1))</code>, this falls directly into Master Theorem <strong>Case 1</strong> (where the subproblem tree work dominates the combine step). Thus, <code>T(n) = &Theta;(n^3)</code>.
              </div>
            </div>
          </div>

          <h2>9. University Exam & Technical Interview Questions</h2>
          <div class="theory-card" style="margin-bottom: 16px;">
            <h3>Q1: Can the Master Theorem be applied to <code>T(n) = 2T(n/2) + n / log n</code>?</h3>
            <p><strong>Answer:</strong> No. Here <code>a = 2, b = 2</code>, so <code>n^(log_b(a)) = n^1 = n</code>. The non-recursive function is <code>f(n) = n / log n</code>, which is asymptotically smaller than <code>n</code>, but NOT polynomially smaller (the ratio is logarithmic, not <code>n^&epsilon;</code> for any <code>&epsilon; &gt; 0</code>). This violates the polynomial difference requirement of Case 1. The recurrence must be solved using a <strong>Recursion Tree</strong> or <strong>Akra-Bazzi method</strong>, yielding <code>&Theta;(n &middot; log(log n))</code>.</p>
          </div>

          <h2>10. Revision Notes & Key Takeaways</h2>
          <div class="revision-notes-box">
            <div class="revision-header">Revision Cheat Sheet: Complexity &amp; Master Theorem</div>
            <div class="revision-grid">
              <div class="revision-item">
                <div class="revision-item-title">Big-O vs Theta</div>
                <div class="revision-item-desc">Big-O is an upper bound (loose or tight). Big-Theta is a tight bound (both upper and lower).</div>
              </div>
              <div class="revision-item">
                <div class="revision-item-title">Master Theorem Case 1</div>
                <div class="revision-item-desc">When f(n) &lt; n^(log_b a) by n^&epsilon;. Result: &Theta;(n^(log_b a)).</div>
              </div>
              <div class="revision-item">
                <div class="revision-item-title">Master Theorem Case 2</div>
                <div class="revision-item-desc">When f(n) &asymp; n^(log_b a). Result: &Theta;(n^(log_b a) &middot; log n).</div>
              </div>
              <div class="revision-item">
                <div class="revision-item-title">Space Complexity</div>
                <div class="revision-item-desc">Remember to count recursive call stack frames in auxiliary memory!</div>
              </div>
            </div>
          </div>
        `
      },
      {
        title: 'Binary Search Trees (BST) & AVL Tree Rotations',
        slug: 'binary-search-trees-and-avl-rotations',
        summary: 'Explore BST search, insertion, and three deletion cases (leaf, one child, two children), followed by AVL self-balancing rotations (LL, RR, LR, RL).',
        minutes: 18,
        video_url: 'https://www.youtube.com/watch?v=jDM6_TnYIqE',
        video_title: 'AVL Tree - Insertion and Rotations - Abdul Bari',
        video_source: 'Abdul Bari / Algorithms',
        video_objective: 'Master binary search tree properties, inorder successor replacement in node deletion, balance factors, and single vs double AVL rotations.',
        content: `
          <div class="callout callout-def">
            <strong>1. Definition & Core Meaning:</strong>
            A <strong>Binary Search Tree (BST)</strong> is a node-based binary tree data structure where for every node: all keys in its left subtree are strictly smaller (<code>left.key &lt; root.key</code>) and all keys in its right subtree are strictly greater (<code>right.key &gt; root.key</code>). An <strong>AVL Tree</strong> is a self-balancing BST where the height difference (<strong>Balance Factor</strong>) between left and right subtrees of any node is strictly at most <code>1</code>.
          </div>

          <h2>2. Why the Concept Is Needed: The Degenerate Tree Problem</h2>
          <p>In a balanced BST with <code>N</code> nodes, searching, inserting, and deleting execute in <code>O(h) = O(log N)</code> time. However, if values are inserted in ascending order (e.g., <code>10, 20, 30, 40, 50</code>), a standard BST degenerates into a linear singly-linked list of height <code>N</code>, degrading search time to <code>O(N)</code>!</p>
          <p>AVL Trees enforce self-balancing invariants via local pointer rotations after every insertion and deletion, guaranteeing <code>O(log N)</code> worst-case time complexity at all times.</p>

          <h2>3. BST Deletion: The Three Cases</h2>
          <ol>
            <li><strong>Case 1 (Leaf Node):</strong> The target node has no children. Simply disconnect the parent's pointer to <code>null</code>.</li>
            <li><strong>Case 2 (Single Child):</strong> The target node has exactly one child (left or right). Bypass the node by linking the parent directly to the target's child.</li>
            <li><strong>Case 3 (Two Children):</strong>
              <ul>
                <li>Locate the target's <strong>Inorder Successor</strong> (the smallest key in its right subtree) or <strong>Inorder Predecessor</strong> (largest in left subtree).</li>
                <li>Copy the successor's key into the target node.</li>
                <li>Recursively delete the successor node from the right subtree (which is guaranteed to fall into Case 1 or Case 2!).</li>
              </ul>
            </li>
          </ol>

          <h2>4. AVL Self-Balancing: The 4 Rotation Cases</h2>
          <p>The <strong>Balance Factor (BF)</strong> of any node is computed as: <code>BF = Height(Left_Subtree) - Height(Right_Subtree)</code>. A node is balanced if <code>BF &isin; {-1, 0, 1}</code>. When <code>|BF| &ge; 2</code>, balance is restored using one of four rotations:</p>
          <div class="table-responsive">
            <table class="tutorial-table">
              <thead>
                <tr>
                  <th>Imbalance Case</th>
                  <th>Condition</th>
                  <th>Required Rotation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Left-Left (LL)</strong></td>
                  <td>Node <code>BF &gt; 1</code> and insertion was in left child's left subtree</td>
                  <td><strong>Single Right Rotation</strong> on unbalanced node</td>
                </tr>
                <tr>
                  <td><strong>Right-Right (RR)</strong></td>
                  <td>Node <code>BF &lt; -1</code> and insertion was in right child's right subtree</td>
                  <td><strong>Single Left Rotation</strong> on unbalanced node</td>
                </tr>
                <tr>
                  <td><strong>Left-Right (LR)</strong></td>
                  <td>Node <code>BF &gt; 1</code> and insertion was in left child's right subtree</td>
                  <td><strong>Double Rotation:</strong> Left rotation on left child, then Right rotation on root</td>
                </tr>
                <tr>
                  <td><strong>Right-Left (RL)</strong></td>
                  <td>Node <code>BF &lt; -1</code> and insertion was in right child's left subtree</td>
                  <td><strong>Double Rotation:</strong> Right rotation on right child, then Left rotation on root</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>5. Architectural Diagram: LL and RR AVL Rotations</h2>
          <div style="margin: 24px 0; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center;">
            <svg viewBox="0 0 720 280" width="100%" height="auto" style="max-width: 680px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <!-- LL Imbalance Tree -->
              <text x="180" y="30" text-anchor="middle" font-size="13" font-weight="bold" fill="#1e293b">Left-Left (LL) Imbalance (BF = +2)</text>
              <circle cx="180" cy="70" r="20" fill="#fee2e2" stroke="#dc2626" stroke-width="2" />
              <text x="180" y="75" text-anchor="middle" font-size="12" font-weight="bold" fill="#991b1b">z (30)</text>

              <line x1="165" y1="85" x2="130" y2="120" stroke="#475569" stroke-width="2" />
              <circle cx="120" cy="130" r="18" fill="#eff6ff" stroke="#2563eb" stroke-width="2" />
              <text x="120" y="135" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af">y (20)</text>

              <line x1="110" y1="145" x2="80" y2="180" stroke="#475569" stroke-width="2" />
              <circle cx="70" cy="190" r="16" fill="#f0fdf4" stroke="#16a34a" stroke-width="2" />
              <text x="70" y="195" text-anchor="middle" font-size="10" font-weight="bold" fill="#15803d">x (10)</text>

              <!-- Rotation Arrow -->
              <path d="M 230 130 Q 280 100, 330 130" fill="none" stroke="#2563eb" stroke-width="3" marker-end="url(#arrow)" />
              <text x="280" y="90" text-anchor="middle" font-size="11" font-weight="bold" fill="#2563eb">Right Rotate(z)</text>

              <!-- Balanced Tree -->
              <text x="500" y="30" text-anchor="middle" font-size="13" font-weight="bold" fill="#1e293b">Balanced AVL Tree (BF = 0)</text>
              <circle cx="500" cy="80" r="20" fill="#f0fdf4" stroke="#16a34a" stroke-width="2" />
              <text x="500" y="85" text-anchor="middle" font-size="12" font-weight="bold" fill="#15803d">y (20)</text>

              <line x1="485" y1="95" x2="440" y2="135" stroke="#475569" stroke-width="2" />
              <circle cx="430" cy="145" r="18" fill="#eff6ff" stroke="#2563eb" stroke-width="2" />
              <text x="430" y="150" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af">x (10)</text>

              <line x1="515" y1="95" x2="560" y2="135" stroke="#475569" stroke-width="2" />
              <circle cx="570" cy="145" r="18" fill="#eff6ff" stroke="#2563eb" stroke-width="2" />
              <text x="570" y="150" text-anchor="middle" font-size="11" font-weight="bold" fill="#1e40af">z (30)</text>
            </svg>
            <div style="font-size: 0.85rem; color: #64748b; margin-top: 8px;">Figure 4.2: AVL Single Right Rotation Restoring Height Balance to O(log N)</div>
          </div>

          <h2>6. Code Implementation: Complete Java BST with Deletion</h2>
          <pre class="code-block"><button class="copy-btn">Copy</button><code>public class BinarySearchTree {
    static class Node {
        int key;
        Node left, right;
        Node(int key) { this.key = key; }
    }

    private Node root;

    // Public Insertion
    public void insert(int key) {
        root = insertRec(root, key);
    }

    private Node insertRec(Node root, int key) {
        if (root == null) return new Node(key);
        if (key &lt; root.key) root.left = insertRec(root.left, key);
        else if (key &gt; root.key) root.right = insertRec(root.right, key);
        return root;
    }

    // Public Deletion covering all 3 Cases
    public void delete(int key) {
        root = deleteRec(root, key);
    }

    private Node deleteRec(Node root, int key) {
        if (root == null) return null;

        if (key &lt; root.key) {
            root.left = deleteRec(root.left, key);
        } else if (key &gt; root.key) {
            root.right = deleteRec(root.right, key);
        } else {
            // Found node to delete!
            // Case 1 &amp; Case 2: 0 or 1 child
            if (root.left == null) return root.right;
            if (root.right == null) return root.left;

            // Case 3: 2 children - Replace with Inorder Successor (min in right subtree)
            root.key = minValue(root.right);
            root.right = deleteRec(root.right, root.key);
        }
        return root;
    }

    private int minValue(Node root) {
        int minv = root.key;
        while (root.left != null) {
            minv = root.left.key;
            root = root.left;
        }
        return minv;
    }

    public void inorder() {
        inorderRec(root);
        System.out.println();
    }

    private void inorderRec(Node root) {
        if (root != null) {
            inorderRec(root.left);
            System.out.print(root.key + " ");
            inorderRec(root.right);
        }
    }

    public static void main(String[] args) {
        BinarySearchTree bst = new BinarySearchTree();
        int[] values = {50, 30, 70, 20, 40, 60, 80};
        for (int v : values) bst.insert(v);

        System.out.print("Original BST Inorder (Sorted): ");
        bst.inorder();

        System.out.println("Deleting node with two children (50)...");
        bst.delete(50);
        System.out.print("BST Inorder after deletion: ");
        bst.inorder();
    }
}</code></pre>

          <h3>Expected Output:</h3>
          <pre class="code-block"><code>Original BST Inorder (Sorted): 20 30 40 50 60 70 80 
Deleting node with two children (50)...
BST Inorder after deletion: 20 30 40 60 70 80</code></pre>

          <h2>7. Multiple Choice Questions (MCQ)</h2>
          <div class="mcq-container">
            <div class="mcq-card">
              <div class="mcq-header">
                <span class="mcq-badge">MCQ Practice 2</span>
                <span style="font-size:0.8rem; color:var(--study-text-muted);">Data Structures Assessment</span>
              </div>
              <div class="mcq-question">
                What is the maximum height of an AVL tree containing <code>N</code> nodes?
              </div>
              <div class="mcq-options-list">
                <div class="mcq-option"><span class="mcq-option-letter">A)</span> <span>O(N)</span></div>
                <div class="mcq-option"><span class="mcq-option-letter">B)</span> <span>Approximately 1.44 &middot; log2(N)</span></div>
                <div class="mcq-option"><span class="mcq-option-letter">C)</span> <span>Strictly 0.5 &middot; log2(N)</span></div>
                <div class="mcq-option"><span class="mcq-option-letter">D)</span> <span>O(N&sup2;)</span></div>
              </div>
              <button type="button" class="mcq-reveal-btn">Show Answer &amp; Detailed Explanation</button>
              <div class="mcq-explanation" style="display: none;">
                <strong>Correct Answer: B) Approximately 1.44 &middot; log2(N)</strong><br>
                <em>Explanation:</em> The minimum number of nodes in an AVL tree of height <code>h</code> follows a Fibonacci-like recurrence: <code>N(h) = N(h-1) + N(h-2) + 1</code>. Solving this recurrence yields <code>h &le; 1.4404 &middot; log2(N + 2) - 0.328</code>, proving that the height is strictly bounded by <code>O(log N)</code> in the worst possible shape.
              </div>
            </div>
          </div>
        `
      }
    ]
  }
];
