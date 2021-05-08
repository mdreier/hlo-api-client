/* eslint-disable @typescript-eslint/no-misused-promises */
import HLOApi from '../src/api.js';
import { ResultCode, Severity } from '../src/constants.js'
import { HLOApiError } from '../src/error.js';
import { AcquireAccessTokenRequest } from '../src/interactions.js';
import { describe, it } from '../test/jasmine.js'
import ApiMock, { Tokens } from './helpers/hloApiMock.js'

const TOOLNAME = 'HLO API Unit Test';

const createApi = (userToken: string, automaticTokenHandling = false) => {
    return new HLOApi({userToken, autoTokenHandling: automaticTokenHandling}, new ApiMock().mock())
}

describe('Access Tokens', () => {
    it('Valid user token should be accepted', async () => {
        const response = await createApi(Tokens.valid.user).acquireAccessToken({refreshToken: Tokens.valid.user, toolName: TOOLNAME});
        expect(response.accessToken).toBe(Tokens.valid.access);
    });

    it('Invalid user token should be rejected', async () => {
        const response = await createApi(Tokens.invalid.user).acquireAccessToken({refreshToken: Tokens.invalid.user, toolName: TOOLNAME});
        expect(response.severity).toBe(Severity.Error);
        expect(response.result).toBe(ResultCode.BadApiToken);
    });

    it('Missing tool name should raise error', async () => {
        try {
            await createApi(Tokens.valid.user).acquireAccessToken({refreshToken: Tokens.valid.user, toolName: ""});
            fail("Missing tool name did not raise an error");
        } catch (error) {
            const apiError = error as HLOApiError;
            expect(apiError.severity).toBe(Severity.Error);
        };
    });

    it('Configured tool name should be used', async () => {
        const response = await createApi(Tokens.valid.user).acquireAccessToken({refreshToken: Tokens.valid.user} as any as AcquireAccessTokenRequest);
        expect(response.severity).toBe(Severity.Success);
    });

    it('Valid access token should be verified', async () => {
        const response = await createApi(Tokens.valid.user).setAccessToken(Tokens.valid.access).verifyAccessToken({});
        expect(response.severity).toBe(Severity.Success);
        expect(response.result).toBe(0);
    });

    it('Invalid access token should not be verified', async () => {
        const response = await createApi(Tokens.valid.user).setAccessToken(Tokens.invalid.access).verifyAccessToken({});
        expect(response.severity).toBe(Severity.Error);
        expect(response.result).toBe(ResultCode.BadApiToken);
    });
});

describe('Automated token handling', () => {
    it('Missing access token should be requested', async () => {
        const response = await createApi(Tokens.valid.user, true).getCharacter({elementToken: Tokens.valid.singleCharacter});
        expect(response.severity).toBe(Severity.Success);
    });

    it('Invalid access token should be refreshed', async () => {
        const response = await createApi(Tokens.valid.user, true).setAccessToken(Tokens.invalid.access).getCharacter({elementToken: Tokens.valid.singleCharacter});
        expect(response.severity).toBe(Severity.Success);
    });

    it('Should handle invalid user token', async () => {
        const response = await createApi(Tokens.invalid.user, true).acquireAccessToken({refreshToken: Tokens.invalid.user, toolName: TOOLNAME});
        expect(response.severity).toBe(Severity.Error);
        expect(response.result).toBe(ResultCode.BadApiToken);
    })
});