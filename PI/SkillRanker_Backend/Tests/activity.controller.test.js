jest.mock('../models/Activity', () => ({
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
}));

jest.mock('../models/User', () => ({}));

jest.mock('../models/Employee', () => ({
  find: jest.fn(),
}));

jest.mock('../models/Notification', () => ({
  create: jest.fn(),
}));

const Activity = require('../models/Activity');
const Employee = require('../models/Employee');
const Notification = require('../models/Notification');

const controller = require('../controllers/activity.controller');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockReq = (overrides = {}) => ({
  params: {},
  body: {},
  user: { _id: 'user123', role: 'HR_MANAGER' },
  ...overrides,
});

const mockPopulateQuery = (result) => ({
  populate: jest.fn().mockResolvedValue(result),
});

const mockMultiPopulateSortQuery = (result) => ({
  populate: jest.fn().mockReturnThis(),
  sort: jest.fn().mockResolvedValue(result),
});

describe('activity.controller.test.js', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('recommendEmployees', () => {
    it('should recommend employees successfully', async () => {
      const activity = {
        _id: 'activity1',
        title: 'Backend Training',
        save: jest.fn().mockResolvedValue(true),
      };

      Activity.findById.mockReturnValue(mockPopulateQuery(activity));

      Employee.find.mockResolvedValue([
        { _id: 'emp1', skills: ['node', 'mongo'] },
        { _id: 'emp2', skills: [] },
        { _id: 'emp3', skills: ['angular'] },
        { _id: 'emp4', skills: ['java'] },
        { _id: 'emp5', skills: ['python'] },
        { _id: 'emp6', skills: ['devops'] },
      ]);

      jest.spyOn(Math, 'random').mockReturnValue(0.5);

      const req = mockReq({
        params: { activityId: 'activity1' },
      });
      const res = mockRes();

      await controller.recommendEmployees(req, res);

      expect(Activity.findById).toHaveBeenCalledWith('activity1');
      expect(Employee.find).toHaveBeenCalled();
      expect(activity.recommendedEmployees).toHaveLength(5);
      expect(activity.status).toBe('ai_recommended');
      expect(activity.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(activity);

      Math.random.mockRestore();
    });

    it('should return 404 when activity not found', async () => {
      Activity.findById.mockReturnValue(mockPopulateQuery(null));

      const req = mockReq({
        params: { activityId: 'missing' },
      });
      const res = mockRes();

      await controller.recommendEmployees(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Activity not found' });
    });

    it('should return 500 on error', async () => {
      Activity.findById.mockImplementation(() => {
        throw new Error('DB error');
      });

      const req = mockReq({
        params: { activityId: 'activity1' },
      });
      const res = mockRes();

      await controller.recommendEmployees(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'DB error' });
    });
  });

  describe('updateRecommendations', () => {
    it('should update recommendations successfully', async () => {
      const activity = {
        _id: 'activity1',
        status: 'hr_reviewed',
      };

      Activity.findByIdAndUpdate.mockReturnValue(mockPopulateQuery(activity));

      const req = mockReq({
        params: { activityId: 'activity1' },
        body: {
          recommendedEmployees: [
            { employee: 'emp1', score: 4.5, reason: 'Good match' },
          ],
        },
      });
      const res = mockRes();

      await controller.updateRecommendations(req, res);

      expect(Activity.findByIdAndUpdate).toHaveBeenCalledWith(
        'activity1',
        {
          recommendedEmployees: req.body.recommendedEmployees,
          status: 'hr_reviewed',
        },
        { new: true }
      );

      expect(res.json).toHaveBeenCalledWith(activity);
    });

    it('should return 404 when activity not found', async () => {
      Activity.findByIdAndUpdate.mockReturnValue(mockPopulateQuery(null));

      const req = mockReq({
        params: { activityId: 'missing' },
        body: { recommendedEmployees: [] },
      });
      const res = mockRes();

      await controller.updateRecommendations(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Activity not found' });
    });

    it('should return 500 on error', async () => {
      Activity.findByIdAndUpdate.mockImplementation(() => {
        throw new Error('Update failed');
      });

      const req = mockReq({
        params: { activityId: 'activity1' },
        body: { recommendedEmployees: [] },
      });
      const res = mockRes();

      await controller.updateRecommendations(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Update failed' });
    });
  });

  describe('forwardToManager', () => {
    it('should forward activity to manager and create notification', async () => {
      const activity = {
        _id: 'activity1',
        title: 'Frontend Training',
      };

      Activity.findByIdAndUpdate.mockResolvedValue(activity);
      Notification.create.mockResolvedValue({});

      const req = mockReq({
        params: { activityId: 'activity1' },
        body: { managerId: 'manager1' },
      });
      const res = mockRes();

      await controller.forwardToManager(req, res);

      expect(Activity.findByIdAndUpdate).toHaveBeenCalledWith(
        'activity1',
        {
          assignedManager: 'manager1',
          status: 'manager_reviewed',
        },
        { new: true }
      );

      expect(Notification.create).toHaveBeenCalledWith({
        userId: 'manager1',
        title: 'Activité à confirmer',
        message: "Vous avez une nouvelle activité à confirmer: 'Frontend Training'.",
      });

      expect(res.json).toHaveBeenCalledWith(activity);
    });

    it('should return 404 when activity not found', async () => {
      Activity.findByIdAndUpdate.mockResolvedValue(null);

      const req = mockReq({
        params: { activityId: 'missing' },
        body: { managerId: 'manager1' },
      });
      const res = mockRes();

      await controller.forwardToManager(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Activity not found' });
    });

    it('should return 500 on error', async () => {
      Activity.findByIdAndUpdate.mockRejectedValue(new Error('Forward failed'));

      const req = mockReq({
        params: { activityId: 'activity1' },
        body: { managerId: 'manager1' },
      });
      const res = mockRes();

      await controller.forwardToManager(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Forward failed' });
    });
  });

  describe('confirmParticipants', () => {
    it('should confirm participants and notify employees', async () => {
      const activity = {
        _id: 'activity1',
        title: 'Node Training',
        selectedEmployees: [
          { employee: { _id: 'emp1' } },
          { employee: { _id: 'emp2' } },
        ],
      };

      Activity.findByIdAndUpdate.mockReturnValue(mockPopulateQuery(activity));
      Notification.create.mockResolvedValue({});

      const req = mockReq({
        params: { activityId: 'activity1' },
        user: { _id: 'manager1', role: 'MANAGER' },
        body: {
          selectedEmployees: ['emp1', 'emp2'],
        },
      });
      const res = mockRes();

      await controller.confirmParticipants(req, res);

      expect(Activity.findByIdAndUpdate).toHaveBeenCalledWith(
        'activity1',
        expect.objectContaining({
          selectedEmployees: [
            { employee: 'emp1' },
            { employee: 'emp2' },
          ],
          status: 'confirmed',
          finalConfirmationBy: 'manager1',
          finalConfirmationDate: expect.any(Date),
        }),
        { new: true }
      );

      expect(Notification.create).toHaveBeenCalledTimes(2);
      expect(res.json).toHaveBeenCalledWith(activity);
    });

    it('should return 404 when activity not found', async () => {
      Activity.findByIdAndUpdate.mockReturnValue(mockPopulateQuery(null));

      const req = mockReq({
        params: { activityId: 'missing' },
        user: { _id: 'manager1' },
        body: { selectedEmployees: ['emp1'] },
      });
      const res = mockRes();

      await controller.confirmParticipants(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Activity not found' });
    });

    it('should return 500 on error', async () => {
      Activity.findByIdAndUpdate.mockImplementation(() => {
        throw new Error('Confirm failed');
      });

      const req = mockReq({
        params: { activityId: 'activity1' },
        body: { selectedEmployees: ['emp1'] },
      });
      const res = mockRes();

      await controller.confirmParticipants(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Confirm failed' });
    });
  });

  describe('respondToInvitation', () => {
    it('should update employee response with justification', async () => {
      const activity = {
        _id: 'activity1',
        selectedEmployees: [
          {
            employee: {
              toString: () => 'emp1',
            },
          },
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      Activity.findById.mockResolvedValue(activity);

      const req = mockReq({
        params: { activityId: 'activity1' },
        user: {
          _id: {
            toString: () => 'emp1',
          },
          role: 'EMPLOYEE',
        },
        body: {
          status: 'DECLINED',
          justification: 'Not available',
        },
      });
      const res = mockRes();

      await controller.respondToInvitation(req, res);

      expect(activity.selectedEmployees[0].status).toBe('DECLINED');
      expect(activity.selectedEmployees[0].responseDate).toEqual(expect.any(Date));
      expect(activity.selectedEmployees[0].justification).toBe('Not available');
      expect(activity.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(activity);
    });

    it('should update employee response without justification', async () => {
      const activity = {
        _id: 'activity1',
        selectedEmployees: [
          {
            employee: {
              toString: () => 'emp1',
            },
          },
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      Activity.findById.mockResolvedValue(activity);

      const req = mockReq({
        params: { activityId: 'activity1' },
        user: {
          _id: {
            toString: () => 'emp1',
          },
          role: 'EMPLOYEE',
        },
        body: {
          status: 'ACCEPTED',
        },
      });
      const res = mockRes();

      await controller.respondToInvitation(req, res);

      expect(activity.selectedEmployees[0].status).toBe('ACCEPTED');
      expect(activity.selectedEmployees[0].justification).toBeUndefined();
      expect(activity.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(activity);
    });

    it('should return 404 when activity not found', async () => {
      Activity.findById.mockResolvedValue(null);

      const req = mockReq({
        params: { activityId: 'missing' },
      });
      const res = mockRes();

      await controller.respondToInvitation(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Activity not found' });
    });

    it('should return 404 when employee not in selected list', async () => {
      const activity = {
        selectedEmployees: [
          {
            employee: {
              toString: () => 'anotherEmployee',
            },
          },
        ],
      };

      Activity.findById.mockResolvedValue(activity);

      const req = mockReq({
        params: { activityId: 'activity1' },
        user: {
          _id: {
            toString: () => 'emp1',
          },
        },
        body: {
          status: 'ACCEPTED',
        },
      });
      const res = mockRes();

      await controller.respondToInvitation(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Employee not in selected list',
      });
    });

    it('should return 500 on error', async () => {
      Activity.findById.mockRejectedValue(new Error('Response failed'));

      const req = mockReq({
        params: { activityId: 'activity1' },
      });
      const res = mockRes();

      await controller.respondToInvitation(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Response failed' });
    });
  });

  describe('getMyActivities', () => {
    it('should get activities for HR_MANAGER', async () => {
      const activities = [{ _id: 'activity1' }];
      Activity.find.mockReturnValue(mockMultiPopulateSortQuery(activities));

      const req = mockReq({
        user: { _id: 'hr1', role: 'HR_MANAGER' },
      });
      const res = mockRes();

      await controller.getMyActivities(req, res);

      expect(Activity.find).toHaveBeenCalledWith({ createdBy: 'hr1' });
      expect(res.json).toHaveBeenCalledWith(activities);
    });

    it('should get activities for MANAGER', async () => {
      const activities = [{ _id: 'activity1' }];
      Activity.find.mockReturnValue(mockMultiPopulateSortQuery(activities));

      const req = mockReq({
        user: { _id: 'manager1', role: 'MANAGER' },
      });
      const res = mockRes();

      await controller.getMyActivities(req, res);

      expect(Activity.find).toHaveBeenCalledWith({ assignedManager: 'manager1' });
      expect(res.json).toHaveBeenCalledWith(activities);
    });

    it('should get activities for EMPLOYEE', async () => {
      const activities = [{ _id: 'activity1' }];
      Activity.find.mockReturnValue(mockMultiPopulateSortQuery(activities));

      const req = mockReq({
        user: { _id: 'emp1', role: 'EMPLOYEE' },
      });
      const res = mockRes();

      await controller.getMyActivities(req, res);

      expect(Activity.find).toHaveBeenCalledWith({
        'selectedEmployees.employee': 'emp1',
      });
      expect(res.json).toHaveBeenCalledWith(activities);
    });

    it('should get all activities for other role', async () => {
      const activities = [{ _id: 'activity1' }];
      Activity.find.mockReturnValue(mockMultiPopulateSortQuery(activities));

      const req = mockReq({
        user: { _id: 'admin1', role: 'ADMINISTRATOR' },
      });
      const res = mockRes();

      await controller.getMyActivities(req, res);

      expect(Activity.find).toHaveBeenCalledWith({});
      expect(res.json).toHaveBeenCalledWith(activities);
    });

    it('should return 500 on error', async () => {
      Activity.find.mockImplementation(() => {
        throw new Error('Get my activities failed');
      });

      const req = mockReq({
        user: { _id: 'hr1', role: 'HR_MANAGER' },
      });
      const res = mockRes();

      await controller.getMyActivities(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Get my activities failed',
      });
    });
  });

  describe('createActivity', () => {
    it('should create activity and normalize skills', async () => {
      const activity = {
        _id: 'activity1',
        title: 'Backend',
      };

      Activity.create.mockResolvedValue(activity);
      Notification.create.mockResolvedValue({});

      const req = mockReq({
        user: { _id: 'hr1', role: 'HR_MANAGER' },
        body: {
          title: 'Backend',
          startDate: '2026-05-10',
          endDate: '2026-05-15',
          requiredSkills: [
            {
              name: 'Node',
              type: 'savoir-faire',
              desiredLevel: 'élevé',
            },
            {
              name: 'Communication',
              type: 'savoir-être',
              desiredLevel: 'moyen',
            },
          ],
        },
      });
      const res = mockRes();

      await controller.createActivity(req, res);

      expect(Activity.create).toHaveBeenCalledWith({
        title: 'Backend',
        startDate: '2026-05-10',
        endDate: '2026-05-15',
        requiredSkills: [
          {
            name: 'Node',
            type: 'KNOW_HOW',
            desiredLevel: 'HIGH',
          },
          {
            name: 'Communication',
            type: 'SOFT_SKILL',
            desiredLevel: 'MEDIUM',
          },
        ],
        createdBy: 'hr1',
      });

      expect(Notification.create).toHaveBeenCalledWith({
        userId: 'hr1',
        title: 'Activité créée',
        message: "Activité 'Backend' créée avec succès.",
      });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(activity);
    });

    it('should return 400 when startDate is invalid', async () => {
      const req = mockReq({
        body: {
          startDate: 'invalid-date',
          endDate: '2026-05-15',
        },
      });
      const res = mockRes();

      await controller.createActivity(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'La date de début est invalide.',
      });
    });

    it('should return 400 when endDate is invalid', async () => {
      const req = mockReq({
        body: {
          startDate: '2026-05-10',
          endDate: 'invalid-date',
        },
      });
      const res = mockRes();

      await controller.createActivity(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'La date de fin est invalide.',
      });
    });

    it('should return 400 when endDate is before startDate', async () => {
      const req = mockReq({
        body: {
          startDate: '2026-05-15',
          endDate: '2026-05-10',
        },
      });
      const res = mockRes();

      await controller.createActivity(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'La date de fin doit être postérieure à la date de début.',
      });
    });

    it('should return 400 on mongoose validation error', async () => {
      const error = new Error('Validation failed');
      error.name = 'ValidationError';
      error.errors = {
        title: { message: 'Title is required' },
        type: { message: 'Type is required' },
      };

      Activity.create.mockRejectedValue(error);

      const req = mockReq({
        body: {
          title: '',
          startDate: '2026-05-10',
          endDate: '2026-05-15',
          requiredSkills: [],
        },
      });
      const res = mockRes();

      await controller.createActivity(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Title is required, Type is required',
      });
    });

    it('should return 500 on general error', async () => {
      Activity.create.mockRejectedValue(new Error('Create failed'));

      const req = mockReq({
        body: {
          title: 'Backend',
          startDate: '2026-05-10',
          endDate: '2026-05-15',
        },
      });
      const res = mockRes();

      await controller.createActivity(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Create failed' });
    });
  });

  describe('getActivities', () => {
    it('should return all activities', async () => {
      const activities = [{ _id: 'activity1' }, { _id: 'activity2' }];
      Activity.find.mockResolvedValue(activities);

      const req = mockReq();
      const res = mockRes();

      await controller.getActivities(req, res);

      expect(Activity.find).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(activities);
    });

    it('should return 500 on error', async () => {
      Activity.find.mockRejectedValue(new Error('Find failed'));

      const req = mockReq();
      const res = mockRes();

      await controller.getActivities(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Find failed' });
    });
  });

  describe('getActivityById', () => {
    it('should return activity by id', async () => {
      const activity = { _id: 'activity1' };
      Activity.findById.mockResolvedValue(activity);

      const req = mockReq({
        params: { id: 'activity1' },
      });
      const res = mockRes();

      await controller.getActivityById(req, res);

      expect(Activity.findById).toHaveBeenCalledWith('activity1');
      expect(res.json).toHaveBeenCalledWith(activity);
    });

    it('should return 404 when activity not found', async () => {
      Activity.findById.mockResolvedValue(null);

      const req = mockReq({
        params: { id: 'missing' },
      });
      const res = mockRes();

      await controller.getActivityById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Activity not found' });
    });

    it('should return 500 on error', async () => {
      Activity.findById.mockRejectedValue(new Error('Find by id failed'));

      const req = mockReq({
        params: { id: 'activity1' },
      });
      const res = mockRes();

      await controller.getActivityById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Find by id failed',
      });
    });
  });

  describe('updateActivity', () => {
    it('should update activity and normalize skills', async () => {
      const activity = {
        _id: 'activity1',
        title: 'Updated Activity',
      };

      Activity.findByIdAndUpdate.mockResolvedValue(activity);

      const req = mockReq({
        params: { id: 'activity1' },
        body: {
          title: 'Updated Activity',
          startDate: '2026-06-01',
          endDate: '2026-06-05',
          requiredSkills: [
            {
              name: 'JavaScript',
              type: 'knowledge',
              desiredLevel: 'expert',
            },
          ],
        },
      });
      const res = mockRes();

      await controller.updateActivity(req, res);

      expect(Activity.findByIdAndUpdate).toHaveBeenCalledWith(
        'activity1',
        {
          title: 'Updated Activity',
          startDate: '2026-06-01',
          endDate: '2026-06-05',
          requiredSkills: [
            {
              name: 'JavaScript',
              type: 'KNOWLEDGE',
              desiredLevel: 'EXPERT',
            },
          ],
        },
        {
          new: true,
          runValidators: true,
        }
      );

      expect(res.json).toHaveBeenCalledWith(activity);
    });

    it('should update activity without optional fields', async () => {
      const activity = {
        _id: 'activity1',
        title: 'Only Title',
      };

      Activity.findByIdAndUpdate.mockResolvedValue(activity);

      const req = mockReq({
        params: { id: 'activity1' },
        body: {
          title: 'Only Title',
        },
      });
      const res = mockRes();

      await controller.updateActivity(req, res);

      expect(Activity.findByIdAndUpdate).toHaveBeenCalledWith(
        'activity1',
        {
          title: 'Only Title',
        },
        {
          new: true,
          runValidators: true,
        }
      );

      expect(res.json).toHaveBeenCalledWith(activity);
    });

    it('should return 400 when endDate is before startDate', async () => {
      const req = mockReq({
        params: { id: 'activity1' },
        body: {
          startDate: '2026-06-10',
          endDate: '2026-06-01',
        },
      });
      const res = mockRes();

      await controller.updateActivity(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'La date de fin doit être postérieure à la date de début.',
      });
    });

    it('should not block update when dates are invalid strings', async () => {
      const activity = {
        _id: 'activity1',
      };

      Activity.findByIdAndUpdate.mockResolvedValue(activity);

      const req = mockReq({
        params: { id: 'activity1' },
        body: {
          startDate: 'bad-date',
          endDate: 'also-bad-date',
        },
      });
      const res = mockRes();

      await controller.updateActivity(req, res);

      expect(Activity.findByIdAndUpdate).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(activity);
    });

    it('should return 404 when activity not found', async () => {
      Activity.findByIdAndUpdate.mockResolvedValue(null);

      const req = mockReq({
        params: { id: 'missing' },
        body: {
          title: 'Missing',
        },
      });
      const res = mockRes();

      await controller.updateActivity(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Activity not found' });
    });

    it('should return 400 on validation error', async () => {
      const error = new Error('Validation failed');
      error.name = 'ValidationError';
      error.errors = {
        title: { message: 'Title is invalid' },
      };

      Activity.findByIdAndUpdate.mockRejectedValue(error);

      const req = mockReq({
        params: { id: 'activity1' },
        body: {
          title: '',
        },
      });
      const res = mockRes();

      await controller.updateActivity(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Title is invalid',
      });
    });

    it('should return 500 on general error', async () => {
      Activity.findByIdAndUpdate.mockRejectedValue(new Error('Update failed'));

      const req = mockReq({
        params: { id: 'activity1' },
        body: {
          title: 'Backend',
        },
      });
      const res = mockRes();

      await controller.updateActivity(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Update failed',
      });
    });
  });

  describe('deleteActivity', () => {
    it('should delete activity successfully', async () => {
      const activity = {
        _id: 'activity1',
      };

      Activity.findByIdAndDelete.mockResolvedValue(activity);

      const req = mockReq({
        params: { id: 'activity1' },
      });
      const res = mockRes();

      await controller.deleteActivity(req, res);

      expect(Activity.findByIdAndDelete).toHaveBeenCalledWith('activity1');
      expect(res.json).toHaveBeenCalledWith({
        message: 'Activity deleted',
      });
    });

    it('should return 404 when activity not found', async () => {
      Activity.findByIdAndDelete.mockResolvedValue(null);

      const req = mockReq({
        params: { id: 'missing' },
      });
      const res = mockRes();

      await controller.deleteActivity(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Activity not found',
      });
    });

    it('should return 500 on error', async () => {
      Activity.findByIdAndDelete.mockRejectedValue(new Error('Delete failed'));

      const req = mockReq({
        params: { id: 'activity1' },
      });
      const res = mockRes();

      await controller.deleteActivity(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Delete failed',
      });
    });
  });
});