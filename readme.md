# AI-proctored aptitude module — drop-in files

Install the existing packages plus Socket.IO: `npm i socket.io`. Run `01_exam_schema.sql` once against the existing `placementpro` database. It adds only module tables, uses UUID strings everywhere, and has no auto-increment columns.

Copy files 02–07 into the matching project folders (rename the numeric prefix away). Mount `06_routes_examRoutes.js` at the existing `/api/exams` route. Replace the current `app.listen` setup with an HTTP server and call `setupSockets(server, app)` from `07_socket_setup.js`. Copy files 08–17 into `public/pages`, `public/js`, and `public/css` with the names following their prefixes.

The test-creation payload is: `{ title, instructions, durationMinutes, startsAt, endsAt, status, negativeMarking, topics: [{ name, questions: [{ text, marks, options: [{ text, isCorrect }] }] }] }`. Only admins can create tests and read/resolve proctoring flags. New exams are returned newest-first for students.

Security note: browsers cannot reliably block OS-level screenshots, screen recording, or a user with another device. The client requests camera/mic permission, full screen, and reports tab changes/clipboard/full-screen exits, while the server stores the warnings and auto-submits at three. For genuine face, phone, and multi-person detection, post signed detections from a separately hosted, consented ML pipeline to the `flags` endpoint; do not treat browser JavaScript as proof of cheating.

Before production, add ownership checks to every attempt route (student id must equal `exam_attempts.student_id`), rate limits, request validation (Zod/Joi), HTTPS, a privacy/retention policy for camera evidence, and server-side scheduled closure of expired exams.