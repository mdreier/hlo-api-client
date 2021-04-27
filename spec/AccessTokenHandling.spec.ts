import HLOApi, { ResultCode, Severity } from '../api/api.js';
import { AcquireAccessTokenRequest } from '../api/interactions.js';
import { describe, it } from '../test/jasmine.js'
import ApiMock, { Tokens } from './helpers/hloApiMock.js'

describe('Access Tokens', () => {
    it('Valid token should be accepted', async () => {

        let api = new HLOApi(new ApiMock().mock());
        let response = await api.acquireAccessToken({
            toolName: 'HLO API Unit Test',
            refreshToken: Tokens.valid.user
        });

        expect(response.severity).toBe(Severity.Success);
    });

    it('Invalid token should be rejected', async () => {

        let api = new HLOApi(new ApiMock().mock());
        let response = await api.acquireAccessToken({
            toolName: 'HLO API Unit Test',
            refreshToken: Tokens.invalid.user
        });

        expect(response.severity).toBe(Severity.Error);
        expect(response.result).toBe(ResultCode.BadApiToken);
    });

    it('Missing tool name should fail', async () => {

        let api = new HLOApi(new ApiMock().mock());
        let response = await api.acquireAccessToken({
            refreshToken: Tokens.valid.user
        } as AcquireAccessTokenRequest);

        expect(response.severity).toBe(Severity.Error);
    });
});