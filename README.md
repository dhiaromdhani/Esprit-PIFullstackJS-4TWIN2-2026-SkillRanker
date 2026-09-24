# SkillRanker

## Overview

**SkillRanker** is a smart full-stack web application designed to help HR teams, managers, and project leaders identify the most suitable employees for projects, missions, trainings, and internal activities.

The platform combines **Angular, Node.js, Express.js, MongoDB, and Artificial Intelligence/Natural Language Processing** to analyze employee skills, experience, evaluations, and activity requirements in order to provide intelligent candidate recommendations.

The project was developed by the **FullStackers** team as part of the **PIDEV – FullStack JS Engineering Program at Esprit School of Engineering**.

---

## Key Features

*  **AI-powered employee recommendations**
*  **Semantic matching using NLP**
*  **Dynamic employee skill scoring**
*  **Employee and skill management**
*  **Context-aware candidate matching**
*  **Employee skill evolution tracking**
*  **Evaluation and feedback management**
*  **Continuous learning and recommendation improvement**
*  **Interactive management dashboard**

---

## Project Architecture

The project is organized into several main components:

```text
SkillRanker/
│
├── frontend/        # Angular application
│
├── backend/         # Node.js / Express.js REST API
│
├── ai/              # Python AI/NLP recommendation module
│
├── docker/          # Docker configuration
│
└── README.md
```

### Frontend

The frontend is developed using:

* Angular 18
* TypeScript
* HTML5
* CSS3

It provides interactive dashboards for HR users, managers, and administrators.

### Backend

The backend is based on:

* Node.js
* Express.js
* RESTful APIs
* MongoDB

It manages the business logic, authentication, employee data, skills, activities, evaluations, and communication with the AI module.

### AI / NLP

The recommendation engine uses Python-based technologies such as:

* Python
* spaCy
* Transformers
* Scikit-learn

It performs semantic analysis and calculates matching scores between employee profiles and activity requirements.

### Database

**MongoDB** is used to store:

* Employees
* Skills
* Activities
* Evaluations
* Recommendations
* Matching results

---

## How It Works

The platform follows a complete recommendation process:

### 1. Employee Data

Employee profiles contain information about their skills, experience, job position, previous activities, and evaluations.

### 2. Activity Requirements

Managers or HR users define the requirements of a project, mission, training, or activity.

### 3. Semantic Analysis

The AI/NLP module analyzes the activity description and compares it with employee profiles.

### 4. Candidate Scoring

Each employee receives a matching score based on relevant skills, experience, evaluations, and contextual requirements.

### 5. Recommendations

The system provides a ranked list of suitable employees with relevant information and recommendation details.

---

## Tech Stack

| Component       | Technologies                                       |
| --------------- | -------------------------------------------------- |
| Frontend        | Angular 18, TypeScript, HTML5, CSS3                |
| Backend         | Node.js, Express.js                                |
| Database        | MongoDB                                            |
| AI / NLP        | Python, spaCy, Transformers, Scikit-learn          |
| DevOps          | Docker, Docker Compose, GitHub Actions, Kubernetes |
| Code Quality    | SonarQube                                          |
| Monitoring      | Prometheus, Grafana                                |
| Version Control | Git, GitHub                                        |

---

## Installation

### Prerequisites

Make sure the following tools are installed:

* Node.js 18+
* Angular CLI
* Python 3.9+
* MongoDB
* Git
* Docker and Docker Compose *(optional)*

---

## Clone the Repository

```bash
git clone https://github.com/your-username/skillranker.git
cd skillranker
```

---

## Run the Frontend

```bash
cd frontend
npm install
ng serve
```

The frontend will be available at:

```text
http://localhost:4200
```

---

## Run the Backend

```bash
cd backend
npm install
npm start
```

The backend REST API will run on the configured backend port.

---

## Run with Docker

The project can also be executed using Docker and Docker Compose.

```bash
docker compose up --build
```

---

## Team

This project was developed by the **FullStackers** team:

* Ali Bouaine
* Fedi Mbarek Abidi
* Fedi Ben Khalifa
* Mohamed Dhia Romdhane
* Firas Nefzi

---

## Academic Context

**Esprit School of Engineering – Tunisia**

**PIDEV – FullStack JS Engineering Program**

**Academic Year: 2025–2026**

This project applies full-stack development, artificial intelligence, NLP, database management, and DevOps concepts to solve a real-world employee skill management and recommendation problem.
