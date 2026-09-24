# SkillRanker

## Overview

The **SkillRanker** is a smart full-stack web application designed to help managers, HR teams, and project leaders identify the most suitable employees for projects, trainings, missions, or internal activities.

Instead of manually reviewing a large number of employee profiles, the system uses Artificial Intelligence, Natural Language Processing, and dynamic scoring techniques to recommend the best candidates based on their skills, experience, previous activities, evaluations, and organizational objectives.

This project was developed by **FullStackers** as part of the PIFullstackJS – 4th Year Engineering Program at **Esprit School of Engineering** during the academic year 2025–2026.

---

## Features

The system provides several intelligent features that go beyond traditional HR management tools.

### AI-Powered Semantic Matching

The recommendation engine does not rely only on simple keyword matching. It uses NLP techniques to understand the meaning of activity descriptions and compare them with employee profiles, including skills, job descriptions, experience, and past participation.

### Dynamic Skill Evolution

Employee skills are continuously updated based on their participation in activities, projects, trainings, and post-activity evaluations. This allows the system to reflect the real evolution of each employee over time.

### Context-Aware Recommendations

The recommendation process takes into account the company’s strategic goals. For example, the system can prioritize junior employees for upskilling, experienced employees for critical missions, or balanced profiles for team-based projects.

### Multi-Dimensional Skill Model

Skills are categorized into multiple dimensions to provide a complete view of each employee:

- Knowledge: theoretical and technical knowledge
- Know-how: practical and operational skills
- Soft skills: communication, teamwork, leadership, adaptability, and other behavioral skills

### Continuous Learning Loop

The system improves over time by using feedback from completed activities. Evaluations and recommendation outcomes can be used to retrain or fine-tune the AI models for better future recommendations.

---

## Why Our System?

Traditional HR platforms are mainly designed for storing employee information. However, they often lack intelligent recommendation capabilities.

Our solution adds value by combining employee management, skill tracking, semantic analysis, AI-based scoring, and continuous learning.

| Feature | Oracle HCM | OrangeHRM | Empowill | Our Solution |
|---|---|---|---|---|
| Employee Management | Yes | Yes | Yes | Yes |
| Skill Tracking | Basic | Basic | Basic | Advanced |
| AI Recommendations | No | No | No | Yes |
| Dynamic Skill Scoring | No | No | No | Yes |
| Semantic Analysis | No | No | No | Yes |
| Context-Aware Matching | No | No | No | Yes |
| Continuous Learning | No | No | No | Yes |

---

## How It Works

The system follows a complete recommendation pipeline.

### 1. Data Ingestion

Employee data, activity descriptions, project requirements, HR records, and evaluation results are collected and stored securely.

### 2. Feature Engineering

Raw data is processed and transformed into useful features. NLP models extract skills from activity descriptions, while employee profiles are converted into structured feature vectors.

### 3. AI Recommendation Engine

When a manager or HR user creates a request, the AI engine calculates a matching score for each potential candidate based on skills, experience, availability, evaluations, and organizational context.

### 4. Ranked Recommendations

The system returns a ranked list of the most suitable employees, including profile details, matching scores, and recommendation explanations through an interactive dashboard.

---

## Tech Stack

### Frontend

- Angular
- TypeScript
- HTML5
- CSS3
- Modern dashboard interface

### Backend

- Node.js
- Express.js
- RESTful APIs

### AI and NLP Module

- Python
- spaCy
- Transformers
- Scikit-learn

### Database

- MongoDB

### DevOps and Quality

- Git
- GitHub
- GitHub Actions
- Docker
- Docker Compose
- Kubernetes
- SonarQube
- Prometheus
- Grafana

---

## Architecture

The application is based on a modular architecture composed of several layers:

- Frontend Layer: Angular dashboard used by HR users, managers, and administrators
- Backend Layer: Node.js and Express.js REST API responsible for business logic and communication between modules
- AI/NLP Layer: Python-based recommendation engine responsible for semantic matching, scoring, and model improvement
- Database Layer: MongoDB used to store employees, skills, activities, evaluations, and recommendation results
- DevOps Layer: Docker, GitHub Actions, monitoring, and code quality tools used to support deployment and maintainability

This separation improves scalability, maintainability, and future extensibility of the system.

---

## Contributors

This project was developed by the **FullStackers** team.

Team members:

- Ali Bouaine
- Fedi Mbarek Abidi
- Fedi Ben Khalifa
- Mohamed Dhia Romdhane
- Firas Nefzi

---

## Academic Context

Developed at **Esprit School of Engineering – Tunisia**

PIDEV – 4th Year Engineering Program  
Academic Year: 2025–2026

This project aims to apply software engineering, artificial intelligence, data processing, and full-stack development concepts to solve a real-world human resources optimization problem.

---

## Getting Started

### Prerequisites

Before running the project, make sure you have the following tools installed:

- Node.js 18+
- Angular CLI
- Python 3.9+
- MongoDB
- Docker and Docker Compose, optional
- Git

### Installation

Clone the repository:

```bash
git clone https://github.com/your-username/intelligent-employee-recommendation-system.git
cd intelligent-employee-recommendation-system
