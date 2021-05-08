/* eslint-disable @typescript-eslint/no-misused-promises */
import { HLOApiClient } from '../src/api.js';
import { ResultCode, Severity } from '../src/constants.js';
import { describe, it } from '../test/jasmine.js'
import ApiMock, { Tokens } from './helpers/hloApiMock.js'

const createApi = () => {
    return new HLOApiClient(Tokens.valid.user, new ApiMock().mock());
}

describe('Single Character', () => {
    it('Existing character should be returned', async () => {
        const response = await createApi().getCharacter(Tokens.valid.singleCharacter);
        expect(response.severity).toBe(Severity.Success);
        expect(response.export).not.toBeUndefined();
        expect(response.export).not.toBeNull();
        if (response.export) {
            expect(response.export.actors["actor.1"].name).toBe("Unit Test");
        }
    });

    it('Unknown character should return error', async () => {
        const response = await createApi().getCharacter(Tokens.invalid.element);
        expect(response.severity).toBe(Severity.Error);
        expect(response.result).toBe(ResultCode.BadElementToken);
        expect(response.export).toBeUndefined();
        if (response.export) {
            expect(response.export.actors["actor.1"].name).toBe("Unit Test");
        }
    });
});

describe('Multiple Characters', () => {
    it('Existing character should be returned', async () => {
        const response = await createApi().getCharacters([Tokens.valid.singleCharacter]);
        expect(response.severity).toBe(Severity.Success);
        expect(response.characters).not.toBeUndefined();
        expect(response.characters).not.toBeNull();
        if (response.characters) {
            expect(response.characters.length).toEqual(1);
            expect(response.characters[0].elementToken).toBe(Tokens.valid.singleCharacter);
            expect(response.characters[0].export).not.toBeUndefined();
            if (response.characters[0].export) {
                expect(response.characters[0].export.actors["actor.1"].name).toBe("Unit Test");
            }
        }
    });

    it('Unknown character should return error', async () => {
        const response = await createApi().getCharacters([Tokens.invalid.element]);
        expect(response.severity).toBe(Severity.Error);
        expect(response.result).toBe(ResultCode.BadElementToken);
        expect(response.characters).toBeUndefined();
    });

    it('Known and unknown character should return error', async () => {
        const response = await createApi().getCharacters([Tokens.valid.singleCharacter, Tokens.invalid.element]);
        expect(response.severity).toBe(Severity.Error);
        expect(response.result).toBe(ResultCode.BadElementToken);
        expect(response.characters).toBeUndefined();
    });
});