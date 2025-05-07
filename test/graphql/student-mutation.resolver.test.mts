/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { beforeAll, describe, expect, inject, test } from 'vitest';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { baseURL, httpsAgent } from '../constants.mjs';
import { type GraphQLQuery, type GraphQLResponseBody } from './graphql.mjs';
import { HttpStatus } from '@nestjs/common';

const token = inject('tokenGraphql');
const tokenUser = inject('tokenUserGraphql');

const idLoeschen = '3';

describe('GraphQL Mutation Resolver', () => {
    let client: AxiosInstance;
    const graphqlPath = 'graphql';

    beforeAll(async () => {
        client = axios.create({
            baseURL,
            httpsAgent,
        });
    });

    test('New Student', async () => {
        //given
        const authorization = { Authorization: `Bearer ${token}` };
        const body: GraphQLQuery = {
            query: `
                mutation {
                    create(
                        input: {
                            matrikelnr: "66666",
                            studiengang: WI,
                            guthaben: 11221.22,
                            bd: "2004-07-26",
                            name: {
                            vorname: "Max",
                            nachname: "Mustermann"
                            }
                        }
                        ) {
                            id
                        }
                    }
                `,
        };

        //when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body, { headers: authorization });

        //then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data).toBeDefined();

        const { create } = data.data!;

        expect(create).toBeDefined();
        expect(create.id).toBeGreaterThan(0);
    });

    test('Student mit ungültigen Daten anlegen', async () => {
        //given
        const authorization = { Authorization: `Bearer ${token}` };
        const body: GraphQLQuery = {
            query: `
                mutation {
                    create(
                        input: {
                            matrikelnr: "5555",
                            studiengang: WI,
                            guthaben: -11221.22,
                            bd: "20042-07-26",
                            name: {
                                nachname: "!!!!!!",
                                vorname: "Max"
                            },
                        }
                    ) {
                        id
                    }
                }
            `,
        };
        const expectedMsg = [
            expect.stringMatching(/^guthaben /u),
            expect.stringMatching(/^bd /u),
        ];

        //when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body, { headers: authorization });

        //then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.create).toBeNull();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;

        expect(error).toBeDefined();

        const { message } = error;
        const messages: string[] = message.split(',');

        expect(messages).toBeDefined();
        expect(messages).toHaveLength(expectedMsg.length);
        expect(messages).toStrictEqual(expect.arrayContaining(expectedMsg));
    });

    test('Student Aktualisieren', async () => {
        //given
        const authorization = { Authorization: `Bearer ${token}` };
        const body: GraphQLQuery = {
            query: `
                mutation {
                    update (
                        input: {
                            id: "4",
                            version: 0,
                            matrikelnr: "45678",
                            studiengang: IIB,
                            guthaben: 11221.22,
                            bd: "2011-02-22",
                        }
                    ) {
                         version
                    }
                }
            `,
        };

        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body, { headers: authorization });

        //then
        expect(status).toBe(200);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();

        const { update } = data.data!;

        expect(update.version).toBe(1);
    });

    test('Student mit ungültigen Daten aktualisieren', async () => {
        //given
        const authorization = { Authorization: `Bearer ${token}` };
        const id = '3';
        const body: GraphQLQuery = {
            query: `
                mutation {
                    update(
                        input: {
                            id: "${id}",
                            version: 0,
                            matrikelnr: "11111",
                            studiengang: MB,
                            guthaben: -123123.333,
                            bd: "20104-07-26",
                        }
                    ) {
                        version
                    }
                }
            `,
        };
        const expectedMsg = [
            expect.stringMatching(/^guthaben /u),
            expect.stringMatching(/^bd /u),
        ];

        //when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body, { headers: authorization });

        //then
        expect(status).toBe(200);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.update).toBeNull();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { message } = error;
        const messages: string[] = message.split(',');

        expect(messages).toBeDefined();
        expect(messages).toHaveLength(expectedMsg.length);
        expect(messages).toStrictEqual(expect.arrayContaining(expectedMsg));
    });

    test('Student löschen', async () => {
        //given
        const authorization = { Authorization: `Bearer ${token}` };
        const body: GraphQLQuery = {
            query: `
                mutation {
                    delete(id: "${idLoeschen}") 
                }
            `,
        };
        //when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body, { headers: authorization });

        //then
        expect(status).toBe(200);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();

        const deleteMutation = data.data!.delete as boolean;

        expect(deleteMutation).toBe(true);
    });

    test('Student loeschen als "user"', async () => {
        // given
        const authorization = { Authorization: `Bearer ${tokenUser}` };
        const body: GraphQLQuery = {
            query: `
                mutation {
                    delete(id: "5")
                }
            `,
        };

        // when
        const {
            status,
            headers,
            data,
        }: AxiosResponse<Record<'errors' | 'data', any>> = await client.post(
            graphqlPath,
            body,
            { headers: authorization },
        );

        // then
        expect(status).toBe(200);
        expect(headers['content-type']).toMatch(/json/iu);

        const { errors } = data as { errors: any[] };

        expect(errors[0].message).toBe('Unauthorized');
        expect(errors[0].extensions.code).toBe('BAD_USER_INPUT');
        expect(data.data.delete).toBeNull();
    });
});
/* eslint-enable @typescript-eslint/no-non-null-assertion */
