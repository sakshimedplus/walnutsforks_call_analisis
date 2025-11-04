# 🌰 WalnutsForks Call Analysis

A lightweight frontend web application built with **Vite (React)** and powered by **Supabase** for backend services.
The app demonstrates secure integration between a modern frontend and a managed backend, fully containerized and deployed using **Docker** and **Railway**.

---

## 🚀 Features

* ⚡ Fast and lightweight frontend built with **Vite + React**
* 🔐 Supabase authentication and database integration
* 🐳 Dockerized build for consistent deployment
* ☁️ Hosted on **Railway.app** with automatic GitHub CI
* 🌐 Environment configuration via `.env` and Railway variables

---

## 🛠️ Tech Stack

| Layer      | Technology                                    |
| ---------- | --------------------------------------------- |
| Frontend   | Vite + React (JavaScript/TypeScript optional) |
| Deployment | Docker + Railway                              |
| Hosting    | Railway Static Hosting via Nginx              |
| Styling    | Plain CSS                    |

---

## ⚙️ Environment Variables

The following environment variables are required for the project:

| Variable                 | Description                                         |
| ------------------------ | --------------------------------------------------- |
| `VITE_SUPABASE_URL`      | Supabase project URL (from your Supabase dashboard) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous API key                          |

In Railway:

1. Navigate to your project → **Variables**
2. Add:

   ```
   VITE_SUPABASE_URL = https://<your-project>.supabase.co
   VITE_SUPABASE_ANON_KEY = <your-anon-key>
   ```

---

## 🧩 Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/sakshimedplus/walnutsforks_call_analisis.git
cd walnutsforks_call_analisis
```

### 2. Install dependencies

```bash
npm install
```

### 3. Add `.env` file

Create a file named `.env` in the project root:

```
VITE_SUPABASE_URL=https://<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

### 4. Run the development server

```bash
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

---

## 🐳 Docker Deployment

### Build locally

```bash
docker build -t walnutsforks-app .
```

### Run locally

```bash
docker run -p 8080:80 walnutsforks-app
```

Then visit [http://localhost:8080](http://localhost:8080).

---

## ☁️ Deployment on Railway

This app is automatically deployed from GitHub → Railway.

* GitHub Repo: [`sakshimedplus/walnutsforks_call_analisis`](https://github.com/sakshimedplus/walnutsforks_call_analisis)
* Deployed URL: [`https://walnutsforkscallanalisis-production.up.railway.app`](https://walnutsforkscallanalisis-production.up.railway.app)

---

## 🧰 Folder Structure

```
walnutsforks_call_analisis/
│
├── public/                # Static assets
├── src/                   # Main app source code
│   ├── components/        # UI components
│   ├── services/          # Supabase client setup
│   └── App.jsx            # Root React component
│
├── .env.example           # Example env file
├── Dockerfile             # Docker build setup
├── package.json
├── vite.config.js
└── README.md
```

---

## 🧾 License

This project is licensed under the MIT License — feel free to use and modify for your own projects.

---

## 👩‍💻 Author

**Sakshi Dubey**
Full Stack Developer
9697248829
