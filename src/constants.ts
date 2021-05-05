/* eslint-disable @typescript-eslint/naming-convention */

/**
 * Result codes from Appendix 1 of the Hero Lab Online API specification.
 */
 const ResultCode = {
    /**
     * Request yielded no actual change or effect.
     */
    Unchanged: 7000,
    /**
     * Caller provided inputs that were invalid in some way, such as possessing out-of-range values.
     */
    UsageError: 7011,
    /**
     * Request cannot be performed due to some pre-requisite or situational state that precludes it.
     */
    Precluded: 7022,
    /**
     * The provided token is invalid in some way, typically having expired or been revoked.
     *
     * NOTE! If a refresh token is invalid, a new accesstoken must be acquired through the product.
     * NOTE! If an access token is invalid, a fresh access token must be acquired via the endpointprovided forthis purpose. Access tokens havea nominallifespan and will expire regularly.
     */
    BadApiToken: 7100,
    /**
     * The provided tool name is invalid.
     */
    BadToolName: 7101,
    /**
     * The provided game server identifier is invalid.
     */
    BadGameServer: 7102,
    /**
     * Specified element token is either invalid, revoked, or inaccessible to the caller.
     */
    BadElementToken: 7110,
    /**
     * Specified campaign token is either invalid or does not identify an accessiblecampaign.
     */
    BadCampaign: 7111,
    /**
     * Specified cast member token is either invalid or does not identify an accessiblecast member.
     */
    BadCastMember: 7113,
    /**
     * Specified independent charactertoken is either invalid or does not identify an accessible character.
     */
    BadCharacter: 7113,
    /**
     * Requested resource is inaccessible due to its status, such as a campaign or cast member being retired or trashed.
     */
    StatusInaccessible: 7200,
    /**
     * No subscription exists for the requested token.
     */
    NotSubscribed: 7201,
    /**
     * Requested capability is not available to a demo or expired account.
     */
    DemoAccount: 7210,
    /**
     * Request could not be completed due to a transient resource contention on the campaign, the stage, or characters on the stage.
     */
    CampaignContention: 7250,
    /**
     * The caller is hitting the API endpoints faster than allowed and has been denied access.NOTE! When this occurs, the previous
     * wait time is restarted anew, so slow downsending requests.
     *
     * NOTE! If a caller persistently requires throttling on a protracted
     * basis, additional lockout periods will be applied that become progressively longer.
     */
    CallerThrottled: 7800,
    /**
     * Same as Api_Caller_Throttled, except the caller made simultaneous/overlapping requests.
     */
    CallerThrottledOverlap: 7801,
    /**
     * Persistent need for throttling has resulted in a prolonged lockout at the next tier.
     *
     * NOTE! Each tier imposes a progressively longer lockout period. Wait for the lockout to expire before utilizing the API further.
     */
    CallerLockoutTier: 7805,
    /**
     * Multiple callers are polling the same token(s) concurrently, which is not allowed.
     *
     * NOTE! This caller has been locked out for a little while and must wait until the lockout elapses.
     */
    OverlappingClientLockout: 7810,
    /**
     * Connection from client tool was denied due to reaching the maximum limit on connections.
     *
     * NOTE! Contact support for assistance in resolving the problem.
     */
    ConnectionLimitExceeded: 7890,
    /**
     * All operations of the public APIare currently unavailable. Try again later.
     */
    NotEnabled: 7900,
    /**
     * An internal error occurred. If this error persists, please open asupport ticket for assistance.
     */
    InternalError: 7977,
    /**
     * An error occurred that does not have a suitable API translation defined for it.
     */
    UnspecifiedError: 7999
} as const;

/**
 * Severities from Appendix 1 of the Hero Lab Online API specification.
 */
const Severity = {
    /**
     * Request completed successfully.
     */
    Success: 1,
    /**
     * Request completed, but something also occurred that is worthy of flagging.
     */
    Info: 50,
    /**
     * Request completed, but something occurred that was probably not expected.
     */
    Warning: 100,
    /**
     * Request failed in some way.
     */
    Error: 150,
    /**
     * Request failed in a way that has cascading implications and could impact subsequent requests.
     */
    Failure: 200
} as const;

/**
 * Character Change Status from Appendix 2 of the Hero Lab Online API specification.
 */
const CharacterChangeStatus = {
    /**
     * Character is not valid or is inaccessible, which can occur for a variety of reasons; No export data is returned.
     */
    Missing: -1,
    /**
     * No changes have occurred with the character since the given baseline version; No export data is returned.
     */
    Unchanged: 0,
    /**
     * The character has likely changed relative to the baseline version, returning a differential export (which may itself be empty).
     */
    Delta: 1,
    /**
     * Either a baseline version of zero was request or the character has changed relative to the baseline version, with a full export being returned.
     */
    Complete: 2
} as const;

export { ResultCode, Severity, CharacterChangeStatus };