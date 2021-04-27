import 'url';
import { ResultCode, Severity } from '../../api/constants.js';
import fetchMock from 'fetch-mock';

const Tokens = {
    valid: {
        user: "VALID_USER_TOKEN",
        access: "VALID_ACCESS_TOKEN"
    },
    invalid: {
        user: "INVALID_USER_TOKEN",
        access: "INVALID_ACCESS_TOKEN"
    }
};

class HeroLabOnlineApi {

    mock() {
        let sandbox = fetchMock.sandbox();
        sandbox.mock(/https:\/\/api.herolab.online\/v1\/access\/.*/, this.handleAccess.bind(this));
        sandbox.mock(/https:\/\/api.herolab.online\/v1\/character\/.*/, this.handleCharacter.bind(this));
        sandbox.mock(/https:\/\/api.herolab.online\/v1\/campaign\/.*/, this.handleCampaign.bind(this));            
        return sandbox;
    }

    /**
     * Get the operation called in a request. The operation is the
     * last segment of the request path.
     * 
     * For example, in the request /characters/get, the operation would
     * be get.
     * @param request Request object.
     * @returns Name of the operation.
     */
    _getOperation(path: string): string {
        let url = new URL(path);
        let pathSegments = url.pathname.split('/');
        return pathSegments[pathSegments.length - 1];
    }

    _respond(body: object) {
        return {
            body: JSON.stringify(body),
            status: 200,
            headers: {"Content-Type": "application/json"}
        };
    }

    handleAccess(url: string, opts: fetchMock.MockOptionsMethodPost) {
        const content = JSON.parse(String(opts.body));
        switch (this._getOperation(url)) {
            case "acquire-access-token":
                let refreshTokenValid = content.refreshToken === Tokens.valid.user;
                return this._respond({
                    callerId: content.callerId ? content.callerId : undefined,
                    result: refreshTokenValid ? 0 : ResultCode.BadApiToken,
                    severity: refreshTokenValid ? Severity.Success : Severity.Error,
                    accessToken: refreshTokenValid ? Tokens.valid.access : undefined
                });
            case "verify-access-token":
                let accessTokenValid = content.accessToken === Tokens.valid.access;
                return this._respond({
                    callerId: content.callerId ? content.callerId : undefined,
                    result: accessTokenValid ? 0 : ResultCode.BadApiToken,
                    severity: accessTokenValid ? Severity.Success : Severity.Error,
                });
            case "identify-game-server":
            case "identify-notification-server":
            case "attach-game-server":
            case "unsubscribe-all":
                //Notifications and server status not supported
                return this._respond({
                    callerId: content.callerId ? content.callerId : undefined,
                    result: ResultCode.NotEnabled,
                    severity: Severity.Failure
                });
            default:
                //Unknown request
                return this._respond({
                    callerId: content.callerId ? content.callerId : undefined,
                    result: ResultCode.UnspecifiedError,
                    severity: Severity.Error
                });
        }
    }

    handleCharacter(url: string, opts: fetchMock.MockOptionsMethodPost) {
        const content = JSON.parse(String(opts.body));
        return this._respond({
            callerId: content.callerId ? content.callerId : undefined,
            result: ResultCode.UnspecifiedError,
            severity: Severity.Error
        });
}

    handleCampaign(url: string, opts: fetchMock.MockOptionsMethodPost) {
        const content = JSON.parse(String(opts.body));
        return this._respond({
            callerId: content.callerId ? content.callerId : undefined,
            result: ResultCode.UnspecifiedError,
            severity: Severity.Error
        });
}

}

export { Tokens };
export default HeroLabOnlineApi;