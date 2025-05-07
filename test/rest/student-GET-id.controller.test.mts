import { baseURL, httpsAgent } from '../constants.mts';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Student } from '../../src/Studenten/entity/studenten.entity';
import { HttpStatus } from '@nestjs/common';
import { ErrorResponse } from './error-response.mts';

const idVorhanden = '1';
const idNichtVorhanden = '9999';
const idVorhandenEtag = '1';
const idfalsch = 'falsch';

describe('GET /rest/:id', () => {
    let client: AxiosInstance;

    beforeAll(async () => {
        const restURL = `${baseURL}/rest`;
        client = axios.create({
            baseURL: restURL,
            httpsAgent,
            validateStatus: (status) => status < 500,
        });
    });

    test.concurrent('Buch zu vorhandener ID', async () => {
        // given
        const url = `/${idVorhanden}`;

        // when
        const { status, headers, data }: AxiosResponse<Student> =
            await client.get(url);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);

        const { id } = data;

        expect(id?.toString()).toBe(idVorhanden);
    });

    test.concurrent('Kein Student zu nicht-vorhandener ID', async () => {
        // given
        const url = `/${idNichtVorhanden}`;

        // when
        const { status, data }: AxiosResponse<ErrorResponse> =
            await client.get(url);

        // then
        expect(status).toBe(HttpStatus.NOT_FOUND);

        const { error, message, statusCode } = data;

        expect(error).toBe('Not Found');
        expect(message).toStrictEqual(expect.stringContaining(message));
        expect(statusCode).toBe(HttpStatus.NOT_FOUND);
    });

    test.concurrent('Kein Student zu falscher ID', async () => {
        // given
        const url = `/${idfalsch}`;

        // when
        const { status, data }: AxiosResponse<ErrorResponse> =
            await client.get(url);

        // then
        expect(status).toBe(HttpStatus.NOT_FOUND);

        const { error, statusCode } = data;

        expect(error).toBe('Not Found');
        expect(statusCode).toBe(HttpStatus.NOT_FOUND);
    });

    test.concurrent('Student zu vorhandener ID mit ETag', async () => {
        // given
        const url = `/${idVorhandenEtag}`;

        // when
        const { status, data }: AxiosResponse<string> = await client.get(url, {
            headers: { 'If-None-Match': '"1"' },
        });

        // then
        expect(status).toBe(HttpStatus.NOT_MODIFIED);
        expect(data).toBe('');
    });
});
