/**
 * PlacementPro Theory Learning Library - DBMS and SQL Curriculum
 * Covers:
 * 1. DBMS: Normalization (1NF, 2NF, 3NF, BCNF) with complete decomposition tables and anomalies
 * 2. DBMS: Transaction Processing, ACID Properties, 2PL & Isolation Levels
 * 3. SQL: Joins (Inner, Left, Right, Full, Cross, Self), Window Functions & B+ Tree Indexes
 */

module.exports = {
  dbms: [
    {
      chapterTitle: '1. Relational Database Normalization & Dependencies',
      chapterDescription: 'Systematic elimination of data redundancy and update anomalies via 1NF, 2NF, 3NF, and BCNF decompositions.',
      topics: [
        {
          title: 'Database Normalization: 1NF, 2NF, 3NF, and BCNF Step-by-Step',
          slug: 'database-normalization-1nf-2nf-3nf-bcnf',
          summary: 'Eliminate insert, update, and delete anomalies by progressively decomposing unnormalized relations into 1NF, 2NF, 3NF, and Boyce-Codd Normal Form (BCNF).',
          minutes: 18,
          video_url: 'https://www.youtube.com/watch?v=5hsOC7KL5Ec',
          video_title: 'Database Normalization 1NF, 2NF, 3NF, BCNF - Gate Smashers',
          video_source: 'Gate Smashers',
          video_objective: 'Understand functional dependencies, candidate keys, prime vs non-prime attributes, partial and transitive dependencies, and lossless-join decomposition.',
          content: `
            <div class="callout callout-def">
              <strong>1. Definition & Core Meaning:</strong>
              <strong>Database Normalization</strong> is a systematic formal process of decomposing relational tables to eliminate data redundancy (unnecessary repetition of information) and prevent undesirable <strong>update, insertion, and deletion anomalies</strong>, without losing original relational data (Lossless-Join Property).
            </div>

            <h2>2. Why the Concept Is Needed: The Three Database Anomalies</h2>
            <p>Consider an unnormalized university records table: <code>Student_Course_Reg(StudentID, StudentName, CourseID, CourseName, Instructor, Dept)</code> where a student enrolls in multiple courses. Storing all fields together causes severe anomalies:</p>
            <ul>
              <li><strong>Insertion Anomaly:</strong> We cannot record a newly accredited course (e.g., <code>CS-401 Machine Learning</code>) into the database until at least one student enrolls in it, because <code>StudentID</code> serves as part of the primary key and relational integrity forbids <code>NULL</code> primary keys.</li>
              <li><strong>Deletion Anomaly:</strong> If the only student enrolled in <code>CS-205</code> drops out and their record is deleted, the course name, instructor, and department details are permanently erased from the database!</li>
              <li><strong>Update / Modification Anomaly:</strong> If instructor <code>Dr. Turing</code> switches departments, we must update hundreds of individual student enrollment rows. If one row is missed, data becomes inconsistent across reports.</li>
            </ul>

            <h2>3. Step-by-Step Normalization Walkthrough with Concrete Tables</h2>

            <h3>Step 0: The Unnormalized Relation (UNF)</h3>
            <p>An unnormalized table containing multi-valued attributes and composite repeating groups:</p>
            <div class="table-responsive">
              <table class="tutorial-table">
                <thead>
                  <tr>
                    <th>StudentID</th>
                    <th>StudentName</th>
                    <th>CoursesEnrolled (CourseID, CourseName)</th>
                    <th>Instructor</th>
                    <th>InstructorDept</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>101</td>
                    <td>Alice Smith</td>
                    <td>{CS-101 (Intro CS), CS-201 (Algorithms)}</td>
                    <td>Dr. Turing</td>
                    <td>Computer Science</td>
                  </tr>
                  <tr>
                    <td>102</td>
                    <td>Bob Jones</td>
                    <td>{CS-101 (Intro CS), EE-102 (Circuits)}</td>
                    <td>Dr. Shannon</td>
                    <td>Electrical Eng</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3>Step 1: First Normal Form (1NF)</h3>
            <div class="callout callout-points">
              <strong>1NF Rule:</strong> Every attribute of the relation must contain only <strong>atomic (indivisible) values</strong>. No repeating groups or multi-valued columns are permitted.
            </div>
            <p>Decomposing multi-valued arrays into individual atomic rows produces:</p>
            <div class="table-responsive">
              <table class="tutorial-table">
                <thead>
                  <tr>
                    <th><u>StudentID</u></th>
                    <th>StudentName</th>
                    <th><u>CourseID</u></th>
                    <th>CourseName</th>
                    <th>Instructor</th>
                    <th>InstructorDept</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>101</td>
                    <td>Alice Smith</td>
                    <td>CS-101</td>
                    <td>Intro CS</td>
                    <td>Dr. Turing</td>
                    <td>Computer Science</td>
                  </tr>
                  <tr>
                    <td>101</td>
                    <td>Alice Smith</td>
                    <td>CS-201</td>
                    <td>Algorithms</td>
                    <td>Dr. Knuth</td>
                    <td>Computer Science</td>
                  </tr>
                  <tr>
                    <td>102</td>
                    <td>Bob Jones</td>
                    <td>CS-101</td>
                    <td>Intro CS</td>
                    <td>Dr. Turing</td>
                    <td>Computer Science</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p><strong>Primary Key:</strong> Composite Key <code>{StudentID, CourseID}</code>.</p>

            <h3>Step 2: Second Normal Form (2NF)</h3>
            <div class="callout callout-points">
              <strong>2NF Rule:</strong> The relation must be in <strong>1NF</strong>, and there must be <strong>no Partial Dependency</strong>: no non-prime attribute may depend on only a proper subset of any candidate key.
            </div>
            <p>In our 1NF table:</p>
            <ul>
              <li><code>StudentID &rarr; StudentName</code> (Depends ONLY on <code>StudentID</code>, not the full composite key! This is a partial dependency).</li>
              <li><code>CourseID &rarr; {CourseName, Instructor, InstructorDept}</code> (Depends ONLY on <code>CourseID</code>!).</li>
            </ul>
            <p>To achieve 2NF, we decompose the table into three distinct relations:</p>
            <div class="grid-2-col" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 12px 0;">
              <div>
                <h4>Table A: Student</h4>
                <div class="table-responsive">
                  <table class="tutorial-table">
                    <thead><tr><th><u>StudentID</u></th><th>StudentName</th></tr></thead>
                    <tbody>
                      <tr><td>101</td><td>Alice Smith</td></tr>
                      <tr><td>102</td><td>Bob Jones</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <h4>Table B: Course</h4>
                <div class="table-responsive">
                  <table class="tutorial-table">
                    <thead><tr><th><u>CourseID</u></th><th>CourseName</th><th>Instructor</th><th>InstructorDept</th></tr></thead>
                    <tbody>
                      <tr><td>CS-101</td><td>Intro CS</td><td>Dr. Turing</td><td>Computer Science</td></tr>
                      <tr><td>CS-201</td><td>Algorithms</td><td>Dr. Knuth</td><td>Computer Science</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <h4>Table C: Enrollment (Junction Table)</h4>
            <div class="table-responsive">
              <table class="tutorial-table">
                <thead><tr><th><u>StudentID (FK)</u></th><th><u>CourseID (FK)</u></th></tr></thead>
                <tbody>
                  <tr><td>101</td><td>CS-101</td></tr>
                  <tr><td>101</td><td>CS-201</td></tr>
                  <tr><td>102</td><td>CS-101</td></tr>
                </tbody>
              </table>
            </div>

            <h3>Step 3: Third Normal Form (3NF)</h3>
            <div class="callout callout-points">
              <strong>3NF Rule:</strong> The relation must be in <strong>2NF</strong>, and there must be <strong>no Transitive Dependency</strong>: non-prime attributes must not depend on other non-prime attributes.
              <em>Formal Rule: For every non-trivial functional dependency <code>X &rarr; Y</code>, either <code>X</code> is a Super Key, OR <code>Y</code> is a Prime Attribute.</em>
            </div>
            <p>Inspecting <code>Table B: Course</code>:</p>
            <ul>
              <li><code>CourseID &rarr; Instructor</code> (Instructor depends on CourseID).</li>
              <li><code>Instructor &rarr; InstructorDept</code> (InstructorDept depends on Instructor).</li>
              <li>Therefore, <code>CourseID &rarr; InstructorDept</code> transitively! Since neither <code>Instructor</code> is a key nor is <code>InstructorDept</code> a prime attribute, this violates 3NF!</li>
            </ul>
            <p>We decompose <code>Table B</code> into <code>Course</code> and <code>Instructor</code>:</p>
            <div class="grid-2-col" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 12px 0;">
              <div>
                <h4>Course (3NF)</h4>
                <div class="table-responsive">
                  <table class="tutorial-table">
                    <thead><tr><th><u>CourseID</u></th><th>CourseName</th><th>Instructor (FK)</th></tr></thead>
                    <tbody>
                      <tr><td>CS-101</td><td>Intro CS</td><td>Dr. Turing</td></tr>
                      <tr><td>CS-201</td><td>Algorithms</td><td>Dr. Knuth</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <h4>Instructor (3NF)</h4>
                <div class="table-responsive">
                  <table class="tutorial-table">
                    <thead><tr><th><u>Instructor</u></th><th>InstructorDept</th></tr></thead>
                    <tbody>
                      <tr><td>Dr. Turing</td><td>Computer Science</td></tr>
                      <tr><td>Dr. Knuth</td><td>Computer Science</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <h3>Step 4: Boyce-Codd Normal Form (BCNF)</h3>
            <div class="callout callout-points">
              <strong>BCNF Rule (Strict 3NF):</strong> For every non-trivial functional dependency <code>X &rarr; Y</code>, <strong>X MUST be a Super Key</strong> (no exceptions for prime attributes on the right-hand side!).
            </div>
            <p>BCNF eliminates edge-case anomalies in tables that possess multiple overlapping candidate keys.</p>

            <h2>4. Architectural Normalization Hierarchy Diagram</h2>
            <div style="margin: 24px 0; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center;">
              <svg viewBox="0 0 650 320" width="100%" height="auto" style="max-width: 600px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <!-- Concentric Circles representing Normal Forms -->
                <circle cx="325" cy="160" r="140" fill="#f8fafc" stroke="#64748b" stroke-width="2" />
                <text x="325" y="45" text-anchor="middle" font-size="13" font-weight="bold" fill="#64748b">1NF: Atomic Attributes Only (No Repeating Groups)</text>

                <circle cx="325" cy="170" r="110" fill="#eff6ff" stroke="#3b82f6" stroke-width="2" />
                <text x="325" y="80" text-anchor="middle" font-size="13" font-weight="bold" fill="#1e40af">2NF: 1NF + No Partial Dependencies</text>

                <circle cx="325" cy="180" r="80" fill="#f0fdf4" stroke="#16a34a" stroke-width="2" />
                <text x="325" y="125" text-anchor="middle" font-size="13" font-weight="bold" fill="#15803d">3NF: 2NF + No Transitive Dependencies</text>

                <circle cx="325" cy="195" r="48" fill="#fef2f2" stroke="#ef4444" stroke-width="2" />
                <text x="325" y="185" text-anchor="middle" font-size="12" font-weight="bold" fill="#b91c1c">BCNF</text>
                <text x="325" y="200" text-anchor="middle" font-size="9" fill="#991b1b">Every Determinant</text>
                <text x="325" y="212" text-anchor="middle" font-size="9" fill="#991b1b">is a Super Key</text>
              </svg>
              <div style="font-size: 0.85rem; color: #64748b; margin-top: 8px;">Figure 3.1: Mathematical Subset Containment of Relational Normal Forms</div>
            </div>

            <h2>5. Comparison Analysis: Normal Forms Summary</h2>
            <div class="table-responsive">
              <table class="tutorial-table">
                <thead>
                  <tr>
                    <th>Normal Form</th>
                    <th>Core Requirement</th>
                    <th>Anomaly Eliminated</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>1NF</strong></td>
                    <td>All column values must be atomic; unique column names</td>
                    <td>Multi-valued repeating sets</td>
                  </tr>
                  <tr>
                    <td><strong>2NF</strong></td>
                    <td>In 1NF and no non-prime attribute depends on part of a composite key</td>
                    <td>Partial functional dependencies</td>
                  </tr>
                  <tr>
                    <td><strong>3NF</strong></td>
                    <td>In 2NF and no non-prime attribute depends on another non-prime attribute</td>
                    <td>Transitive functional dependencies</td>
                  </tr>
                  <tr>
                    <td><strong>BCNF</strong></td>
                    <td>For every functional dependency <code>X &rarr; Y</code>, <code>X</code> must be a super key</td>
                    <td>Anomalies from overlapping candidate keys</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2>6. University Exam & Interview Questions</h2>
            <div class="theory-card" style="margin-bottom: 16px;">
              <h3>Q1: Can a table in 3NF violate BCNF? Provide a concrete example.</h3>
              <p><strong>Answer:</strong> Yes. Consider <code>Student_Counselor(StudentID, Subject, Counselor)</code> with functional dependencies: <code>{StudentID, Subject} &rarr; Counselor</code> and <code>Counselor &rarr; Subject</code>. The candidate keys are <code>{StudentID, Subject}</code> and <code>{StudentID, Counselor}</code>. In <code>Counselor &rarr; Subject</code>, <code>Counselor</code> is NOT a super key, but <code>Subject</code> is a prime attribute. Thus, the table satisfies 3NF, but VIOLATES BCNF because the determinant (<code>Counselor</code>) is not a super key.</p>
            </div>
          `
        }
      ]
    }
  ],

  sql: [
    {
      chapterTitle: '1. Advanced SQL Queries, Joins & Performance Indexing',
      chapterDescription: 'Master relational set operations, multi-table joins, analytical window functions, and B+ Tree indexing.',
      topics: [
        {
          title: 'SQL Joins, Analytical Window Functions, and B+ Tree Indexing',
          slug: 'sql-joins-window-functions-and-indexing',
          summary: 'Deep dive into Inner/Outer/Cross/Self Joins, ROW_NUMBER vs RANK vs DENSE_RANK, and how B+ Tree indexes accelerate query execution plans.',
          minutes: 15,
          video_url: 'https://www.youtube.com/watch?v=0OQJDd3Pt38',
          video_title: 'SQL Joins and Window Functions Explained - Gate Smashers',
          video_source: 'Gate Smashers',
          video_objective: 'Master Venn diagram mechanics of SQL Joins, partition-by window framing, query execution plans (EXPLAIN), and clustered vs non-clustered B+ Tree indexes.',
          content: `
            <div class="callout callout-def">
              <strong>1. Definition & Core Meaning:</strong>
              An <strong>SQL Join</strong> is a relational operation that combines columns from one or more tables based on a related common key. <strong>Window Functions</strong> perform calculations across a set of table rows related to the current query row without collapsing rows into a single summary output.
            </div>

            <h2>2. Comprehensive SQL Join Taxonomy</h2>
            <div class="table-responsive">
              <table class="tutorial-table">
                <thead>
                  <tr>
                    <th>Join Type</th>
                    <th>Relational Logic</th>
                    <th>Unmatched Rows Handling</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>INNER JOIN</strong></td>
                    <td>Returns rows when there is a match in BOTH tables (Intersection)</td>
                    <td>Discarded from both sides</td>
                  </tr>
                  <tr>
                    <td><strong>LEFT (OUTER) JOIN</strong></td>
                    <td>Returns ALL rows from left table + matched rows from right table</td>
                    <td>Right columns populated with <code>NULL</code></td>
                  </tr>
                  <tr>
                    <td><strong>RIGHT (OUTER) JOIN</strong></td>
                    <td>Returns ALL rows from right table + matched rows from left table</td>
                    <td>Left columns populated with <code>NULL</code></td>
                  </tr>
                  <tr>
                    <td><strong>FULL OUTER JOIN</strong></td>
                    <td>Returns rows when there is a match in EITHER left or right table</td>
                    <td>Missing columns filled with <code>NULL</code></td>
                  </tr>
                  <tr>
                    <td><strong>CROSS JOIN</strong></td>
                    <td>Cartesian Product of both tables (M &times; N rows)</td>
                    <td>No predicate; every left row pairs with every right row</td>
                  </tr>
                  <tr>
                    <td><strong>SELF JOIN</strong></td>
                    <td>A regular join where a table is joined with itself using aliases</td>
                    <td>Used for hierarchical or peer comparisons (e.g., Employee-Manager)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2>3. Analytical Window Functions: <code>ROW_NUMBER()</code> vs <code>RANK()</code> vs <code>DENSE_RANK()</code></h2>
            <p>Unlike <code>GROUP BY</code> which collapses groups into a single aggregated row, window functions preserve all individual input rows while assigning ranked analytical values using <code>OVER (PARTITION BY ... ORDER BY ...)</code>:</p>

            <pre class="code-block"><button class="copy-btn">Copy</button><code>SELECT
    employee_id,
    department,
    salary,
    ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) as row_num,
    RANK()       OVER (PARTITION BY department ORDER BY salary DESC) as rank_val,
    DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) as dense_rank_val
FROM employees;</code></pre>

            <h3>Output Demonstration of Ranking Ties:</h3>
            <div class="table-responsive">
              <table class="tutorial-table">
                <thead>
                  <tr>
                    <th>employee_id</th>
                    <th>department</th>
                    <th>salary</th>
                    <th>row_num</th>
                    <th>rank_val</th>
                    <th>dense_rank_val</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>101</td><td>Engineering</td><td>$120,000</td><td>1</td><td>1</td><td>1</td></tr>
                  <tr><td>102</td><td>Engineering</td><td>$110,000</td><td>2</td><td>2</td><td>2</td></tr>
                  <tr><td>103</td><td>Engineering</td><td>$110,000</td><td>3</td><td><strong>2 (Tie)</strong></td><td><strong>2 (Tie)</strong></td></tr>
                  <tr><td>104</td><td>Engineering</td><td>$95,000</td><td>4</td><td><strong>4 (Skips 3!)</strong></td><td><strong>3 (No Skip)</strong></td></tr>
                </tbody>
              </table>
            </div>

            <h2>4. B+ Tree Database Indexing Internal Working</h2>
            <p>Without an index, the database engine must execute a <strong>Full Table Scan (Sequential Scan)</strong>, checking all <code>N</code> records in <code>O(N)</code> disk I/O operations.</p>
            <p>Relational databases (MySQL InnoDB, PostgreSQL) structure indexes as <strong>B+ Trees</strong>:</p>
            <ul>
              <li><strong>Balanced Multi-Way Search Tree:</strong> High branching factor (fan-out of 100 to 1,000 keys per page) keeps tree depth shallow (3 to 4 levels for millions of records).</li>
              <li><strong>Leaf Nodes Store Values / Pointers:</strong> Internal nodes store only navigation keys; all data records or heap row pointers reside strictly at the leaf level, linked sequentially via doubly-linked pointers for lightning-fast range queries (<code>BETWEEN ... AND</code>).</li>
              <li><strong>Clustered Index:</strong> The physical table rows are stored directly in the leaf pages of the primary key B+ Tree.</li>
              <li><strong>Secondary (Non-Clustered) Index:</strong> The leaf pages store the indexed column value plus the Primary Key, requiring a secondary lookup (Index Bookmark Lookup) to fetch non-indexed columns.</li>
            </ul>

            <h2>5. Architectural Diagram: B+ Tree Index Page Traversal</h2>
            <div style="margin: 24px 0; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center;">
              <svg viewBox="0 0 680 260" width="100%" height="auto" style="max-width: 640px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <!-- Root Page -->
                <rect x="250" y="20" width="180" height="40" rx="4" fill="#eff6ff" stroke="#2563eb" stroke-width="2" />
                <text x="340" y="45" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e40af">Root Page [Key: 50]</text>

                <!-- Arrows from Root -->
                <line x1="280" y1="60" x2="160" y2="100" stroke="#2563eb" stroke-width="1.5" />
                <line x1="400" y1="60" x2="520" y2="100" stroke="#2563eb" stroke-width="1.5" />

                <!-- Internal Level -->
                <rect x="80" y="100" width="160" height="35" rx="4" fill="#f1f5f9" stroke="#64748b" />
                <text x="160" y="122" text-anchor="middle" font-size="11" fill="#1e293b">Keys: &lt; 50 [20, 35]</text>

                <rect x="440" y="100" width="160" height="35" rx="4" fill="#f1f5f9" stroke="#64748b" />
                <text x="520" y="122" text-anchor="middle" font-size="11" fill="#1e293b">Keys: &ge; 50 [65, 80]</text>

                <!-- Leaves -->
                <rect x="30" y="180" width="130" height="50" rx="4" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5" />
                <text x="95" y="202" text-anchor="middle" font-size="10" font-weight="bold" fill="#15803d">Leaf: 10, 15, 20</text>
                <text x="95" y="218" text-anchor="middle" font-size="9" fill="#166534">&rarr; Row Data Record</text>

                <rect x="180" y="180" width="130" height="50" rx="4" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5" />
                <text x="245" y="202" text-anchor="middle" font-size="10" font-weight="bold" fill="#15803d">Leaf: 25, 30, 35</text>
                <text x="245" y="218" text-anchor="middle" font-size="9" fill="#166534">&rarr; Row Data Record</text>

                <!-- Linked List arrows between leaves -->
                <line x1="160" y1="205" x2="180" y2="205" stroke="#16a34a" stroke-width="2" />
                <line x1="310" y1="205" x2="370" y2="205" stroke="#16a34a" stroke-width="2" />

                <rect x="370" y="180" width="130" height="50" rx="4" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5" />
                <text x="435" y="202" text-anchor="middle" font-size="10" font-weight="bold" fill="#15803d">Leaf: 50, 55, 60</text>
                <text x="435" y="218" text-anchor="middle" font-size="9" fill="#166534">&rarr; Row Data Record</text>

                <rect x="520" y="180" width="130" height="50" rx="4" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5" />
                <text x="585" y="202" text-anchor="middle" font-size="10" font-weight="bold" fill="#15803d">Leaf: 65, 75, 80</text>
                <text x="585" y="218" text-anchor="middle" font-size="9" fill="#166534">&rarr; Row Data Record</text>

                <line x1="500" y1="205" x2="520" y2="205" stroke="#16a34a" stroke-width="2" />
              </svg>
              <div style="font-size: 0.85rem; color: #64748b; margin-top: 8px;">Figure 3.2: B+ Tree Multilevel Index Structure with Linked Doubly-Chained Leaf Pages</div>
            </div>

            <h2>6. University Exam & Interview Questions</h2>
            <div class="theory-card" style="margin-bottom: 16px;">
              <h3>Q1: Why are B+ Trees preferred over B-Trees for database disk storage?</h3>
              <p><strong>Answer:</strong> In standard B-Trees, data pointers are stored in both internal and leaf nodes. In B+ Trees, internal nodes store only search keys (no row pointers), allowing vastly higher fan-out (thousands of keys per page) and shallower tree depth. Furthermore, B+ Tree leaf nodes are linked via a continuous doubly-linked list, enabling efficient range scans (<code>SELECT * WHERE id BETWEEN 10 AND 50</code>) by finding the first leaf in O(log N) and simply traversing horizontally without re-navigating tree parent nodes.</p>
            </div>
          `
        }
      ]
    }
  ]
};
