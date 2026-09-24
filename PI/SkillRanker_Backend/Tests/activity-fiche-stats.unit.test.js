function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const fakeId = '000000000000000000000001';

describe('Activity request, fiche and stats unit tests', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('activity request controller covers create/list/update/delete', async () => {
    const ActivityRequest = {
      create: jest.fn().mockResolvedValue({ _id: fakeId, activity: { title: 'Formation' }, manager: 'm1', status: 'approved', requestedEmployees: ['e1'] }),
      find: jest.fn().mockReturnValue({ populate: jest.fn().mockResolvedValue([{ _id: fakeId }]) }),
      findByIdAndUpdate: jest.fn().mockResolvedValue({ _id: fakeId, manager: 'm1', status: 'approved', requestedEmployees: ['e1'] }),
      findByIdAndDelete: jest.fn().mockResolvedValue(null)
    };
    const Notification = { create: jest.fn().mockResolvedValue({}) };
    const User = { find: jest.fn().mockResolvedValue([{ _id: 'hr1' }, { _id: 'm1' }]) };
    jest.doMock('../models/ActivityRequest', () => ActivityRequest);
    jest.doMock('../models/Notification', () => Notification);
    jest.doMock('../models/User', () => User);
    const ctrl = require('../controllers/activityRequest.controller');

    let res = makeRes();
    await ctrl.createActivityRequest({ body: { activity: fakeId } }, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(Notification.create).toHaveBeenCalled();

    res = makeRes();
    await ctrl.getActivityRequests({}, res);
    expect(res.json).toHaveBeenCalledWith([{ _id: fakeId }]);

    res = makeRes();
    await ctrl.updateActivityRequest({ params: { id: fakeId }, body: { status: 'approved' } }, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'approved' }));

    res = makeRes();
    await ctrl.deleteActivityRequest({ params: { id: fakeId } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('fiche controller covers create/list/get/update/delete', async () => {
    const Fiche = {
      create: jest.fn().mockResolvedValue({ _id: fakeId, etat: 'open' }),
      find: jest.fn().mockReturnValue({ populate: jest.fn().mockResolvedValue([{ _id: fakeId }]) }),
      findById: jest.fn().mockReturnValue({ populate: jest.fn().mockResolvedValue({ _id: fakeId }) }),
      findByIdAndUpdate: jest.fn().mockResolvedValue(null),
      findByIdAndDelete: jest.fn().mockResolvedValue({ _id: fakeId })
    };
    jest.doMock('../models/Fiche', () => Fiche);
    const ctrl = require('../controllers/fiche.controller');

    let res = makeRes();
    await ctrl.createFiche({ user: { _id: 'u1' }, body: { saisons: [], etat: 'open' } }, res);
    expect(res.status).toHaveBeenCalledWith(201);

    res = makeRes();
    await ctrl.getFiches({}, res);
    expect(res.json).toHaveBeenCalledWith([{ _id: fakeId }]);

    res = makeRes();
    await ctrl.getFicheById({ params: { id: fakeId } }, res);
    expect(res.json).toHaveBeenCalledWith({ _id: fakeId });

    res = makeRes();
    await ctrl.updateFiche({ params: { id: fakeId }, body: {} }, res);
    expect(res.status).toHaveBeenCalledWith(404);

    res = makeRes();
    await ctrl.deleteFiche({ params: { id: fakeId } }, res);
    expect(res.json).toHaveBeenCalledWith({ message: 'Deleted successfully' });
  });

  test('stats controller computes skill and activity stats', async () => {
    const Employee = { find: jest.fn().mockResolvedValue([{ department: 'IT', skills: [{ name: 'Angular' }, { name: 'Node' }] }, { department: 'IT', skills: [{ name: 'Angular' }] }]) };
    const Activity = { find: jest.fn().mockResolvedValue([{ _id: 'a1' }, { _id: 'a2' }]) };
    const RecommendationHistory = { find: jest.fn().mockReturnValue({ populate: jest.fn().mockResolvedValue([{ selectedEmployees: ['e1', 'e2'] }, { selectedEmployees: ['e1'] }]) }) };
    jest.doMock('../models/Employee', () => Employee);
    jest.doMock('../models/Activity', () => Activity);
    jest.doMock('../models/RecommendationHistory', () => RecommendationHistory);
    const ctrl = require('../controllers/stats.controller');

    let res = makeRes();
    await ctrl.getSkillStats({}, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ totalSkills: 2 }));

    res = makeRes();
    await ctrl.getActivityStats({}, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ totalActivities: 2, completedRecommendations: 2 }));
  });
});
