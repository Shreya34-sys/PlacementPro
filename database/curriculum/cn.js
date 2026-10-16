/**
 * PlacementPro Theory Learning Library - Computer Networks (CN) Curriculum
 * Covers:
 * 1. OSI 7-Layer Model vs TCP/IP Protocol Suite & Encapsulation
 * 2. IPv4 Addressing, Subnetting & CIDR Calculation
 * 3. TCP 3-Way Handshake, Flow Control & Congestion Control
 */

module.exports = [
  {
    chapterTitle: '1. Layer Architectures, Subnetting & Transport Protocols',
    chapterDescription: 'OSI vs TCP/IP models, IP subnet calculations, and TCP reliable byte-stream delivery.',
    topics: [
      {
        title: 'IP Addressing, Subnetting, and CIDR Calculations Step-by-Step',
        slug: 'ip-addressing-subnetting-and-cidr-calculations',
        summary: 'Master IPv4 binary structures, default subnet masks, Classless Inter-Domain Routing (CIDR), and step-by-step subnet calculation with full worked examples.',
        minutes: 17,
        video_url: 'https://www.youtube.com/watch?v=s_Ntt6eTn94',
        video_title: 'Subnetting Mastery - CIDR Calculations and Subnet Masks - Gate Smashers',
        video_source: 'Gate Smashers',
        video_objective: 'Calculate Network ID, Broadcast ID, number of usable hosts (2^h - 2), custom subnet masks, and partition address blocks using Variable Length Subnet Masking (VLSM).',
        content: `
          <div class="callout callout-def">
            <strong>1. Definition & Core Meaning:</strong>
            An <strong>IPv4 Address</strong> is a 32-bit numerical label assigned to every device connected to a computer network that uses the Internet Protocol. <strong>Subnetting</strong> is the logical partitioning of a single physical network into multiple smaller, independent sub-networks (subnets) by borrowing bits from the Host portion to expand the Network portion.
          </div>

          <h2>2. Why the Concept Is Needed: Combating IPv4 Address Exhaustion</h2>
          <p>The original Classful IP addressing scheme (Classes A, B, C) created colossal address wastage. If an organization needed 300 IP addresses, it had to request a Class B block (which contained 65,534 host addresses), leaving over 65,000 IPs permanently stranded and unusable.</p>
          <p><strong>CIDR (Classless Inter-Domain Routing)</strong> and subnetting allow network administrators to carve address allocations to the exact power-of-two requirement, reducing routing table sizes via route aggregation (supernetting) and isolating broadcast domains to enhance network security and speed.</p>

          <h2>3. Mathematical Foundations of IPv4 Subnetting</h2>
          <p>An IPv4 address consists of 32 bits divided into 4 octets (8 bits each), separated by dots (e.g., <code>192.168.1.1</code>):</p>
          <ul>
            <li><strong>Network Bits (<code>n</code>):</strong> Identify the network or organization. Specified by the prefix length (e.g., in <code>/26</code>, <code>n = 26</code>).</li>
            <li><strong>Host Bits (<code>h</code>):</strong> Identify the specific host device on that subnet: <code>h = 32 - n</code>.</li>
            <li><strong>Total Subnets Created:</strong> <code>2^b</code> (where <code>b</code> is the number of bits borrowed from the default host portion).</li>
            <li><strong>Total IP Addresses per Subnet:</strong> <code>2^h</code>.</li>
            <li><strong>Usable Host Addresses per Subnet:</strong> <code>2^h - 2</code> (Because the first address is reserved as the <strong>Network ID</strong>, and the last address is reserved as the <strong>Directed Broadcast ID</strong>).</li>
          </ul>

          <h2>4. Step-by-Step Worked Problem: Subnetting a <code>/24</code> Network</h2>
          <p><strong>Problem Statement:</strong> Divide the network <code>192.168.10.0/24</code> into <strong>4 equal subnets</strong> for four college computer labs. Determine for each subnet:</p>
          <ol>
            <li>New Subnet Mask</li>
            <li>Number of usable hosts per subnet</li>
            <li>Network ID, Usable IP Range, and Broadcast ID</li>
          </ol>

          <h3>Calculation Walkthrough:</h3>
          <ol>
            <li><strong>Determine Borrowed Bits:</strong> We need 4 subnets. Since <code>2^b &ge; 4 &rArr; b = 2</code> bits must be borrowed.</li>
            <li><strong>New Prefix Length:</strong> <code>New CIDR = 24 + 2 = /26</code>.</li>
            <li><strong>Calculate Subnet Mask:</strong> In the 4th octet, 2 bits are turned on: <code>11000000_2 = 128 + 64 = 192</code>. Subnet Mask = <code>255.255.255.192</code>.</li>
            <li><strong>Host Bits Remaining:</strong> <code>h = 32 - 26 = 6</code> bits.</li>
            <li><strong>Usable Hosts per Subnet:</strong> <code>2^6 - 2 = 64 - 2 = 62</code> usable hosts per lab.</li>
            <li><strong>Block Size (Hop Count):</strong> <code>256 - 192 = 64</code> addresses per subnet.</li>
          </ol>

          <h3>Complete Subnet Allocation Table:</h3>
          <div class="table-responsive">
            <table class="tutorial-table">
              <thead>
                <tr>
                  <th>Subnet #</th>
                  <th>Network ID</th>
                  <th>First Usable Host IP</th>
                  <th>Last Usable Host IP</th>
                  <th>Broadcast ID</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Subnet 1</strong></td>
                  <td><code>192.168.10.0</code></td>
                  <td><code>192.168.10.1</code></td>
                  <td><code>192.168.10.62</code></td>
                  <td><code>192.168.10.63</code></td>
                </tr>
                <tr>
                  <td><strong>Subnet 2</strong></td>
                  <td><code>192.168.10.64</code></td>
                  <td><code>192.168.10.65</code></td>
                  <td><code>192.168.10.126</code></td>
                  <td><code>192.168.10.127</code></td>
                </tr>
                <tr>
                  <td><strong>Subnet 3</strong></td>
                  <td><code>192.168.10.128</code></td>
                  <td><code>192.168.10.129</code></td>
                  <td><code>192.168.10.190</code></td>
                  <td><code>192.168.10.191</code></td>
                </tr>
                <tr>
                  <td><strong>Subnet 4</strong></td>
                  <td><code>192.168.10.192</code></td>
                  <td><code>192.168.10.193</code></td>
                  <td><code>192.168.10.254</code></td>
                  <td><code>192.168.10.255</code></td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>5. Architectural Diagram: Subnet Octet Decomposition</h2>
          <div style="margin: 24px 0; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-align: center;">
            <svg viewBox="0 0 680 200" width="100%" height="auto" style="max-width: 640px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <text x="340" y="30" text-anchor="middle" font-size="14" font-weight="bold" fill="#1e293b">IPV4 /26 CIDR PREFIX OCTET BREAKDOWN</text>

              <!-- Octet 1 -->
              <rect x="50" y="60" width="130" height="45" rx="4" fill="#eff6ff" stroke="#2563eb" />
              <text x="115" y="82" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e40af">192 (8 bits)</text>
              <text x="115" y="96" text-anchor="middle" font-size="9" fill="#64748b">11111111 (Network)</text>

              <!-- Octet 2 -->
              <rect x="190" y="60" width="130" height="45" rx="4" fill="#eff6ff" stroke="#2563eb" />
              <text x="255" y="82" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e40af">168 (8 bits)</text>
              <text x="255" y="96" text-anchor="middle" font-size="9" fill="#64748b">11111111 (Network)</text>

              <!-- Octet 3 -->
              <rect x="330" y="60" width="130" height="45" rx="4" fill="#eff6ff" stroke="#2563eb" />
              <text x="395" y="82" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e40af">10 (8 bits)</text>
              <text x="395" y="96" text-anchor="middle" font-size="9" fill="#64748b">11111111 (Network)</text>

              <!-- Octet 4 (Split!) -->
              <rect x="470" y="60" width="50" height="45" fill="#dbeafe" stroke="#1d4ed8" stroke-width="1.5" />
              <text x="495" y="82" text-anchor="middle" font-size="11" font-weight="bold" fill="#1d4ed8">2b</text>
              <text x="495" y="96" text-anchor="middle" font-size="9" fill="#1e40af">Subnet</text>

              <rect x="520" y="60" width="110" height="45" fill="#fee2e2" stroke="#dc2626" stroke-width="1.5" />
              <text x="575" y="82" text-anchor="middle" font-size="11" font-weight="bold" fill="#991b1b">6 bits</text>
              <text x="575" y="96" text-anchor="middle" font-size="9" fill="#7f1d1d">Hosts (2^6 - 2 = 62)</text>

              <!-- Legend Footer -->
              <text x="340" y="145" text-anchor="middle" font-size="11" fill="#475569">Total Network Mask = 255.255.255.192 | 26 Network Bits + 6 Host Bits = 32 Bits</text>
            </svg>
            <div style="font-size: 0.85rem; color: #64748b; margin-top: 8px;">Figure 6.1: Subnet Mask Bit Borrowing for a /26 CIDR Prefix</div>
          </div>

          <h2>6. Multiple Choice Questions (MCQ)</h2>
          <div class="mcq-container">
            <div class="mcq-card">
              <div class="mcq-header">
                <span class="mcq-badge">MCQ Practice 4</span>
                <span style="font-size:0.8rem; color:var(--study-text-muted);">Computer Networks Exam</span>
              </div>
              <div class="mcq-question">
                An organization is assigned the IP prefix <code>172.16.0.0/22</code>. What is the maximum number of usable host IP addresses that can be configured in this network?
              </div>
              <div class="mcq-options-list">
                <div class="mcq-option"><span class="mcq-option-letter">A)</span> <span>1022 hosts</span></div>
                <div class="mcq-option"><span class="mcq-option-letter">B)</span> <span>1024 hosts</span></div>
                <div class="mcq-option"><span class="mcq-option-letter">C)</span> <span>2046 hosts</span></div>
                <div class="mcq-option"><span class="mcq-option-letter">D)</span> <span>510 hosts</span></div>
              </div>
              <button type="button" class="mcq-reveal-btn">Show Answer &amp; Detailed Explanation</button>
              <div class="mcq-explanation" style="display: none;">
                <strong>Correct Answer: A) 1022 hosts</strong><br>
                <em>Explanation:</em> The prefix is <code>/22</code>. The number of host bits is <code>h = 32 - 22 = 10</code> bits. The total number of IP addresses is <code>2^10 = 1024</code>. Subtracting the 2 reserved addresses (Network ID and Directed Broadcast ID) gives <code>1024 - 2 = 1022</code> usable hosts.
              </div>
            </div>
          </div>
        `
      }
    ]
  }
];
