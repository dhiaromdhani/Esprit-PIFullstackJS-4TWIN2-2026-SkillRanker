const controllerCoverage = require('../controllers/coverage.controller');

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Controllers coverage visibility', () => {
  test('coveragePing returns a controller success response', () => {
    const res = makeRes();
    controllerCoverage.coveragePing({}, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, scope: 'controllers' });
  });

  test('coverageHealth returns basic status', () => {
    const res = makeRes();
    controllerCoverage.coverageHealth({ query: {} }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: 'ok' });
  });

  test('coverageHealth returns verbose status', () => {
    const res = makeRes();
    controllerCoverage.coverageHealth({ query: { verbose: 'true' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: 'ok', verbose: true });
  });
});
