import { createServer, IncomingMessage, Server, ServerResponse } from 'http';
import { URL } from 'url';
import { AddressInfo } from 'net';
import got from 'got';
import * as typeis from 'type-is'
import getToken from './get-token';

const start = (server: Server): Promise<string> =>
  new Promise((resolve) =>
    server.listen(0, () =>
      resolve(`http://localhost:${(server.address() as AddressInfo).port}`)
    )
  );

const JSON_TYPE = "application/json"
const FORM_TYPE = "application/x-www-form-urlencoded"

const parseBody = (body: string, type?: string): Record<string, string> => {
  if (type && type.indexOf(JSON_TYPE) !== -1) {
    return body.length > 1 ? JSON.parse(body) : JSON.parse('{}')
  }

  if (type && type.indexOf(FORM_TYPE) !== -1) {
    const parsedData = new URLSearchParams(body);
    const dataObj = {};
    for (const pair of parsedData.entries()) {
      dataObj[pair[0]] = pair[1];
    }
    return dataObj
  }
  return {}
}

const handler =  (req: IncomingMessage, res: ServerResponse) => {
  let query: Record<string, string> = {};
  
  new URL(req.url as string, 'http://localhost').searchParams.forEach(
    (val, key) => {
      query = query || {};
      query[key] = val;
    }
  );
  
  const chunks: Buffer[] = [];

  req.on("data", (chunk) => {
    chunks.push(chunk);
  });

  req.on("end", () => {
    const data = Buffer.concat(chunks);
    const dataString =  data.toString()
    const parsedBody = parseBody(dataString, req.headers['content-type'])

    try {
      const token = getToken(req.headers, query, parsedBody, !!typeis.is(req.headers['content-type'] as string, ['urlencoded']))
      
      return res.end(token);
    } catch (error) {

      res.statusCode = error.statusCode;
      res.statusMessage = error.message;
    }

    return res.end();
  });
}

describe('get-token', () => {
  let server: Server;
  let url: string;

  beforeEach(async () => {
    server = createServer(handler);
    url = await start(server);
  });

  afterEach((done) => {
    server.close(done);
  });

  it('should fail when there are no tokens', async () => {
    await expect(got(url)).rejects.toThrowError(
      'Response code 401 (Unauthorized)'
    );
  });

  it('should get the token from the header', async () => {
    await expect(
      got(url, {
        resolveBodyOnly: true,
        headers: {
          authorization: 'Bearer token',
        },
      })
    ).resolves.toEqual('token');
  });

  it('should do case insensitive check for header', async () => {
    await expect(
      got(url, {
        resolveBodyOnly: true,
        headers: {
          authorization: 'bearer token',
        },
      })
    ).resolves.toEqual('token');
  });

  it('should fail for malformed header', async () => {
    await expect(
      got(url, {
        headers: {
          authorization: 'foo token',
        },
      })
    ).rejects.toThrowError('Response code 401 (Unauthorized)');
  });

  it('should fail for empty header', async () => {
    await expect(
      got(url, {
        headers: {
          authorization: 'Bearer ',
        },
      })
    ).rejects.toThrowError('Response code 401 (Unauthorized)');
  });

  it('should get the token from the query string', async () => {
    await expect(
      got(url, {
        resolveBodyOnly: true,
        searchParams: { access_token: 'token' },
      })
    ).resolves.toEqual('token');
  });

  it('should succeed to get the token from the query string for POST requests', async () => {
    await expect(
      got(url, {
        resolveBodyOnly: true,
        method: 'POST',
        searchParams: { access_token: 'token' },
      })
    ).resolves.toEqual('token');
  });

  it('should get the token from the request payload', async () => {
    await expect(
      got(url, {
        resolveBodyOnly: true,
        method: 'POST',
        form: { access_token: 'token' },
      })
    ).resolves.toEqual('token');
  });

  it('should fail to get the token from JSON request payload', async () => {
    await expect(
      got(url, {
        method: 'POST',
        json: { access_token: 'token' },
      })
    ).rejects.toThrowError('Response code 401 (Unauthorized)');
  });

  it('should succeed to get the token from request payload for GETs', async () => {
    await expect(
      got(url, {
        resolveBodyOnly: true,
        allowGetBody: true,
        method: 'GET',
        form: { access_token: 'token' },
      })
    ).resolves.toEqual('token');
  });

  it('should fail if more than one method is used', async () => {
    await expect(
      got(url, {
        searchParams: { access_token: 'token' },
        headers: {
          authorization: 'Bearer token',
        },
      })
    ).rejects.toThrowError(
      'Response code 400 (More than one method used for authentication)'
    );
  });
});
