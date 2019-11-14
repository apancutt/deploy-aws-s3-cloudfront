const log = require('../src/log');

let lastLogOutput, mockExit, mockLog;

beforeAll(() => {
  mockLog = jest.spyOn(console, 'log').mockImplementation((message) => { lastLogOutput = message; });
  mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
});

test('it logs', () => {

  [ 'debug', 'info', 'warn', 'error', 'fatal' ].forEach((level) => {

    const message = `Some ${level} message`;
    log[level](message);

    expect(lastLogOutput).toContain(message);

  });

});

test('it terminates with an exit status', () => {

  log.fatal('Some fatal message', 123);

  expect(mockExit).toHaveBeenCalledWith(123);

});

afterAll(() => {
  lastLogOutput = undefined;
  mockExit.mockRestore();
  mockLog.mockRestore();
});
