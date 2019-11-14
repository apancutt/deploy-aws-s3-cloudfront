const diff = require('../src/diff');

describe('diff', () => {

  let mockLog;

  const local = {
    'new.txt': 'abc123',
    'modified.txt': 'abc456',
  };

  const remote = {
    'modified.txt': 'abc123',
    'deleted.txt': 'abc123',
  };

  beforeAll(() => {
    mockLog = jest.spyOn(console, 'log').mockImplementation(jest.fn());
  });

  afterAll(() => {
    mockLog.mockRestore();
  });

  test('it computes diff', async () => {

    expect.assertions(3);

    return diff(local, remote).then(({ added, modified, deleted }) => {

      expect(added).toEqual([ 'new.txt' ]);
      expect(modified).toEqual([ 'modified.txt' ]);
      expect(deleted).toEqual([]);

    });

  });

  test('it computes diff without ignoring deleted', async () => {

    expect.assertions(1);

    return diff(local, remote, false).then(({ deleted }) => {
      expect(deleted).toEqual([ 'deleted.txt' ]);
    });

  });

});
