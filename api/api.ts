import { AcquireAccessTokenRequest, AcquireAccessTokenResponse, HLOApiRequest, HLOApiResponse, GetCharacterRequest, GetCharacterResponse } from './interactions';
import fetch from 'node-fetch';
import { ResultCode, Severity } from './constants.js';

/** Base URL for the Hero Lab Online API */
const API_BASE_PATH = 'https://api.herolab.online/v1';

/** Headers sent with each request */
const STANDARD_HEADERS = {
    Accept: 'application/json',
    "Content-Type": 'application/json'
}

/**
 * For debugging: Print response to the console 
 * @param response Response from the API.
 * @returns Unchanged response for method chaining.
 */
async function printResponse(response: Response): Promise<Response> {
    let text = await response.text();
    console.debug(text);
    response.json = () => JSON.parse(text);
    return response;
}

/**
 * Check that the response is successful. Validates the HTTP return code.
 * @param response  Reponse object.
 * @returns Unchanged response for method chaining.
 * @throws Throws HLOApiError if the response is not OK.
 */
function validateResponse(response: Response) {
    if (response.ok) {
        return response;
    } else {
        throw new HLOApiError({
            callerId: 0,
            error: "Invalid API call",
            severity: Severity.Error,
            result: 0
        });
    }
}

/**
 * Send a request to the API.
 * @param fetchInstance  The fetch method to use for the request.
 * @param path Path in the API to send the request to.
 * @param request Request data.
 * @returns Response data.
 */
async function sendRequest(fetchInstance: HLOApi["_fetch"], path: string, request: HLOApiRequest): Promise<HLOApiResponse> {
    let endpoint = API_BASE_PATH + path;
        console.debug("Sending request to " + endpoint);
        console.debug(request);

        return fetchInstance(endpoint, { method: 'POST', body: JSON.stringify(request), headers: STANDARD_HEADERS })
            .then(validateResponse)
            .then(printResponse)
            .then(response => response.json())
            .then(body => body as HLOApiResponse);
}

/**
 * Client class for the Hero Lab Online API.
 */
class HLOApi {

    /**
     * Fetch implementation called by the API.
     * 
     * Defaults to the node-fetch implementation, can be overwritten by passing a function to the constructor.
     */
    private _fetch: (input?: string | Request , init?: RequestInit) => Promise<Response> = fetch as unknown as HLOApi["_fetch"];

    /**
     * Access token for all requests.
     */
    private _accessToken: string;

    /**
     * Create a new API instance.
     * 
     * @param accessToken Access token for the Hero Lab Online API.
     * @param fetchInstance Fetch implementation to be used by this API instance.
     */
    constructor(accessToken: string, fetchInstance?: HLOApi["_fetch"]) {
        this._accessToken = accessToken;
        if (fetchInstance) {
            this._fetch = fetchInstance;
        }
    }

    /**
     * Send a request to the API.
     * 
     * @param path API path with leading /
     * @param request Request data
     * @returns Response data
     */
    private async _sendRequest(path: string, request: HLOApiRequest): Promise<HLOApiResponse> {
        request.accessToken = this._accessToken;
        return sendRequest(this._fetch, path, request);
    }

    /**
     * Acquire an access token.
     * @param request Request data.
     * @param setAccessToken Set the new access token for this API instance if the request was successful.
     * @returns Response data.
     */
    async acquireAccessToken(request: AcquireAccessTokenRequest, setAccessToken: boolean = true): Promise<AcquireAccessTokenResponse> {
        const response = await this._sendRequest("/access/acquire-access-token", request) as AcquireAccessTokenResponse;
        if (setAccessToken && response.severity === Severity.Success && response.accessToken) {
            this._accessToken = response.accessToken;
        }
        return response;
    }

    /**
     * Helper function to get an access token before creating an API instance.
     * @param userToken User token
     * @param fetchInstance Fetch implementation to be used for the request.
     */
    static async getAccessToken(userToken: string, toolName: string, fetchInstance?: HLOApi["_fetch"]): Promise<string> {
        if (!fetchInstance) {
            fetchInstance = fetch as unknown as HLOApi["_fetch"];
        }
        let response = await sendRequest(fetchInstance, "/access/acquire-access-token", { refreshToken: userToken, toolName: toolName } as AcquireAccessTokenRequest) as AcquireAccessTokenResponse;
        if (response.severity === Severity.Success) {
            return response.accessToken;
        } else {
            throw new HLOApiError(response);
        }
    }

    /**
     * Verify that the access token is still valid.
     * @param request Request data.
     * @returns Response data.
     */
    async verifyAccessToken(request: HLOApiRequest): Promise<HLOApiResponse> {
        return this._sendRequest('/access/verify-access-token', request);
    }

    async getCharacter(request: GetCharacterRequest): Promise<GetCharacterResponse> {
        return this._sendRequest('/character/get', request) as Promise<GetCharacterResponse>
    }
}

/**
 * Error thrown by the Hero Lab Online API for failed requests.
 */
class HLOApiError extends Error {
    /**
     * Error severity. See constants in type Severity for values.
     */
    public readonly severity: number;
    /**
     * Error code. See constants in type ResultCode for values.
     */
    public readonly result: number;

    /**
     * Create a new error.
     * @param response Response from the Hero Lab Online API.
     */
    constructor(response: HLOApiResponse) {
        super(response.error);
        this.severity = response.severity;
        this.result = response.result;
    }
}

export default HLOApi;
export { HLOApiError };
export * from './constants.js'