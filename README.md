<div align="center">

# 🔺 DSA Virtual Lab

### Don't just read algorithms. Watch them think.

An interactive learning platform where Data Structures & Algorithms run **step by step, right in your browser**.
Pick an algorithm, type your own input, and see every comparison, swap and decision as it happens.

<p>
  <img src="https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/Git-F05032?style=flat-square&logo=git&logoColor=white" alt="Git">
</p>

---

## Why this project?

Most students learn algorithms by reading code or looking at a few static diagrams. That shows *what* an algorithm does, but not *why* it works. The hard part is the middle: how the data changes from one step to the next.

DSA Virtual Lab makes that middle part visible. Every algorithm is executed step by step, and each step is shown on screen with a plain-English explanation, the current pseudocode line, live variables, and a complexity breakdown.

---

## Features

- **Step-by-step playback**: Play, Pause, Previous, Next and Reset
- **Speed control**: five speeds, from Very slow to Turbo
- **Step slider**: drag to jump to any step
- **Keyboard shortcuts**: `Space` to play/pause, `←` / `→` to move between steps
- **Your own input**: type up to 20 numbers, or press Random
- **Live pseudocode**: the line being executed is highlighted
- **Live variables**: `i`, `j`, `min`, comparisons and swaps update at every step
- **Complexity panel**: best, average and worst case, with comparison counts for *your* array
- **Plain-English explanation** for every step, plus a colour legend
- **A different visual style per algorithm** (bubbles, tiles, cards, merge tree) so each one looks like how it works
- 📚 **Explore DSA**: concept pages across 12 categories, loaded from JSON (not hard-coded in HTML)

---

## 🖼️ Screenshots

<table>
  <tr>
    <td align="center"><b>Home</b><br><img src="docs/home.png" alt="Home page" width="100%"></td>
    <td align="center"><b>Explore DSA</b><br><img src="docs/explore.png" alt="Explore DSA page" width="100%"></td>
  </tr>
  <tr>
    <td align="center"><b>Virtual Lab topics</b><br><img src="docs/virtual-lab.png" alt="Virtual Lab topics" width="100%"></td>
  </tr>
  <tr>
    <td align="center"><b>Merge Sort visualizer</b><br><img src="docs/mergeSort.png" alt="Merge sort visualizer" width="100%"></td>
  </tr>
</table>

---

## How it works

Every algorithm is written in Python as a function that records a **snapshot (a "step")** after each important operation. The backend sends those steps to the browser as JSON, and the frontend plays them back.

```mermaid
flowchart LR
  A["🌐 Browser<br/>HTML · CSS · JavaScript"] -->|"asks for steps"| B["⚡ FastAPI<br/>backend/routes.py"]
  B --> C["🗂️ Registry<br/>dsa_engine/registry.py"]
  C --> D["🧮 Algorithm engines<br/>sorting · searching · arrays_strings"]
  D -->|"list of steps (JSON)"| B
  B -->|"steps"| A
  A --> E["🎞️ Player + Renderers<br/>bubbles · tiles · cards · cells · mergetree"]
```

**Three parts, kept separate on purpose:**

| Part | Job |
|------|-----|
| **Engine** (Python) | Runs the algorithm and records every step |
| **Player** (JavaScript) | Holds the current step number. Next, Previous, Play and speed just change that number |
| **Renderer** (JavaScript) | Draws one step on screen, in the style that suits that algorithm |

Because of this split, adding a new algorithm means writing one engine file, one renderer (or reusing an existing one), and registering it. The page, controls and panels stay the same.

---

## Tech stack

<p>
  <img src="https://skillicons.dev/icons?i=python,fastapi,js,html,css,git,github,vscode&theme=dark" alt="Tech stack icons">
</p>

| Layer | Technology |
|-------|-----------|
| Algorithm engine | Python |
| API | FastAPI + Uvicorn |
| Frontend | HTML, CSS, vanilla JavaScript (no framework) |
| Content | JSON files for the Explore DSA pages |
| Tools | Git, GitHub, VS Code |

---

## Project structure

```
DSA Virtual Lab/
├── backend/
│   ├── main.py             # FastAPI app entry point
│   └── routes.py           # API routes that serve algorithm steps
├── dsa_engine/
│   ├── arrays_strings/     # array & string algorithms
│   ├── searching/          # searching algorithms
│   ├── sorting/            # sorting algorithms
│   ├── common.py           # shared helpers
│   └── registry.py         # maps algorithm names to engine functions
├── frontend/
│   ├── css/
│   ├── data/               # JSON content for Explore DSA
│   ├── js/
│   │   ├── renderers/      # one visual style per algorithm
│   │   ├── visualizer/     # visualizer page logic
│   │   ├── explore.js
│   │   ├── virtual-lab.js
│   │   └── script.js
│   ├── index.html
│   ├── explore.html
│   ├── virtual-lab.html
│   ├── visualizer.html
│   └── practice.html
├── requirements.txt
└── README.md
```

---

## Getting started

**Requirements:** Python 3.10 or newer, Git, and VS Code with the *Live Server* extension.

```bash
# 1. Clone the repository
git clone https://github.com/YOUR-USERNAME/dsa-virtual-lab.git
cd dsa-virtual-lab

# 2. Create and activate a virtual environment (Windows)
python -m venv .venv
.venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start the backend
uvicorn backend.main:app --reload
```

Then open `frontend/index.html` in VS Code, right-click it, and choose **Open with Live Server**.

> Keep both running: the backend (Uvicorn) serves the algorithm steps, and Live Server serves the pages.

---

## What I learned

- Designing a system where **data, logic and display are separate**, so new content doesn't mean rewriting the page
- Turning an algorithm into a **list of state snapshots** that a UI can replay forwards and backwards
- Building a full frontend with **plain HTML, CSS and JavaScript**: DOM updates, `fetch`, timers and state
- Building a **REST API with FastAPI** and connecting it to a separate frontend
- Designing a consistent UI theme and making each visualization readable for beginners

---

## Author

**Chandni Rajawat**
B.Tech Information Technology (IoT), Madhav Institute of Technology & Science, Gwalior

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/Chandni-R53/DSA-Virtual-Lab.git)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/chandni-rajawat/)
[![Email](https://img.shields.io/badge/Email-D14836?style=flat-square&logo=gmail&logoColor=white)](mailto:rajawatchandni53@gmail.com)

---

<div align="center">

⭐ If you found this project useful, consider giving it a star.

</div>