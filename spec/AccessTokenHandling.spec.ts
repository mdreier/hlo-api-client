import HLOApi, { Severity } from '../api/api.js';
import { describe, it } from '../test/jasmine.js'
import ApiMock, { Tokens } from './helpers/hloApiMock.js'

describe('Access Tokens', () => {
    it('Valid token should be accepted', async () => {

        let api = new HLOApi(new ApiMock().mock());
        let response = await api.acquireAccessToken({
            refreshToken: Tokens.valid.user
        });

        expect(response.result === Severity.Success);
    });

    it('Invalid token should be rejected', async () => {

        let api = new HLOApi(new ApiMock().mock());
        let response = await api.acquireAccessToken({
            refreshToken: Tokens.valid.user
        });

        expect(response.result === Severity.Failure);
    });
});