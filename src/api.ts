import { AcquireAccessTokenRequest, AcquireAccessTokenResponse, HLOApiRequest, HLOApiResponse, GetCharacterRequest, GetCharacterResponse } from './interactions';
import fetch from 'node-fetch';
import { ResultCode, Severity } from './constants.js';
import { HLOApiError } from './error.js';

/** Base URL for the Hero Lab Online API */
const API_BASE_PATH = 'https://api.herolab.online/v1';

/**
 * Default tool name. Used if no tool name is specified.
 */
const DEFAULT_TOOL_NAME = "de.dreiersoftware.hloApi";

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
const sendRequest = async (fetchInstance: HLOApiClient["fetch"], path: string, request: HLOApiRequest): Promise<HLOApiResponse> => {
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
 * Configuration for the HeroLab Online API Client.
 */
type APIConfiguration = {
    /**
     * User token for the Hero Lab Online API.
     */
    userToken: string,

    /**
     * Access token for all requests.
     */
    accessToken?: string,

    /**
     * Automatically handle access token generation and refresh.
     */
    autoTokenHandling?: boolean,

    /**
     * Tool name used for acquiring the access token.
     */
    toolName?: string
}

/**
 * Internal configuration for the HeroLab Online API. Differs from the
 * external configuration by making all fields except access token
 * mandatory.
 */
 type InternalAPIConfiguration = {
    /**
     * User token for the Hero Lab Online API.
     */
    userToken: string,

    /**
     * Access token for all requests.
     */
    accessToken?: string,

    /**
     * Automatically handle access token generation and refresh.
     */
    autoTokenHandling: boolean,

    /**
     * Tool name used for acquiring the access token.
     */
    toolName: string
}

/**
 * Client class for the Hero Lab Online API.
 */
class HLOApiClient {

    /**
     * Fetch implementation called by the API.
     *
     * Defaults to the node-fetch implementation, can be overwritten by passing a function to the constructor.
     */
    private fetch: (input?: string | Request , init?: RequestInit) => Promise<Response> = fetch as unknown as HLOApiClient["fetch"];

    /**
     * API configuration.
     */
    private configuration: InternalAPIConfiguration;

    /**
     * Create a new API instance.
     *
     * @param userToken User token for the Hero Lab Online API.
     * @param fetchInstance Fetch implementation to be used by this API instance.
     */
    constructor(options: APIConfiguration | string, fetchInstance?: HLOApiClient["fetch"]) {
        // Initialize configuration
        if (typeof options === 'object') {
            this.configuration = {
                userToken: options.userToken,
                accessToken: options.accessToken,
                autoTokenHandling: options.autoTokenHandling ===  undefined ? true : options.autoTokenHandling,
                toolName: options.toolName || DEFAULT_TOOL_NAME
            };
        } else {
            this.configuration = {
                userToken: String(options),
                autoTokenHandling: true,
                toolName: DEFAULT_TOOL_NAME
            }
        }

        // Set fetch instance
        if (fetchInstance) {
            this.fetch = fetchInstance;
        }
    }

    /**
     * Send a request to the API.
     *
     * @param path API path with leading /
     * @param request Request data
     * @param accessTokenRequired Access token is required for this request
     * @returns Response data
     */
    private async sendRequest(path: string, request: HLOApiRequest): Promise<HLOApiResponse> {
        return sendRequest(this.fetch, path, request);
    }

    /**
     * Send a request to the API.
     *
     * @param path API path with leading /
     * @param request Request data
     * @param accessTokenRequired Access token is required for this request
     * @returns Response data
     */
     private async sendRequestWithTokenHandling(path: string, request: HLOApiRequest): Promise<HLOApiResponse> {
        if (request.accessToken === undefined) {
            request.accessToken = await this.getAccessToken(request.callerId);
        }
        let result = await this.sendRequest(path, request);
        if (result.result === ResultCode.BadApiToken && this.configuration.autoTokenHandling) {
            // Access token expired
            // Get new access token and retry request (once)
            await this.refreshAccessToken();
            request.accessToken = this.configuration.accessToken;
            result = await sendRequest(this.fetch, path, request);
        }
        return result;
    }

    /**
     * Acquire an access token.
     *
     * @param request Request data.
     * @param setAccessToken Set the new access token for this API instance if the request was successful.
     * @returns Response data.
     */
    async acquireAccessToken(request?: AcquireAccessTokenRequest, setAccessToken = true): Promise<AcquireAccessTokenResponse> {
        if (!request) {
            request = {
                toolName: this.configuration.toolName,
                refreshToken: this.configuration.userToken
            }
        }
        const response = await this.sendRequest("/access/acquire-access-token", request) as AcquireAccessTokenResponse;
        if (setAccessToken && response.severity === Severity.Success && response.accessToken) {
            this.configuration.accessToken = response.accessToken;
        }
        return response;
    }

    /**
     * Refresh the access token before a request.
     *
     * @param callerId Caller ID for the request.
     */
    private async refreshAccessToken(callerId?: number) {
        const response = await this.acquireAccessToken({
            toolName: this.configuration.toolName,
            callerId: callerId || 0,
            refreshToken: this.configuration.userToken
        }, true);

        if (response.severity !== Severity.Success) {
            throw new HLOApiError(response);
        }
    }

    /**
     * Set the access token directly.
     *
     * @param accessToken Access token for the HeroLab Online API.
     * @returns This API instance for method chaining.
     */
    setAccessToken(accessToken: string): HLOApiClient {
        this.configuration.accessToken = accessToken;
        return this;
    }

    /**
     * Verify that the access token is still valid.
     *
     * @param request Request data.
     * @returns Response data.
     */
    async verifyAccessToken(request?: HLOApiRequest): Promise<HLOApiResponse> {
        if (!request) {
            request = {
                accessToken: this.configuration.accessToken
            }
        }
        return this.sendRequest('/access/verify-access-token', request);
    }

    /**
     * Read a single character.
     *
     * @param request Element token or full request.
     * @returns Response data with character information.
     */
    async getCharacter(request: GetCharacterRequest | string): Promise<GetCharacterResponse> {
        if (typeof request !== 'object') {
            request = {
                elementToken: String(request)
            }
        }
        return this.sendRequestWithTokenHandling('/character/get', request) as Promise<GetCharacterResponse>
    }

    /**
     * Get the access token for a request. Acquires the access token if necessary.
     *
     * @param callerId Caller ID for the request.
     * @returns Access token to use in the request.
     * @throws {HLOApiError} Raised when access token was not provided and automated token handling is switched off,
     * or when the access token could not be acquired from the API.
     */
    private async getAccessToken(callerId?: number): Promise<string> {
        if (!this.configuration.accessToken) {
            if (this.configuration.autoTokenHandling) {
                await this.refreshAccessToken(callerId);
            } else {
                // In case of manual token handling, the access token must be set.
                throw new HLOApiError({
                    error: "No access token defined and automatic token handling switched off",
                    severity: Severity.Error,
                    result: ResultCode.BadApiToken,
                    callerId: callerId || 0
                });
            }
        }

        // Access token is set if refreshAccessToken did not raise an error
        return this.configuration.accessToken as string;
    }
}

export { HLOApiClient, APIConfiguration };