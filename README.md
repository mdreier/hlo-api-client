# Hero Lab Online API JavaScript Client

This package is a JavaScript/TypeScript client for the Hero Lab Online API. It contains a fully typed interface for all methods exposed
by the API and is ready for use with Node.js.

This software is not affiliated with Lone Wolf Development in any way. "Hero Lab" and "Hero Lab Online" are trademarked by LoneWolf Development

## API Documentation

The [official HeroLab Online API documentation](https://docs.herolab.online/HLO-Public-API-Documentation.pdf) and the
[documentation of the export format](https://docs.herolab.online/HLO-Export-Format-Documentation.pdf).

## Using the API Client

### General Considerations

To use the API, you need to get a user refresh token. From the API Documentation:

> Connecting to the server is initiated with a **user token**.Each user token identifies the user requesting the data from the API, along with 
> other important details the API needs. Users must provide their user token to a tool they wish to employ, and that tool then accesses the HLO
> server on that user’s behalf - as the user’s agent.

You can get a user token in HeroLab Online by going to "Export/Integrate..." in the settings menu (the gear icon) and generating it in the 
"User Token" section.

Furthermore, if you want to read data from the API, you'll need element tokens. Again from the documentation:

> Access to specific resources on the HLO server is achieved through **element tokens**. These tokens behave as keys that unlock access to 
> certain elements on the server, such as characters, cast members, and campaigns. By providing an element token to a digital tool, a user grants
> the tool access to that particular element. This allows users to selectively determine which elements are disclosed and even give different 
> tokens to different tools for different purposes.

You can get the element token in the same place as the user token. If you want to get data from other people's characters, you will need **your**
user token and **their** element token(s).

:warning: Generally, the API client does not wrap too much intelligence around the raw API methods. Therefor it is recommended to read through the
[API documentation](#api-documentation) before using the client to understand how the API works. This helps to understand how to use the methods and
also why certain errors may occur.

### Initialize the API

Create a new API instance. You always have to pass a user refresh token, and you may optionally pass an access token. See the type
[APIConfiguration](docs/modules.html#apiconfiguration) for a description of all options.

```javascript
import {HLOApiClient} from 'hlo-api-client';

const myUserToken = "abcde";

// Basic usage
const apiClient = new HLOApiClient(myUserToken);

// Passing more options
const apiClient = new HLOApiClient({userToken: myUserToken, accessToken: "xyz", toolName: "My Cool Tool"});
```

You can pass a custom implementation of the `fetch` method to be used by the API client. This is useful for unit testing or in case
you need a different implementation.

#### Access Token Handling

By default, the API takes care internally about creating the necessary access token derived from your user token. It requests an initial
access token and refreshes it in case it expires. If you wish to control the access token by yourself, follow these steps:

1. Disable the automatic access token handling by passing `autoTokenHandling: false` to the constructor.
2. Explicitly request API tokens by calling `apiClient.acquireAccessToken()`
3. Handle the case that the access token becomes invalid (`response.result` has the value of 7100, available in the constant
   `ResultCode.BadAPIToken`).

In this mode, the API client still handles the access token internally, adding it to all requests. You can also handle it manually by
simply adding it to the request object (you cannot use the plain parameters in this case).

### Calling API methods

All API methods are asynchronous. To call an API method, you generally have two options:

1. Call the method with plain parameters. This may not expose all possible options of the API.
2. Call the data with a request object. This allows you to set all options which are exposed by the API.

In either case the method returns a Promise which resolves with a result object. This object contains the response status as well as
the response data (e.g. the character export).

### Error Handling

The API client mirrors the error behavior of the API. This means that most failures will not throw a JavaScript error, but rather have
an error status in the response (`response.severity`). Possible severities are available in the constant `Severity`, the results in 
the constant `ResultCode`.

```javascript
import {Severity, ResultCode} from 'hlo-api-client';

const response = apiClient.getCharacterData("abcdef");
if (response.severity !== Severity.Success) {
    console.log(`Response Code ${response.result} with message ${response.error}`);
}
```

Errors are generally only raised if:

* Communication with the server fails, e.g. due to network issues
* Mandatory parameters, such as the access token, are missing in the call