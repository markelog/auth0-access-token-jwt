# auth0-access-token-jwt ![CI](https://github.com/markelog/auth0-access-token-jwt/actions/workflows/main.yml/badge.svg)

> Verfies and decodes Access Token JWTs loosley following [draft-ietf-oauth-access-token-jwt-12](https://tools.ietf.org/html/draft-ietf-oauth-access-token-jwt-12)

This package is created since the original Auth0 [library](https://github.com/auth0/node-oauth2-jwt-beare) only exposes express middleware – this makes it impossible to use the jwt verification through Auth0 without express dependency.

If you use something besides express to handle your HTTP requests (like koa, grpc, etc) – it leaves you to create "[ugly](https://github.com/auth0/node-oauth2-jwt-bearer/issues/49)" workarounds in order to use Auth0.

You can use this package until [this](https://github.com/auth0/node-oauth2-jwt-bearer/issues/75) issue is corrected.

## Install
```sh
npm install auth0-access-token-jwt
```

## Usage

```ts
import { jwtVerifier } from 'auth0-access-token-jwt';

const token = "your-refresh-token"

const verify = jwtVerifier({
	issuerBaseURL: 'http://issuer.example.com',
	audience: 'https://myapi.com'
})

const auth = await verify(token)

auth.header; // Decoded JWT header
auth.payload; // Decoded JWT payload
auth.token; // Raw JWT token

```

## license

MIT (see the [license](license) file).
