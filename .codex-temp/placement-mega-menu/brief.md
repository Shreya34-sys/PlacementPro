Objective: Implement/refine the Placement Prep mega-menu in the existing PlacementPro React app.

Target audience: Students using a professional ed-tech/SaaS placement preparation portal.

Output path: Existing app files under frontend/src, especially src/components/layout/Navbar.tsx and src/index.css.

Existing context:
- React + TypeScript + Vite app.
- Authenticated layout uses src/components/layout/Navbar.tsx.
- Existing styles live in src/index.css.
- Do not create a standalone HTML mockup.
- Preserve the existing navbar brand/actions design and only refine the Placement Prep mega-menu/navigation behavior.

Requirements:
- Main desktop navbar order/content must be: Home, Placement Prep with chevron, Practice, Companies, Analytics, Leaderboard.
- Hovering or clicking Placement Prep opens a dark premium mega-menu directly below the navbar, centered under the Placement Prep item.
- Clicking outside closes it.
- Smooth open/close animation; navbar stays fixed/stable.
- All menu entries must be real clickable navigation controls using the app's onTabChange route IDs.
- Use reusable data structures for the three sections and trending cards.
- Desktop mega-menu layout: three aligned columns, dark navy/black gradient, subtle blue/purple top glow/border, rounded corners, soft shadow, white headings, light gray descriptions, blue accents, compact spacing, not excessively tall.
- Bottom section: horizontal divider, "Trending Placement Prep", five compact clickable cards.
- Tablet/mobile: responsive dropdown/drawer, stack sections vertically, tap-friendly links, same dark premium styling.

Content:
- Column 1 heading "Placement Rounds"; description "Prepare for every stage of the campus placement process."; items:
  Aptitude - Quantitative aptitude, numerical ability and problem solving
  Logical Reasoning - Practice analytical and logical reasoning questions
  Verbal Ability - Improve grammar, vocabulary and verbal reasoning
  Coding Round - Solve coding problems and improve problem-solving skills
  Technical Round - Prepare CS fundamentals and technical interview questions
  HR Round - Practice common HR and behavioral interview questions
  Group Discussion - Improve communication, confidence and discussion skills
- Column 2 heading "Interview Preparation"; description "Build confidence for technical and HR interviews."; items:
  Technical Interview - Core CS subjects and technical questions
  HR Interview - Behavioral, situational and HR questions
  AI Interview - Practice realistic AI-powered interviews
  System Design - Learn system design concepts and interview patterns
  Machine Coding - Practice real-world coding and implementation tasks
  Resume & ATS - Improve your resume and ATS readiness
- Column 3 heading "Company Preparation"; description "Prepare according to the companies you want to crack."; items:
  Product Companies - Prepare for product-based company interviews
  Service-Based Companies - Prepare for common service-company placement patterns
  Company-Wise Questions - Practice company-specific interview questions
  Previous Interview Experiences - Explore interview experiences and preparation insights
  Company Eligibility - Check eligibility based on academic criteria
  Add button "Explore All Companies ->" navigating to Companies page.
- Trending cards:
  Aptitude / Crack Aptitude Tests / Practice ->
  DSA / Master Coding Rounds / Practice ->
  Technical / Ace Technical Interviews / Prepare ->
  AI Interview / Practice AI Interviews / Start ->
  Resume / Improve Your ATS Score / Analyze ->

Design direction:
- Premium compact dark glass panel with practical SaaS density, restrained blue/purple accents, small readable headings, no oversized marketing treatment.
- Avoid unrelated navbar redesign, decorative blobs/orbs, or overly tall cards.
- Keep text fitting at common desktop widths and mobile widths.

Verification:
- Run TypeScript lint/build where practical using npm.cmd because PowerShell may block npm.ps1.
- Verify localhost:3000 if dev server is running or can be started.
