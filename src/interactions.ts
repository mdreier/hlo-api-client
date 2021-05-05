import { ExportFormat } from './export.js'

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

/**
 * Request for reading the data of a single character
 */
interface GetCharacterRequest extends HLOApiRequest {
    /**
     * Either a character token or a cast member token to retrieve the export for.
     */
    elementToken: string;
    /**
     * Identifies the specific actor for which the export should be retrieved; If omitted or null, 
     * the export retrieves information for all actors within the character portfolio.
     */
    actor?: string;

    /**
     * Baseline version that a differential export should report changes since; If omitted or zero, 
     * the full export is retrieved for the character.
     */
    baseline?: number;
}

/**
 * Response when reading a single character.
 */
interface GetCharacterResponse extends HLOApiResponse {
    /**
     * Minimum interval that the caller must wait until making another retrieval request to the API (in milliseconds).
     */
    wait: number;
    /**
     * Indicates the status of the requested character and the nature of the retrieved export data (if any). See
     * CharacterChangeStatus constants.
     */
    status: number;
    /**
     * Export data for the character(or null/omittedif none is returned).
     */
    export?: ExportFormat | null;
}

export { HLOApiRequest, HLOApiResponse, AcquireAccessTokenRequest, AcquireAccessTokenResponse, GetCharacterRequest, GetCharacterResponse };