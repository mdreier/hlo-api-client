/**
 * Hero Lab Online API Request.
 */
interface HLOApiRequest {
    /**
     * Client-tool determined value that is parroted back in the response.
     */
    callerId?: number;
    /**
     * Access token acquired from the user token.
     * 
     * Required for all requests except the initial request to acquire the access token.
     */
    accessToken?: string;
}

/**
 * Hero Lab Online API Response.
 */
 interface HLOApiResponse {
    /**
     * Whatever value was included inthe request is parroted back in the response.
     */
    callerId: number;
    /**
     * Result code identifying what happened with the request.
     */
    result: number;
    /**
     * Severity level of the result, which will be one of a fewset values.
     */
    severity: number;
    /**
     * If an error occurred, this will be a plain text explanation of what went wrong that will hopefully be 
     * helpful incorrecting the problem; Omitted if the request was successful
     */
    error?: string;
}

/**
 * Request the access token.
 */
interface AcquireAccessTokenRequest extends HLOApiRequest {
    /**
     * User token for which to retrieve the access token.
     */
    refreshToken: string;

    /**
     * Name that uniquely identifies the tool to the API (50 characters maximum); Must remain constant for 
     * the life of the tool (e.g. does not include version numbers or other details that will change)
     */
    toolName: string;

    /**
     * Specifies a brief lifespan for the issued access token (in seconds); Values longer than a short 
     * period are rejected, making this only useful for testing purposes; Zero yields the default 
     * lifespan (as does omitting the property)
     */
    lifespan?: number;
}

/**
 * Response when requesting the access token.
 */
interface AcquireAccessTokenResponse extends HLOApiResponse {
    /**
     * Access token issued for use with other API endpoints.
     */
    accessToken: string;
}

export { HLOApiRequest, HLOApiResponse, AcquireAccessTokenRequest, AcquireAccessTokenResponse };