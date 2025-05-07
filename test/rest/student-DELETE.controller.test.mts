import { beforeAll, describe, expect, inject, test } from 'vitest';
import axios, { AxiosResponse, type AxiosInstance } from 'axios';
import { baseURL, httpsAgent } from '../constants.mjs';
import { HttpStatus } from '@nestjs/common';

const token = inject('tokenRest');
const tokenUser = inject('tokenRestUser');

const id = '5';

describe('DELETE /rest', () => {
    let client: AxiosInstance;

    beforeAll(async () => {
        const restURL = `${baseURL}/rest`;
        client = axios.create({
            baseURL: restURL,
            httpsAgent,
            validateStatus: (status) => status < 500,
        });
    });

    test.concurrent('Student löschen', async () => {
        // given
        const url = `/${id}`;
        const headers: Record<string, string> = {
            Authorization: `Bearer ${token}`,
        };

        // when
        const { status, data }: AxiosResponse<string> = await client.delete(
            url,
            {
                headers,
            },
        );

        // then
        expect(status).toBe(HttpStatus.NO_CONTENT);
        expect(data).toBeDefined();
    });

    test.concurrent('Vorhandenes Student als "user" loeschen', async () => {
        // given
        const url = `/5`;
        const headers: Record<string, string> = {
            Authorization: `Bearer ${tokenUser}`,
        };

        // when
        const response: AxiosResponse<string> = await client.delete(url, {
            headers,
        });

        // then
        expect(response.status).toBe(HttpStatus.FORBIDDEN);
    });
});
