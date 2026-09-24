function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const fakeId = '000000000000000000000001';

function makeDoc(data = {}) {
  const doc = {
    _id: data._id || fakeId,
    firstName: data.firstName || 'Ali',
    lastName: data.lastName || 'Ben Ali',
    name: data.name || 'Ali Ben Ali',
    email: data.email || 'ali@example.com',
    role: data.role || 'EMPLOYEE',
    status: data.status || 'ACTIVE',
    isActive: data.isActive !== undefined ? data.isActive : true,
    title: data.title || 'Formation Angular',
    description: data.description || 'Formation complète',
    type: data.type || 'TRAINING',
    category: data.category || 'TECHNICAL',
    seats: data.seats || 2,
    priorityContext: data.priorityContext || 'DEVELOPMENT',
    requiredSkills: data.requiredSkills || [
      { name: 'Angular', type: 'KNOW_HOW', desiredLevel: 'HIGH', weight: 1 }
    ],
    skills: data.skills || [
      { name: 'Angular', type: 'KNOW_HOW', level: 'HIGH', score: 80, scoreHistory: [{ score: 60 }, { score: 80 }] },
      { name: 'Node', type: 'KNOWLEDGE', level: 'MEDIUM', score: 55 }
    ],
    globalScore: data.globalScore || 72,
    yearsOfExperience: data.yearsOfExperience || 3,
    department: data.department || { name: 'IT' },
    jobTitle: data.jobTitle || 'Developer',
    userId: data.userId || 'u1',
    employeeId: data.employeeId || 'e1',
    csvEmployeeId: data.csvEmployeeId || 1,
    selectedEmployees: data.selectedEmployees || [
      {
        employee: { _id: 'u1', toString: () => 'u1' },
        employeeId: 'e1',
        userId: 'u1',
        name: 'Ali Ben Ali',
        email: 'ali@example.com',
        status: 'COMPLETED',
        activityId: fakeId,
        respondedAt: new Date(),
        justification: 'ok'
      }
    ],
    recommendedEmployees: data.recommendedEmployees || [
      { csvEmployeeId: 1, employeeId: 'e1', userId: 'u1', name: 'Ali Ben Ali', email: 'ali@example.com', score: 90 }
    ],
    assignedActivities: data.assignedActivities || [
      { activityId: fakeId, title: 'Formation Angular', type: 'TRAINING', status: 'ASSIGNED', notificationRead: false }
    ],
    comparePassword: jest.fn().mockResolvedValue(true),
    save: jest.fn().mockResolvedValue(true),
    toObject: jest.fn(function () { return { ...this }; }),
    ...data
  };
  doc._id = doc._id || fakeId;
  return doc;
}

function makeQuery(result) {
  const q = {};
  q.populate = jest.fn().mockReturnValue(q);
  q.sort = jest.fn().mockReturnValue(q);
  q.select = jest.fn().mockReturnValue(q);
  q.limit = jest.fn().mockReturnValue(q);
  q.skip = jest.fn().mockReturnValue(q);
  q.lean = jest.fn().mockReturnValue(q);
  q.exec = jest.fn().mockResolvedValue(result);
  q.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
  q.catch = (reject) => Promise.resolve(result).catch(reject);
  return q;
}

function makeModel(defaultResult) {
  const Model = jest.fn().mockImplementation((data) => makeDoc(data));
  const one = defaultResult || makeDoc();
  const many = Array.isArray(defaultResult) ? defaultResult : [one];
  Model.create = jest.fn().mockResolvedValue(one);
  Model.find = jest.fn().mockReturnValue(makeQuery(many));
  Model.findOne = jest.fn().mockReturnValue(makeQuery(one));
  Model.findById = jest.fn().mockReturnValue(makeQuery(one));
  Model.findByIdAndUpdate = jest.fn().mockReturnValue(makeQuery(one));
  Model.findByIdAndDelete = jest.fn().mockReturnValue(makeQuery(one));
  Model.updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
  Model.countDocuments = jest.fn().mockResolvedValue(2);
  Model.aggregate = jest.fn().mockResolvedValue([{ _id: null, totalSeats: 4, count: 2 }]);
  return Model;
}

describe('Complete controller and service unit coverage', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  test('AuthController covers register and login', async () => {
    const User = makeModel(makeDoc({ role: 'HR_MANAGER' }));
    User.findOne = jest.fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(makeDoc({ role: 'HR_MANAGER' }));
    User.create = jest.fn().mockResolvedValue(makeDoc({ role: 'HR_MANAGER' }));
    jest.doMock('../models/User', () => User);
    jest.doMock('../models/Session', () => makeModel());
    jest.doMock('jsonwebtoken', () => ({ sign: jest.fn(() => 'token') }));

    const AuthController = require('../controllers/AuthController');

    let res = makeRes();
    await AuthController.register({ body: { email: 'hr@example.com', password: 'pass', firstName: 'HR', role: 'HR_MANAGER' } }, res);
    expect(res.status).toHaveBeenCalledWith(201);

    res = makeRes();
    await AuthController.login({ body: { email: 'hr@example.com', password: 'pass' } }, res);
    expect(res.json).toHaveBeenCalledWith({ accessToken: 'token' });
  });

  test('user controller covers create, list, managers, get, update, delete and password change', async () => {
    const userDoc = makeDoc({ _id: 'u1', email: 'test@example.com' });
    const User = makeModel(userDoc);
    User.findOne = jest.fn().mockResolvedValue(null);
    jest.doMock('../models/User', () => User);
    jest.doMock('../services/emailService', () => jest.fn().mockResolvedValue(true));
    const ctrl = require('../controllers/user.controller');

    let res = makeRes();
    await ctrl.createUser({ body: { email: 'test@example.com', firstName: 'Test', role: 'EMPLOYEE' } }, res);
    expect(res.status).toHaveBeenCalledWith(201);

    res = makeRes();
    await ctrl.getUsers({}, res);
    expect(res.json).toHaveBeenCalled();

    res = makeRes();
    await ctrl.getManagers({}, res);
    expect(res.json).toHaveBeenCalled();

    res = makeRes();
    await ctrl.getUserById({ params: { id: 'u1' } }, res);
    expect(res.json).toHaveBeenCalled();

    res = makeRes();
    await ctrl.updateUser({ params: { id: 'u1' }, body: { firstName: 'Updated' } }, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Utilisateur mis à jour' }));

    res = makeRes();
    await ctrl.deleteUser({ params: { id: 'u1' } }, res);
    expect(res.json).toHaveBeenCalledWith({ message: 'Utilisateur désactivé' });

    res = makeRes();
    await ctrl.changePassword({ user: { id: 'u1' }, body: { newPassword: '123456' } }, res);
    expect(res.json).toHaveBeenCalledWith({ message: 'Mot de passe changé' });
  });

  test('activity controller covers recommendation workflow and CRUD', async () => {
    const activityDoc = makeDoc({ _id: fakeId });
    const Activity = makeModel(activityDoc);
    const Employee = makeModel([makeDoc({ _id: 'e1' }), makeDoc({ _id: 'e2' })]);
    const Notification = makeModel();
    jest.doMock('../models/Activity', () => Activity);
    jest.doMock('../models/User', () => makeModel());
    jest.doMock('../models/Employee', () => Employee);
    jest.doMock('../models/Notification', () => Notification);
    const ctrl = require('../controllers/activity.controller');

    const reqBase = { params: { activityId: fakeId, id: fakeId }, body: {}, user: { _id: 'u1', role: 'HR_MANAGER' } };

    let res = makeRes();
    await ctrl.recommendEmployees(reqBase, res);
    expect(res.json).toHaveBeenCalled();

    res = makeRes();
    await ctrl.updateRecommendations({ ...reqBase, body: { recommendedEmployees: [] } }, res);
    expect(res.json).toHaveBeenCalled();

    res = makeRes();
    await ctrl.forwardToManager({ ...reqBase, body: { managerId: 'm1' } }, res);
    expect(Notification.create).toHaveBeenCalled();

    res = makeRes();
    await ctrl.confirmParticipants({ ...reqBase, body: { selectedEmployees: ['u1'] } }, res);
    expect(res.json).toHaveBeenCalled();

    res = makeRes();
    await ctrl.respondToInvitation({ params: { activityId: fakeId }, body: { status: 'ACCEPTED', justification: '' }, user: { _id: 'u1' } }, res);
    expect(res.json).toHaveBeenCalled();

    res = makeRes();
    await ctrl.getMyActivities({ user: { _id: 'u1', role: 'EMPLOYEE' } }, res);
    expect(res.json).toHaveBeenCalled();

    res = makeRes();
    await ctrl.createActivity({ body: { title: 'A', startDate: '2026-01-01', endDate: '2026-01-02', requiredSkills: [{ name: 'Angular', type: 'savoir-faire', desiredLevel: 'élevé' }] }, user: { _id: 'u1' } }, res);
    expect(res.status).toHaveBeenCalledWith(201);

    res = makeRes();
    await ctrl.getActivities({}, res);
    expect(res.json).toHaveBeenCalled();

    res = makeRes();
    await ctrl.getActivityById({ params: { id: fakeId } }, res);
    expect(res.json).toHaveBeenCalled();

    res = makeRes();
    await ctrl.updateActivity({ params: { id: fakeId }, body: { title: 'B' } }, res);
    expect(res.json).toHaveBeenCalled();

    res = makeRes();
    await ctrl.deleteActivity({ params: { id: fakeId } }, res);
    expect(res.json).toHaveBeenCalledWith({ message: 'Activity deleted' });
  });

  test('evaluation message controller covers create, list and read', async () => {
    const EvaluationMessage = makeModel(makeDoc({ _id: 'msg1' }));
    jest.doMock('../models/EvaluationMessage', () => EvaluationMessage);
    const ctrl = require('../controllers/evaluationMessage.controller');

    let res = makeRes();
    await ctrl.createEvaluationMessage({ body: { employeeEmail: 'ali@example.com', activityTitle: 'A', note: 4 } }, res);
    expect(res.status).toHaveBeenCalledWith(201);

    res = makeRes();
    await ctrl.getEmployeeEvaluationMessages({ params: { identifier: encodeURIComponent('ali@example.com') } }, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));

    res = makeRes();
    await ctrl.markEvaluationMessageAsRead({ params: { id: 'msg1' } }, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('dashboard controller covers stats, targets, evaluation, responses and received evaluations', async () => {
    const activity = makeDoc({ _id: fakeId });
    const Activity = makeModel(activity);
    const User = makeModel(makeDoc({ _id: 'u1' }));
    const Employee = makeModel(makeDoc({ _id: 'e1' }));
    jest.doMock('../models/Activity', () => Activity);
    jest.doMock('../models/User', () => User);
    jest.doMock('../models/Employee', () => Employee);
    const ctrl = require('../controllers/dashboard.controller');

    let res = makeRes();
    await ctrl.getGlobalStats({}, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ users: expect.any(Object), activities: expect.any(Object) }));

    res = makeRes();
    await ctrl.getManagerEvaluationTargets({}, res);
    expect(res.json).toHaveBeenCalled();

    res = makeRes();
    await ctrl.evaluateEmployee({ body: { activityId: fakeId, userId: 'u1', employeeId: 'e1', score: 5, comment: 'Good' }, user: { _id: 'm1' } }, res);
    expect(res.json).toHaveBeenCalledWith({ message: 'Évaluation enregistrée avec succès.' });

    res = makeRes();
    await ctrl.getEmployeeResponses({}, res);
    expect(res.json).toHaveBeenCalled();

    res = makeRes();
    await ctrl.getEmployeeReceivedEvaluations({ user: { _id: 'u1', email: 'ali@example.com' } }, res);
    expect(res.json).toHaveBeenCalled();
  });

  test('notification controller covers employee notification helper endpoints', async () => {
    const Activity = makeModel(makeDoc({ _id: fakeId }));
    const Employee = makeModel(makeDoc({ _id: 'e1' }));
    const User = makeModel(makeDoc({ _id: 'u1' }));
    jest.doMock('../models/Activity', () => Activity);
    jest.doMock('../models/Employee', () => Employee);
    jest.doMock('../models/User', () => User);
    jest.doMock('bcryptjs', () => ({ hash: jest.fn().mockResolvedValue('hashed') }));
    jest.doMock('../services/emailNotification.service', () => ({
      sendActivityEmail: jest.fn().mockResolvedValue({ messageId: 'a1' }),
      sendResponseEmail: jest.fn().mockResolvedValue({ messageId: 'r1' })
    }));
    const ctrl = require('../controllers/notification.controller');

    let res = makeRes();
    await ctrl.confirmRecommendations({ body: { activityId: fakeId, employees: [{ csvEmployeeId: 1, name: 'Ali Ben Ali', email: 'ali@example.com', score: 90 }] }, user: { firstName: 'HR', lastName: 'Manager' } }, res);
    expect(res.json).toHaveBeenCalled();

    res = makeRes();
    await ctrl.getMyActivities({ user: { _id: 'u1', email: 'ali@example.com', assignedActivities: [makeDoc().assignedActivities[0]] } }, res);
    expect(res.json).toHaveBeenCalled();

    res = makeRes();
    await ctrl.getMyNotifications({ user: { _id: 'u1', email: 'ali@example.com', assignedActivities: [makeDoc().assignedActivities[0]] } }, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ notifications: expect.any(Array) }));

    res = makeRes();
    await ctrl.markAsRead({ params: { id: fakeId }, user: makeDoc({ _id: 'u1' }) }, res);
    expect(res.json).toHaveBeenCalled();

    res = makeRes();
    await ctrl.markAllAsRead({ user: makeDoc({ _id: 'u1' }) }, res);
    expect(res.json).toHaveBeenCalled();

    res = makeRes();
    await ctrl.respondToActivity({ body: { activityId: fakeId, status: 'ACCEPTED' }, user: makeDoc({ _id: 'u1' }) }, res);
    expect(res.json).toHaveBeenCalled();

    res = makeRes();
    await ctrl.completeActivity({ body: { activityId: fakeId }, user: makeDoc({ _id: 'u1' }) }, res);
    expect(res.json).toHaveBeenCalled();

    res = makeRes();
    await ctrl.getPendingTrainings({ user: makeDoc({ _id: 'u1' }) }, res);
    expect(res.json).toHaveBeenCalled();

    res = makeRes();
    await ctrl.getManagerApprovals({}, res);
    expect(res.json).toHaveBeenCalledWith([]);

    res = makeRes();
    await ctrl.handleApproval({}, res);
    expect(res.json).toHaveBeenCalled();
  });

  test('recommendation and chat controllers cover ML service success path', async () => {
    const Activity = makeModel(makeDoc({ _id: fakeId, seats: 2 }));
    const Employee = makeModel(makeDoc({ _id: 'e1', csvEmployeeId: 1 }));
    const User = makeModel(makeDoc({ _id: 'u1' }));
    jest.doMock('../models/Activity', () => Activity);
    jest.doMock('../models/Employee', () => Employee);
    jest.doMock('../models/User', () => User);
    jest.doMock('axios', () => ({
      post: jest.fn().mockResolvedValue({
        data: {
          employees: [{ id: 1, name: 'Ali Ben Ali', email: 'ali@example.com', score: 92, skill_coverage: 0.9, role_similarity: 0.8 }],
          ai_justification: 'good match',
          target_skills: ['Angular'],
          target_roles: ['Developer']
        }
      })
    }));

    const recommendationCtrl = require('../controllers/recommendation.controller');
    let res = makeRes();
    await recommendationCtrl.recommendEmployees({ params: { activityId: fakeId }, body: { prompt: 'recommend' } }, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ recommendations: expect.any(Array) }));

    jest.resetModules();
    jest.doMock('../models/Activity', () => Activity);
    jest.doMock('axios', () => ({
      post: jest.fn().mockResolvedValue({ data: { employees: [{ name: 'Ali' }], ai_justification: 'ok' } })
    }));
    const chatCtrl = require('../controllers/chatActivityRecommendation.controller');
    res = makeRes();
    await chatCtrl.analyzeExistingActivityFromChat({ body: { prompt: 'je veux 1 employés pour activité Formation Angular' } }, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ returned_count: 1 }));
  });

  test('optimization and scoring controllers cover scoring paths', async () => {
    const Activity = makeModel(makeDoc({ _id: fakeId }));
    const employeeDoc = makeDoc({ _id: 'e1' });
    const Employee = makeModel([employeeDoc, makeDoc({ _id: 'e2', firstName: 'Sarra' })]);
    Employee.findById = jest.fn().mockReturnValue(makeQuery(employeeDoc));
    jest.doMock('../models/Activity', () => Activity);
    jest.doMock('../models/Employee', () => Employee);
    const scoring = require('../controllers/scoring.controller');

    let res = makeRes();
    await scoring.calculateEmployeeScore({ params: { employeeId: 'e1' } }, res);
    expect(res.json).toHaveBeenCalled();

    res = makeRes();
    await scoring.scoreEmployeeForActivity({ params: { employeeId: 'e1', activityId: fakeId } }, res);
    expect(res.json).toHaveBeenCalled();

    res = makeRes();
    await scoring.updateScoreAfterParticipation({ params: { employeeId: 'e1' }, body: { activityId: fakeId, rating: 5, skillsGained: [{ skill: 'Angular', scoreDelta: 5 }] } }, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Scores mis à jour' }));

    res = makeRes();
    await scoring.recalculateAllScores({}, res);
    expect(res.json).toHaveBeenCalled();

    res = makeRes();
    await scoring.getLeaderboard({ query: { limit: '5', department: 'IT' } }, res);
    expect(res.json).toHaveBeenCalled();

    const result = scoring.computeActivityScore(makeDoc(), makeDoc());
    expect(result).toHaveProperty('activityScore');

    const optimization = require('../controllers/optimization.controller');
    res = makeRes();
    await optimization.optimizeSelection({ params: { activityId: fakeId }, body: {} }, res);
    expect(res.json).toHaveBeenCalled();

    res = makeRes();
    await optimization.simulateWeights({ params: { activityId: fakeId }, body: { scenarios: [{ name: 'default' }] } }, res);
    expect(res.json).toHaveBeenCalled();

    res = makeRes();
    await optimization.analyzeGaps({ params: { activityId: fakeId } }, res);
    expect(res.json).toHaveBeenCalled();
  });

  test('remaining services cover email notification, embeddings and NLP', async () => {
    jest.resetModules();
    jest.dontMock('../services/emailNotification.service');
    jest.unmock('../services/emailNotification.service');
    const sendMail = jest.fn().mockResolvedValue({ messageId: 'mail1' });
    jest.doMock('nodemailer', () => ({
      createTransport: jest.fn(() => ({
        verify: jest.fn((cb) => cb(null)),
        sendMail
      }))
    }));
    const emailNotification = require('../services/emailNotification.service');
    await emailNotification.sendActivityEmail({ to: 'ali@example.com', employeeName: 'Ali', activityTitle: 'Formation' });
    await emailNotification.sendResponseEmail({ to: 'hr@example.com', employeeName: 'Ali', activityTitle: 'Formation', accepted: true });
    expect(sendMail).toHaveBeenCalledTimes(2);

    jest.resetModules();
    const embeddingCreate = jest.fn().mockResolvedValue({ data: [{ embedding: [0.1, 0.2, 0.3] }] });
    jest.doMock('openai', () => jest.fn().mockImplementation(() => ({ embeddings: { create: embeddingCreate } })));
    const embedding = require('../services/embedding.service');
    await expect(embedding.getEmbedding('hello')).resolves.toEqual([0.1, 0.2, 0.3]);

    jest.resetModules();
    jest.doMock('compromise', () => jest.fn(() => ({ nouns: () => ({ out: () => ['Angular', 'Node'] }) })));
    const nlp = require('../services/nlp.service');
    expect(nlp.extractKeywords('Angular and Node developer')).toEqual(['Angular', 'Node']);
  });
});
