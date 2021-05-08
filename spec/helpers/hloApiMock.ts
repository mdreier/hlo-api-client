import 'url';
import { ResultCode, Severity } from '../../src/constants.js';
import fetchMock from 'fetch-mock';
import characters from './characters.js';

const Tokens = {
    valid: {
        user: "VALID_USER_TOKEN",
        access: "VALID_ACCESS_TOKEN",
        singleCharacter: "VALID_SINGLE_CHARACTER_TOKEN"
    },
    invalid: {
        user: "INVALID_USER_TOKEN",
        access: "INVALID_ACCESS_TOKEN",
        element: "INVALID_ELEMENT_TOKEN"
    }
};

class HeroLabOnlineApi {

    mock(): fetchMock.FetchMockSandbox {
        const sandbox = fetchMock.sandbox();
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
     * be "get".
     *
     * @param request Request object.
     * @returns Name of the operation.
     */
    private getOperation(path: string): string {
        const url = new URL(path);
        const pathSegments = url.pathname.split('/');
        return pathSegments[pathSegments.length - 1];
    }

    private respond(body: Record<string, unknown>): Record<string, unknown> {
        return {
            body: JSON.stringify(body),
            status: 200,
            headers: { "Content-Type": "application/json" }
        };
    }

    private respondBadRequest(): Record<string, unknown> {
        return {
            body: '<!DOCTYPE html><html lang="en" manifest="/manifest.appcache"><head><body></body>',
            status: 400,
            headers: { "Content-Type": "text/html" }
        };
    }

    handleAccess(url: string, opts: fetchMock.MockOptionsMethodPost): Record<string, unknown> {
        const content = JSON.parse(String(opts.body)) as Record<string, unknown>;
        const accessTokenValid = content.accessToken === Tokens.valid.access;
        switch (this.getOperation(url)) {
            case "acquire-access-token":
                if (!content.toolName) {
                    return this.respondBadRequest();
                } else {
                    const refreshTokenValid = content.refreshToken === Tokens.valid.user;
                    return this.respond({
                        callerId: content.callerId ? content.callerId : undefined,
                        result: refreshTokenValid ? 0 : ResultCode.BadApiToken,
                        severity: refreshTokenValid ? Severity.Success : Severity.Error,
                        accessToken: refreshTokenValid ? Tokens.valid.access : undefined
                    });
                }
            case "verify-access-token":
                return this.respond({
                    callerId: content.callerId ? content.callerId : undefined,
                    result: accessTokenValid ? 0 : ResultCode.BadApiToken,
                    severity: accessTokenValid ? Severity.Success : Severity.Error
                });
            case "identify-game-server":
            case "identify-notification-server":
            case "attach-game-server":
            case "unsubscribe-all":
                // Notifications and server status not supported
                return this.respond({
                    callerId: content.callerId ? content.callerId : undefined,
                    result: ResultCode.NotEnabled,
                    severity: Severity.Failure
                });
            default:
                // Unknown request
                return this.respond({
                    callerId: content.callerId ? content.callerId : undefined,
                    result: ResultCode.UnspecifiedError,
                    severity: Severity.Error
                });
        }
    }

    handleCharacter(url: string, opts: fetchMock.MockOptionsMethodPost): Record<string, unknown> {
        const content = JSON.parse(String(opts.body)) as Record<string, unknown>;
        const accessTokenValid = content.accessToken === Tokens.valid.access;
        if (!accessTokenValid) {
            return this.respond({
                callerId: content.callerId ? content.callerId : undefined,
                result: ResultCode.BadApiToken,
                severity: Severity.Error
            });
        }
        switch(this.getOperation(url)) {
            case "get":
                return this.respond({
                    callerId: content.callerId,
                    severity: content.elementToken === Tokens.valid.singleCharacter ? Severity.Success : Severity.Error,
                    result: content.elementToken === Tokens.valid.singleCharacter ? 0 : ResultCode.BadElementToken,
                    export: content.elementToken === Tokens.valid.singleCharacter ? characters.fullExport : undefined
                });
            default:
                return this.respond({
                    callerId: content.callerId ? content.callerId : undefined,
                    result: ResultCode.UnspecifiedError,
                    severity: Severity.Error
                });
        }
    }

    handleCampaign(url: string, opts: fetchMock.MockOptionsMethodPost): Record<string, unknown> {
        const content = JSON.parse(String(opts.body)) as Record<string, unknown>;
        return this.respond({
            callerId: content.callerId ? content.callerId : undefined,
            result: ResultCode.UnspecifiedError,
            severity: Severity.Error
        });
    }

}

export { Tokens };
export default HeroLabOnlineApi;