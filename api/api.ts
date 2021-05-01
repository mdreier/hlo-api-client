import { AcquireAccessTokenRequest, AcquireAccessTokenResponse, HLOApiRequest, HLOApiResponse } from './interactions';
import fetch from 'node-fetch';
import { Severity } from './constants.js';

const API_BASE_PATH = 'https://api.herolab.online/v1';
const STANDARD_HEADERS = {
    Accept: 'application/json',
    "Content-Type": 'application/json'
}

async function printResponse(response: Response): Promise<Response> {
    let text = await response.text();
    console.debug(text);
    response.json = () => JSON.parse(text);
    return response;
}

function validateResponse(response: Response) {
    if (response.ok) {
        return response;
    } else {
        throw new Error("Invalid API call");
    }
}

async function sendRequest(fetchInstance: HLOApi["_fetch"], path: string, request: HLOApiRequest): Promise<HLOApiResponse> {
    let endpoint = API_BASE_PATH + path;
        console.debug("Sending request to " + endpoint);

        return fetchInstance(endpoint, { method: 'POST', body: JSON.stringify(request), headers: STANDARD_HEADERS })
            .then(validateResponse)
            .then(printResponse)
            .then(response => response.json())
            .then(body => body as HLOApiResponse);
}

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
     * @param accessToken Access token for the HeroLab Online API.
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
     * @returns Response data.
     */
    async acquireAccessToken(request: AcquireAccessTokenRequest): Promise<AcquireAccessTokenResponse> {
        return this._sendRequest("/access/acquire-access-token", request) as Promise<AcquireAccessTokenResponse>;
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
}

/**
 * Error thrown by the HeroLabl Online API for failed requests.
 */
class HLOApiError extends Error {
    public readonly severity: number;
    public readonly result: number;

    constructor(response: HLOApiResponse) {
        super(response.error);
        this.severity = response.severity;
        this.result = response.result;
    }
}

export default HLOApi;
export * from './constants.js'