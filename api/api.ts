import { AcquireAccessTokenRequest, AcquireAccessTokenResponse, HLOApiRequest, HLOApiResponse } from './interactions';
import fetch from 'node-fetch';

const API_BASE_PATH = 'https://api.herolab.online/v1';
const STANDARD_HEADERS = {
    Accept: 'application/json',
    "Content-Type": 'application/json'
}

class HLOApi {

    /**
     * Fetch implementation called by the API.
     * 
     * Defaults to the node-fetch implementation, can be overwritten by passing a function to the constructor.
     */
    private _fetch: (input?: string | Request , init?: RequestInit) => Promise<Response> = fetch as unknown as HLOApi["_fetch"];

    /**
     * Create a new API instance.
     * 
     * @param fetchInstance Fetch implementation to be used by this API instance.
     */
    constructor(fetchInstance?: HLOApi["_fetch"]) {
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
        let endpoint = API_BASE_PATH + path;
        console.debug("Sending request to " + endpoint);

        return this._fetch(endpoint, { method: 'POST', body: JSON.stringify(request), headers: STANDARD_HEADERS })
            .then(response => response.json())
            .then(body => body as HLOApiResponse);
    }

    /**
     * Acquire an access token.
     * @param request Request data.
     * @returns Response data.
     */
    async acquireAccessToken(request: AcquireAccessTokenRequest): Promise<AcquireAccessTokenResponse> {
        return this._sendRequest("/access/acquire-access-token", request) as Promise<AcquireAccessTokenResponse>;
    }

}

export default HLOApi;
export * from './constants.js'