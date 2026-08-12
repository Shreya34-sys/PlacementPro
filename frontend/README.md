<<<<<<< HEAD
# PlacementPro
=======
 # PlacementPro
>>>>>>> 7775be40585142111e8798ad32c75c420934fcfc

![Build Status](https://img.shields.io/badge/status-active-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Platform](https://img.shields.io/badge/platform-web-lightgrey)

A modern campus placement preparation portal for students, recruiters, and training officers. PlacementPro centralizes preparation resources, application tracking, analytics, and interview readiness tools into one polished web experience.

---

## ✨ Features

- ✅ Smart student dashboard with progress metrics
- 🎯 Daily preparation streaks and activity heatmaps
- 📚 Placement-specific module tracking and study plan tools
- 📄 Resume upload and profile management
- 🚀 Recruiter and TPO-ready workflows for drive management
- 📊 Insights and analytics for placement readiness

---

## 🛠️ Technology Stack

| Layer | Tools |
|------|-------|
| Frontend | React, TypeScript, Vite |
| UI | React Bootstrap, Bootstrap Icons |
| State | React Context API |
| Charting | Recharts, Chart.js |
| Build | Vite |

---

## 🚀 Installation

```bash
cd frontend
npm install
```

### Local Setup

1. Copy `.env.example` to `.env.local` if environment variables are required.
2. Start the development server:

```bash
npm run dev
```

3. Open the app at:

```bash
http://localhost:3000
```

---

## 🌐 Environment Variables

Create a `.env.local` file and add any required values using generic placeholders.

```bash
VITE_API_URL=https://api.example.com
VITE_AUTH_KEY=your_auth_key_here
```

> If the project does not currently use any environment variables, this step can be skipped.

---

## ▶️ Usage

- Run the app in development mode:

```bash
npm run dev
```

- Build the app for production:

```bash
npm run build
```

- Preview the production build locally:

```bash
npm run preview
```

- Start a production server (if configured):

```bash
npm start
```

---

## 📁 Project Structure

```text
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── context/         # React context and state management
│   ├── data/            # Seed and mock data files
│   ├── pages/           # Route page components
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── public/              # Static assets
├── index.css            # Global styles
├── tsconfig.json        # TypeScript configuration
└── vite.config.ts       # Vite configuration
```

---

## 📦 Available Scripts

| Command | Description |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Start local development server |
| `npm run build` | Build production assets |
| `npm start` | Start production server |

---

## 🚢 Deployment

This project can be deployed to any static hosting service that supports Vite builds.

1. Build the production bundle:

```bash
npm run build
```

2. Deploy the generated `dist/` folder to your hosting provider.

Recommended platforms:
- Vercel
- Netlify
- Firebase Hosting
- GitHub Pages

---

## 🤝 Contributing

Feel free to contribute through pull requests.

- Fork the repository
- Create a feature branch
- Commit changes with meaningful messages
- Open a pull request describing your updates

Please keep contributions focused on clean code, accessibility, and performance.

---

## 📄 License

This repository is licensed under the MIT License.

---

## 🙌 Author

**PlacementPro Team**

Built for campus placement readiness and recruiter collaboration.
