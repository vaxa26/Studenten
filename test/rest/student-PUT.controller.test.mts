import axios, { AxiosInstance, AxiosResponse } from 'axios';
import client from 'prom-client';
import { baseURL, httpsAgent } from '../constants.mts';
import { inject } from 'vitest';
import { HttpStatus } from '@nestjs/common';
const geanderterStudent = {
    id: 1,
    matrikelnr: '12345',
    studiengang: 'IIB',
    guthaben: '222.22',
    bd: '2004-07-26',
    name: {
        id: 1,
        vorname: 'VietAnh',
        nachname: 'Vu',
    },
};

const geanderterfalscherStudent = {
    id: 1,
    matrikelnr: '12345',
    studiengang: 'IIBww',
    guthaben: '-222.22',
    bd: '20014-07-26',
    name: {
        id: 1,
        vorname: 'VietAnh',
        nachname: 'Vu',
    },
};

const token = inject('tokenRest');

const idVorhanden = '1';

const idNichtVorhanden = '000';

describe('PUT /rest/:id', () => {
    let client: AxiosInstance;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    beforeAll(async () => {
        client = axios.create({
            baseURL,
            headers,
            httpsAgent,
            validateStatus: (status) => status < 500,
        });
    });

    test('Vorhandener Student aendern', async () => {
        // given
        const url = `/rest/${idVorhanden}`;
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"0"';

        // when
        const { status, data }: AxiosResponse<string> = await client.put(
            url,
            geanderterStudent,
            { headers },
        );

        // then
        expect(status).toBe(HttpStatus.NO_CONTENT);
        expect(data).toBe('');
    });

    test('Nicht-vorhandenes Buch aendern', async () => {
        // given
        const url = `/rest/${idNichtVorhanden}`;
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"0"';

        // when
        const { status }: AxiosResponse<string> = await client.put(
            url,
            geanderterStudent,
            { headers },
        );

        // then
        expect(status).toBe(HttpStatus.NOT_FOUND);
    });

    test('Vorhandenes Buch aendern, aber mit ungueltigen Daten', async () => {
        // given
        const url = `/rest/${idVorhanden}`;
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"0"';
        const expectedMsg = [
            expect.stringMatching(/^studiengang /u),
            expect.stringMatching(/^guthaben /u),
            expect.stringMatching(/^bd /u),
        ];

        // when
        const { status, data }: AxiosResponse<Record<string, any>> =
            await client.put(url, geanderterfalscherStudent, { headers });

        // then
        expect(status).toBe(HttpStatus.BAD_REQUEST);

        const messages = data.message as string[];

        expect(messages).toBeDefined();
        expect(messages).toHaveLength(expectedMsg.length);
        expect(messages).toStrictEqual(expect.arrayContaining(expectedMsg));
    });
});
