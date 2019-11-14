const { debug, error, fatal, info, warn } = require('../src/log');

describe('log', () => {

  let mockLog;
  let mockExit;

  beforeAll(() => {
    mockLog = jest.spyOn(console, 'log').mockImplementation(jest.fn());
    mockExit = jest.spyOn(process, 'exit').mockImplementation(jest.fn());
  });

  afterAll(() => {
    mockExit.mockRestore();
    mockLog.mockRestore();
  });

  test('it logs', () => {

    [ debug, error, fatal, info, warn ].forEach((level) => {

      const message = `${Math.round(Math.random() * 100000000)}`;
      level(message);

      expect(mockLog.mock.calls.splice(-1)[0][0]).toContain(message);

    });

  });

  test('it terminates with an exit status', () => {

    fatal('Some message', 123);

    expect(mockExit).toHaveBeenCalledWith(123);

  });

});

