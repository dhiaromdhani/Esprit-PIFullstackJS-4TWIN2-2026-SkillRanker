function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const fakeId = '000000000000000000000001';

describe('CRUD controllers unit tests', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  function loadWithMock(controllerPath, modelPath, mockModel) {
    jest.doMock(modelPath, () => mockModel);
    return require(controllerPath);
  }

  test('competence controller: create, list, get, update, delete', async () => {
    const findQuery = { populate: jest.fn() };
    findQuery.populate.mockReturnValueOnce(findQuery).mockResolvedValueOnce([{ name: 'JS' }]);
    const findByIdQuery = { populate: jest.fn() };
    findByIdQuery.populate.mockReturnValueOnce(findByIdQuery).mockResolvedValueOnce({ _id: fakeId, name: 'JS' });
    const Competence = {
      create: jest.fn().mockResolvedValue({ _id: fakeId, name: 'JS' }),
      find: jest.fn().mockReturnValue(findQuery),
      findById: jest.fn().mockReturnValue(findByIdQuery),
      findByIdAndUpdate: jest.fn().mockResolvedValue({ _id: fakeId, name: 'Node' }),
      findByIdAndDelete: jest.fn().mockResolvedValue({ _id: fakeId })
    };
    const ctrl = loadWithMock('../controllers/competence.controller', '../models/Competence', Competence);

    let res = makeRes();
    await ctrl.createCompetence({ body: { name: 'JS' } }, res);
    expect(res.status).toHaveBeenCalledWith(201);

    res = makeRes();
    await ctrl.getCompetences({}, res);
    expect(res.json).toHaveBeenCalledWith([{ name: 'JS' }]);

    res = makeRes();
    await ctrl.getCompetenceById({ params: { id: fakeId } }, res);
    expect(res.json).toHaveBeenCalledWith({ _id: fakeId, name: 'JS' });

    res = makeRes();
    await ctrl.updateCompetence({ params: { id: fakeId }, body: { name: 'Node' } }, res);
    expect(res.json).toHaveBeenCalledWith({ _id: fakeId, name: 'Node' });

    res = makeRes();
    await ctrl.deleteCompetence({ params: { id: fakeId } }, res);
    expect(res.json).toHaveBeenCalledWith({ message: 'Competence deleted' });
  });

  test('department controller: create, list, get not found, update not found, delete', async () => {
    const Department = {
      create: jest.fn().mockResolvedValue({ _id: fakeId, name: 'IT' }),
      find: jest.fn().mockReturnValue({ populate: jest.fn().mockResolvedValue([{ name: 'IT' }]) }),
      findById: jest.fn().mockReturnValue({ populate: jest.fn().mockResolvedValue(null) }),
      findByIdAndUpdate: jest.fn().mockResolvedValue(null),
      findByIdAndDelete: jest.fn().mockResolvedValue({ _id: fakeId })
    };
    const ctrl = loadWithMock('../controllers/department.controller', '../models/Department', Department);

    let res = makeRes();
    await ctrl.createDepartment({ body: { name: 'IT' } }, res);
    expect(res.status).toHaveBeenCalledWith(201);

    res = makeRes();
    await ctrl.getDepartments({}, res);
    expect(res.json).toHaveBeenCalledWith([{ name: 'IT' }]);

    res = makeRes();
    await ctrl.getDepartmentById({ params: { id: fakeId } }, res);
    expect(res.status).toHaveBeenCalledWith(404);

    res = makeRes();
    await ctrl.updateDepartment({ params: { id: fakeId }, body: {} }, res);
    expect(res.status).toHaveBeenCalledWith(404);

    res = makeRes();
    await ctrl.deleteDepartment({ params: { id: fakeId } }, res);
    expect(res.json).toHaveBeenCalledWith({ message: 'Department deleted' });
  });

  test('employee controller: filters and not found branches', async () => {
    const Employee = {
      create: jest.fn().mockResolvedValue({ _id: fakeId, firstName: 'Ali' }),
      find: jest.fn().mockResolvedValue([{ firstName: 'Ali' }]),
      findById: jest.fn().mockResolvedValue(null),
      findByIdAndUpdate: jest.fn().mockResolvedValue(null),
      findByIdAndDelete: jest.fn().mockResolvedValue(null)
    };
    const ctrl = loadWithMock('../controllers/employee.controller', '../models/Employee', Employee);

    let res = makeRes();
    await ctrl.createEmployee({ body: { firstName: 'Ali' } }, res);
    expect(res.status).toHaveBeenCalledWith(201);

    res = makeRes();
    await ctrl.getEmployees({ query: { skills: 'Angular,Node', department: 'IT', jobTitle: 'Dev', name: 'Ali' } }, res);
    expect(Employee.find).toHaveBeenCalledWith(expect.objectContaining({ department: 'IT' }));
    expect(res.json).toHaveBeenCalledWith([{ firstName: 'Ali' }]);

    res = makeRes();
    await ctrl.getEmployeeById({ params: { id: fakeId } }, res);
    expect(res.status).toHaveBeenCalledWith(404);

    res = makeRes();
    await ctrl.updateEmployee({ params: { id: fakeId }, body: {} }, res);
    expect(res.status).toHaveBeenCalledWith(404);

    res = makeRes();
    await ctrl.deleteEmployee({ params: { id: fakeId } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('question competence controller: success and errors', async () => {
    const QuestionCompetence = {
      create: jest.fn().mockResolvedValue({ _id: fakeId, question: 'Q1' }),
      find: jest.fn().mockResolvedValue([{ question: 'Q1' }]),
      findById: jest.fn().mockResolvedValue({ _id: fakeId }),
      findByIdAndUpdate: jest.fn().mockResolvedValue({ _id: fakeId, question: 'Q2' }),
      findByIdAndDelete: jest.fn().mockRejectedValue(new Error('db error'))
    };
    const ctrl = loadWithMock('../controllers/questionCompetence.controller', '../models/QuestionCompetence', QuestionCompetence);

    let res = makeRes();
    await ctrl.createQuestionCompetence({ body: { question: 'Q1' } }, res);
    expect(res.status).toHaveBeenCalledWith(201);

    res = makeRes();
    await ctrl.getQuestionCompetences({}, res);
    expect(res.json).toHaveBeenCalledWith([{ question: 'Q1' }]);

    res = makeRes();
    await ctrl.getQuestionCompetenceById({ params: { id: fakeId } }, res);
    expect(res.json).toHaveBeenCalledWith({ _id: fakeId });

    res = makeRes();
    await ctrl.updateQuestionCompetence({ params: { id: fakeId }, body: { question: 'Q2' } }, res);
    expect(res.json).toHaveBeenCalledWith({ _id: fakeId, question: 'Q2' });

    res = makeRes();
    await ctrl.deleteQuestionCompetence({ params: { id: fakeId } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
