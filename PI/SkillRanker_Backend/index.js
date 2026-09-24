const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
require('./config/passport');
const authRoutes = require('./routes/auth.routes');
const client = require('prom-client');
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();
const app = express();
app.use(cors());

app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboard_cat',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());

// Middlewares global
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
const userRoutes = require('./routes/user.routes');
app.use('/api/users', userRoutes);
const recommendationRoutes = require('./routes/recommendation.routes');
app.use('/api/recommend', recommendationRoutes);
const employeeRoutes = require('./routes/employee.routes');
app.use('/api/employees', employeeRoutes);
const activityRequestRoutes = require('./routes/activityRequest.routes');
app.use('/api/activity-requests', activityRequestRoutes);
// const notificationRoutes = require('./routes/notification.routes');
// app.use('/api/notifications', notificationRoutes);
const statsRoutes = require('./routes/stats.routes');
app.use('/api/stats', statsRoutes);
const historyRoutes = require('./routes/history.routes');
app.use('/api/history', historyRoutes);
const activityRoutes = require('./routes/activity.routes');
app.use('/api/activities', activityRoutes);
const departmentRoutes = require('./routes/department.routes');
app.use('/api/departments', departmentRoutes);
const competenceRoutes = require('./routes/competence.routes');
app.use('/api/competences', competenceRoutes);
const ficheRoutes = require('./routes/fiche.routes');
app.use('/api/fiches', ficheRoutes);
const questionCompetenceRoutes = require('./routes/questionCompetence.routes');
app.use('/api/question-competences', questionCompetenceRoutes);

const dashboardRoutes = require('./routes/dashboard.routes');
app.use('/api/dashboard', dashboardRoutes);

const scoringRoutes = require('./routes/scoring.routes');
app.use('/api/scoring', scoringRoutes);

const optimizationRoutes = require('./routes/optimization.routes');
app.use('/api/optimization', optimizationRoutes);

const notificationRoutes = require('./routes/notification.routes');
app.use('/api/notifications', notificationRoutes);

const chatActivityRecommendationRoutes = require('./routes/chatActivityRecommendation.routes');
app.use('/api/chat-recommendation', chatActivityRecommendationRoutes);

app.use('/api/evaluation-messages', require('./routes/evaluationMessage.routes'));

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});


// === AJOUT IMPORTANT : Routes de Notification ===
// const notificationRoutes = require('./routes/notification.routes');
// app.use('/api/notifications', notificationRoutes);


// DB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Server
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;