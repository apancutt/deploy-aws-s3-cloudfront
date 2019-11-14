const { debug, error, fatal, info, warn } = require('../src/log');

const mockLog = jest.spyOn(console, 'log').mockImplementation(jest.fn());
const mockExit = jest.spyOn(process, 'exit').mockImplementation(jest.fn());

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

afterAll(() => {
  mockExit.mockRestore();
  mockLog.mockRestore();
});
