import HLOApi, { HLOApiError, ResultCode, Severity } from '../api/api.js';
import { AcquireAccessTokenRequest } from '../api/interactions.js';
import { describe, it } from '../test/jasmine.js'
import ApiMock, { Tokens } from './helpers/hloApiMock.js'

const TOOLNAME = 'HLO API Unit Test';

describe('Access Tokens', () => {
    it('Valid token should be accepted', async () => {
        let response = await HLOApi.getAccessToken(Tokens.valid.user, TOOLNAME, new ApiMock().mock());
        expect(response).toBe(Tokens.valid.access);
    });

    it('Invalid token should be rejected', async () => {
        try {
            let response = await HLOApi.getAccessToken(Tokens.invalid.user, TOOLNAME, new ApiMock().mock());
            fail("Invalid user token did not raise an error");
        } catch (error) {
            expect(error.severity).toBe(Severity.Error);
            expect(error.result).toBe(ResultCode.BadApiToken);
        };
    });

    it('Missing tool name should raise error', async () => {
        try {
            let response = await HLOApi.getAccessToken(Tokens.invalid.user, "", new ApiMock().mock());
            fail("Missing tool name did not raise an error");
        } catch (error) {
            expect(error.severity).toBe(Severity.Error);
        };
    });

    it('Valid token should be verified', async () => {
        const api = new HLOApi(Tokens.valid.access, new ApiMock().mock());;
        let response = await api.verifyAccessToken({});
        expect(response.severity).toBe(Severity.Success);
        expect(response.result).toBe(0);
    });

    it('Invalid token should be verified', async () => {
        const api = new HLOApi(Tokens.invalid.access, new ApiMock().mock());;
        let response = await api.verifyAccessToken({});
        expect(response.severity).toBe(Severity.Error);
        expect(response.result).toBe(ResultCode.BadApiToken);
    });
});