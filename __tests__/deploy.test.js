const fs = require('fs');
const deploy = require('../src/deploy');
let s3, lastDeleteParams, lastUploadParams, mockLog;

const uploads = [ 'a.txt' ];
const deletes = [ 'b.txt' ];
const localPrefix = `${__dirname}/mock`;

beforeAll(() => {

  s3 = {
    deleteObjects: (params) => {
      lastDeleteParams = params;
      return {
        promise: () => Promise.resolve(),
      };
    },
    upload: (params) => {
      lastUploadParams = params;
      return {
        promise: () => Promise.resolve(),
      };
    },
  };

  mockLog = jest.spyOn(console, 'log').mockImplementation(() => {});

});

test('it deploys', async () => {

  expect.assertions(2);

  return deploy(s3, 'foo', uploads, deletes, localPrefix).then(({ uploaded, deleted }) => {

    expect(uploaded).toEqual([ '/a.txt' ]);
    expect(deleted).toEqual([ '/b.txt' ]);

  });

});

test('it deploys into destination prefix as instructed', async () => {

  expect.assertions(2);

  return deploy(s3, 'foo', uploads, deletes, localPrefix, 'some/nested/folder').then(({ uploaded, deleted }) => {

    expect(uploaded).toEqual([ '/some/nested/folder/a.txt' ]);
    expect(deleted).toEqual([ '/some/nested/folder/b.txt' ]);

  });

});

test('it sends the correct delete params', async () => {

  expect.assertions(2);

  return deploy(s3, 'foo', uploads, deletes, localPrefix).then(({ deleted }) => {

    expect(lastDeleteParams.Bucket).toEqual('foo');
    expect(lastDeleteParams.Delete.Objects).toEqual(deleted.map((Key) => ({ Key })));

  });

});

test('it sends the correct upload params', async () => {

  expect.assertions(5);

  return deploy(s3, 'foo', uploads, deletes, localPrefix).then(({ uploaded }) => {

    expect(lastUploadParams.ACL).toBeUndefined();
    expect(lastUploadParams.Body).toBeInstanceOf(fs.ReadStream);
    expect(lastUploadParams.ContentLength).toEqual(2);
    expect(lastUploadParams.ContentType).toEqual('text/plain');
    expect(lastUploadParams.Key).toEqual(uploaded[0]);

  });

});

afterAll(() => {
  s3 = undefined;
  lastDeleteParams = undefined;
  lastUploadParams = undefined;
  mockLog.mockRestore();
});
