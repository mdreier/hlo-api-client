import { AcquireAccessTokenRequest, AcquireAccessTokenResponse, HLOApiRequest, HLOApiResponse, GetCharacterRequest, GetCharacterResponse } from './interactions';
import fetch from 'node-fetch';
import { Severity } from './constants.js';
import { HLOApiError } from './error.js';

/** Base URL for the Hero Lab Online API */
const API_BASE_PATH = 'https://api.herolab.online/v1';

/** Headers sent with each request */
const STANDARD_HEADERS = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Accept: 'application/json',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "Content-Type": 'application/json'
}

/**
 * For debugging: Print response to the console
 *
 * @param response Response from the API.
 * @returns Unchanged response for method chaining.
 */
const printResponse = async (response: Response): Promise<Response> => {
    const text = await response.text();
    console.debug(text);
    response.json = () => Promise.resolve(JSON.parse(text));
    return response;
}

/**
 * Check that the response is successful. Validates the HTTP return code.
 *
 * @param response  Reponse object.
 * @returns Unchanged response for method chaining.
 * @throws Throws HLOApiError if the response is not OK.
 */
const validateResponse = (response: Response) => {
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
 *
 * @param fetchInstance  The fetch method to use for the request.
 * @param path Path in the API to send the request to.
 * @param request Request data.
 * @returns Response data.
 */
const sendRequest = async (fetchInstance: HLOApi["fetch"], path: string, request: HLOApiRequest): Promise<HLOApiResponse> => {
    const endpoint = API_BASE_PATH + path;
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
    private fetch: (input?: string | Request , init?: RequestInit) => Promise<Response> = fetch as unknown as HLOApi["fetch"];

    /**
     * Access token for all requests.
     */
    private accessToken: string;

    /**
     * Create a new API instance.
     *
     * @param accessToken Access token for the Hero Lab Online API.
     * @param fetchInstance Fetch implementation to be used by this API instance.
     */
    constructor(accessToken: string, fetchInstance?: HLOApi["fetch"]) {
        this.accessToken = accessToken;
        if (fetchInstance) {
            this.fetch = fetchInstance;
        }
    }

    /**
     * Send a request to the API.
     *
     * @param path API path with leading /
     * @param request Request data
     * @returns Response data
     */
    private async sendRequest(path: string, request: HLOApiRequest): Promise<HLOApiResponse> {
        request.accessToken = this.accessToken;
        return sendRequest(this.fetch, path, request);
    }

    /**
     * Acquire an access token.
     *
     * @param request Request data.
     * @param setAccessToken Set the new access token for this API instance if the request was successful.
     * @returns Response data.
     */
    async acquireAccessToken(request: AcquireAccessTokenRequest, setAccessToken = true): Promise<AcquireAccessTokenResponse> {
        const response = await this.sendRequest("/access/acquire-access-token", request) as AcquireAccessTokenResponse;
        if (setAccessToken && response.severity === Severity.Success && response.accessToken) {
            this.accessToken = response.accessToken;
        }
        return response;
    }

    /**
     * Helper function to get an access token before creating an API instance.
     *
     * @param userToken User token
     * @param fetchInstance Fetch implementation to be used for the request.
     */
    static async getAccessToken(userToken: string, toolName: string, fetchInstance?: HLOApi["fetch"]): Promise<string> {
        if (!fetchInstance) {
            fetchInstance = fetch as unknown as HLOApi["fetch"];
        }
        const response = await sendRequest(fetchInstance, "/access/acquire-access-token", { refreshToken: userToken, toolName } as AcquireAccessTokenRequest) as AcquireAccessTokenResponse;
        if (response.severity === Severity.Success) {
            return response.accessToken;
        } else {
            throw new HLOApiError(response);
        }
    }

    /**
     * Verify that the access token is still valid.
     *
     * @param request Request data.
     * @returns Response data.
     */
    async verifyAccessToken(request: HLOApiRequest): Promise<HLOApiResponse> {
        return this.sendRequest('/access/verify-access-token', request);
    }

    async getCharacter(request: GetCharacterRequest): Promise<GetCharacterResponse> {
        return this.sendRequest('/character/get', request) as Promise<GetCharacterResponse>
    }
}

export default HLOApi;