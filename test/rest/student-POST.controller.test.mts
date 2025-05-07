import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { StudentDTO } from '../../src/Studenten/controller/studentDTO.entity.js';
import Decimal from 'decimal.js';
import { baseURL, httpsAgent } from '../constants.mts';
import { HttpStatus } from '@nestjs/common';
import { StudentReadService } from '../../src/Studenten/service/student-read.service.js';
import { inject } from 'vitest';

const token = inject('tokenRest');

const neuerStudent = {
    matrikelnr: '98989',
    studiengang: 'ET',
    guthaben: 26.05,
    bd: '2022-01-31',
    name: {
        nachname: 'eier',
        vorname: 'Forger',
    },
    foto: [
        {
            beschriftung: 'Abb. 1',
            contentType: 'img/png',
        },
    ],
};
const neuerStudentMitFehler: Record<string, unknown> = {
    matrikelnr: '77733',
    studiengang: 'MB',
    guthaben: -11221.22,
    bd: '20104-07-26',
    name: {
        nachname: 'Mustermann',
        vorname: 'Max',
    },
};

const neuerStudentmitMatexistiert: StudentDTO = {
    matrikelnr: '66666',
    studiengang: 'WI',
    guthaben: new Decimal(221.22),
    bd: '2004-07-26',
    name: {
        nachname: 'Mustermann',
        vorname: 'Max',
    },
    fotos: [
        {
            beschriftung: 'Mein Bild',
            contentType: 'img/png',
        },
    ],
};

describe('POST /rest', () => {
    let client: AxiosInstance;
    const restURL = `${baseURL}/rest`;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    beforeAll(async () => {
        client = axios.create({
            baseURL: restURL,
            httpsAgent: httpsAgent,
            validateStatus: (status) => status < 500,
        });
    });

    test('neuer Student', async () => {
        // given
        headers.Authorization = `Bearer ${token}`;

        // when
        const response: AxiosResponse<string> = await client.post(
            '',
            neuerStudent,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.CREATED);

        const { location } = response.headers as { location: string };

        expect(location).toBeDefined();

        // ID nach dem letzten "/"
        const indexLastSlash: number = location.lastIndexOf('/');

        expect(indexLastSlash).not.toBe(-1);

        const idStr = location.slice(indexLastSlash + 1);

        expect(idStr).toBeDefined();
        expect(StudentReadService.ID_PATTERN.test(idStr)).toBe(true);

        expect(data).toBe('');
    });

    test.concurrent('Neues Buch mit ungueltigen Daten', async () => {
        // given
        headers.Authorization = `Bearer ${token}`;
        const expectedMsg = [
            expect.stringMatching(/^guthaben /u),
            expect.stringMatching(/^bd /u),
        ];

        // when
        const response: AxiosResponse<Record<string, any>> = await client.post(
            '',
            neuerStudentMitFehler,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.BAD_REQUEST);

        const messages = data.message as string[];

        expect(messages).toBeDefined();
        expect(messages).toHaveLength(expectedMsg.length);
        expect(messages).toStrictEqual(expect.arrayContaining(expectedMsg));
    });
});
