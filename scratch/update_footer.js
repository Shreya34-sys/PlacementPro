const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'public', 'pages', 'landing.html');
let html = fs.readFileSync(targetPath, 'utf8');

const oldBlock = `            <div class="footer-col">
                <h4>Contact Us</h4>
                <ul>
                    <li><a href="#">College Support</a></li>
                    <li><a href="mailto:placementpro01@gmail.com">placementpro01@gmail.com</a></li>
                    <li><a href="#">Find us online</a></li>
                </ul>
            </div>

            <div class="footer-col">
                <h4>Learning</h4>
                <ul>
                    <li><a href="#">DSA Preparation</a></li>
                    <li><a href="#">Aptitude & Reasoning</a></li>
                    <li><a href="#">Programming</a></li>
                    <li><a href="#">Core CS Subjects</a></li>
                    <li><a href="#">Web Development</a></li>
                </ul>
            </div>

            <div class="footer-col">
                <h4>Career</h4>
                <ul>
                    <li><a href="#">Placement Preparation</a></li>
                    <li><a href="#">Interview Preparation</a></li>
                    <li><a href="#">Resume Building</a></li>
                    <li><a href="#">Mock Interviews</a></li>
                    <li><a href="#">Company Preparation</a></li>
                </ul>
            </div>

            <div class="footer-col">
                <h4>Company</h4>
                <ul>
                    <li><a href="#">About Us</a></li>
                    <li><a href="#">For Students</a></li>
                    <li><a href="#">For Colleges</a></li>
                    <li><a href="#">Contact Us</a></li>
                    <li><a href="#">Privacy Policy</a></li>
                    <li><a href="#">Terms & Conditions</a></li>
                </ul>
            </div>

            <div class="footer-col">
                <h4>Resources</h4>
                <ul>
                    <li><a href="#">Placement Roadmaps</a></li>
                    <li><a href="#">Practice Tests</a></li>
                    <li><a href="#">Coding Resources</a></li>
                    <li><a href="#">Interview Questions</a></li>
                    <li><a href="#">Placement Blogs</a></li>
                    <li><a href="#">FAQs</a></li>
                </ul>
            </div>

            <div class="footer-col">
                <h4>Social Links</h4>
                <ul>
                    <li><a href="#">LinkedIn</a></li>
                    <li><a href="#">GitHub</a></li>
                    <li><a href="#">Instagram</a></li>
                </ul>
            </div>`;

const newBlock = `            <div class="footer-col">
                <h4>Contact Us</h4>
                <ul>
                    <li><a href="mailto:placementpro01@gmail.com">College Support</a></li>
                    <li><a href="mailto:placementpro01@gmail.com">placementpro01@gmail.com</a></li>
                    <li><a href="/login">Support Portal</a></li>
                </ul>
            </div>

            <div class="footer-col">
                <h4>Learning</h4>
                <ul>
                    <li><a href="/study-materials">DSA Preparation</a></li>
                    <li><a href="/study-materials">Aptitude &amp; Reasoning</a></li>
                    <li><a href="/coding-rounds">Programming</a></li>
                    <li><a href="/study-materials">Core CS Subjects</a></li>
                    <li><a href="/compiler-practice?subject=compiler-design">Compiler Design (C-Visualize)</a></li>
                </ul>
            </div>

            <div class="footer-col">
                <h4>Career</h4>
                <ul>
                    <li><a href="/login">Placement Preparation</a></li>
                    <li><a href="/interviews">Interview Preparation</a></li>
                    <li><a href="/resume-analyzer">Resume Building</a></li>
                    <li><a href="/interviews">Mock Interviews</a></li>
                    <li><a href="/companies">Company Preparation</a></li>
                </ul>
            </div>

            <div class="footer-col">
                <h4>Company</h4>
                <ul>
                    <li><a href="#how-it-works">About Us</a></li>
                    <li><a href="/signup">For Students</a></li>
                    <li><a href="/admin-login">Admin Portal</a></li>
                    <li><a href="mailto:placementpro01@gmail.com">Contact Us</a></li>
                    <li><a href="/login">Terms &amp; Conditions</a></li>
                </ul>
            </div>

            <div class="footer-col">
                <h4>Resources</h4>
                <ul>
                    <li><a href="/study-materials">Curriculum Roadmaps</a></li>
                    <li><a href="/available-exams">Practice Tests</a></li>
                    <li><a href="/coding-rounds">Coding Rounds</a></li>
                    <li><a href="/interviews">AI Interview Simulator</a></li>
                    <li><a href="/versant-tests">Versant Voice Tests</a></li>
                </ul>
            </div>

            <div class="footer-col">
                <h4>Connect</h4>
                <ul>
                    <li><a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a></li>
                    <li><a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
                    <li><a href="mailto:placementpro01@gmail.com">Direct Inquiry</a></li>
                </ul>
            </div>`;

const normHtml = html.replace(/\r\n/g, '\n');
const normOld = oldBlock.replace(/\r\n/g, '\n');
const normNew = newBlock.replace(/\r\n/g, '\n');

if (normHtml.includes(normOld)) {
  const updated = normHtml.replace(normOld, normNew);
  fs.writeFileSync(targetPath, updated, 'utf8');
  console.log('SUCCESS: Footer links updated to real destinations.');
} else {
  console.error('ERROR: oldBlock was not matched.');
}
