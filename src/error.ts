import { HLOApiResponse } from './interactions.js'
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
     *
     * @param response Response from the Hero Lab Online API.
     */
    constructor(response: HLOApiResponse) {
        super(response.error);
        this.severity = response.severity;
        this.result = response.result;
    }
}

export { HLOApiError };