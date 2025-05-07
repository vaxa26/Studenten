import { HttpStatus } from '@nestjs/common';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Student } from '../../src/Studenten/entity/studenten.entity';
import { baseURL, httpsAgent } from '../constants.mts';
import { type Page } from '../../src/Studenten/controller/page.js';
import { ErrorResponse } from './error-response.mjs';

const teilname = 'a';
const xteilname = 'xxx';

describe('GET /rest', () => {
    let restUrl: string;
    let client: AxiosInstance;

    // Axios initialisieren
    beforeAll(async () => {
        restUrl = `${baseURL}/rest`;
        client = axios.create({
            baseURL: restUrl,
            httpsAgent,
            validateStatus: () => true,
        });
    });

    test.concurrent('Alle Studenten', async () => {
        // given

        // when
        const { status, headers, data }: AxiosResponse<Page<Student>> =
            await client.get('/');

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data).toBeDefined();

        data.content
            .map((student) => student.id)
            .forEach((id) => {
                expect(id).toBeDefined();
            });
    });

    test.concurrent('Studenten mit einem Teil-nachname suchen', async () => {
        // given
        const params = { name: teilname };

        // when
        const { status, headers, data }: AxiosResponse<Page<Student>> =
            await client.get('/', { params });

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data).toBeDefined();

        // Jedes Buch hat einen Titel mit dem Teilstring 'a'
        data.content
            .map((student) => student.name)
            .forEach((name) =>
                expect(name?.nachname?.toLowerCase()).toStrictEqual(
                    expect.stringContaining(teilname),
                ),
            );
    });

    test.concurrent(
        'Studenten zu einem nicht vorhandenen Teil-nachname suchen',
        async () => {
            // given
            const params = { name: xteilname };

            // when
            const { status, data }: AxiosResponse<ErrorResponse> =
                await client.get('/', { params });

            // then
            expect(status).toBe(HttpStatus.NOT_FOUND);

            const { error, statusCode } = data;

            expect(error).toBe('Not Found');
            expect(statusCode).toBe(HttpStatus.NOT_FOUND);
        },
    );
});
