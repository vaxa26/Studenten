/* eslint-disable @typescript-eslint/no-non-null-assertion */
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { beforeAll, describe, expect, test } from 'vitest';
import { GraphQLRequest } from '@apollo/server';
import { HttpStatus } from '@nestjs/common';
import { Student } from '../../src/Studenten/entity/studenten.entity';
import { studiengang } from '../../dist/Studenten/entity/studenten.entity';
import { type GraphQLResponseBody } from './graphql.mjs';
import { baseURL, httpsAgent } from '../constants.mjs';

type StudentDTO = Omit<Student, 'fotos' | 'created' | 'updated'> & {
    matrikelNr: string;
};

const idVorhanden = '1';

const nameVorhanden = 'Vu';
const teilnameVorhanden = 'a';
const teilnamenichtvorhanden = 'xyz';

const matrikelNrVorhanden = '12345';

describe('GraphQL-Query-Resolver', () => {
    let client: AxiosInstance;
    const graphqlPath = 'graphql';

    beforeAll(async () => {
        const baseUrlGraphQL = `${baseURL}/`;
        client = axios.create({
            baseURL: baseUrlGraphQL,
            httpsAgent,
            validateStatus: () => true,
        });
    });

    test.concurrent('Student mit ID abfragen', async () => {
        const body: GraphQLRequest = {
            query: `
                {
                    student(id: "${idVorhanden}") {
                        version
                        matrikelnr
                        studiengang
                        guthaben
                        bd
                        name {
                            nachname
                            vorname
                        }
                    }
                }
            `,
        };

        //when
        const { status, headers, data }: AxiosResponse = await client.post(
            graphqlPath,
            body,
        );

        //then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();
        expect(data.data).toBeDefined();

        const { student } = data.data! as { student: StudentDTO };

        expect(student.name?.nachname).toMatch(/^\w+/iu);
        expect(student.version).toBeGreaterThan(-1);
        expect(student.id).toBeUndefined();
    });

    test.concurrent('Student mit nicht vorhandener ID abfragen', async () => {
        //given
        const id = '99999';
        const body: GraphQLRequest = {
            query: `
            {
                student(id: "${id}") {
                    name {
                        nachname
                    }
                }
            }
            `,
        };
        //when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        //then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.student).toBeNull();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { message, path, extensions } = error;

        expect(message).toBe(`Es gibt kein Student mit der ID ${id}!`);
        expect(path).toBeDefined();
        expect(path![0]).toBe('student');
        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('BAD_USER_INPUT');
    });

    test.concurrent('Student mit vorhandenem Namen abfragen', async () => {
        //given
        const body: GraphQLRequest = {
            query: `
                {
                    studenten(suchkriterien: {
                        name: "${nameVorhanden}"
                    }) {
                        matrikelnr
                        studiengang
                        name {
                            nachname
                            vorname
                        }
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(200);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();
        expect(data.data).toBeDefined();

        const { studenten: studenten } = data.data! as {
            studenten: StudentDTO[];
        };

        expect(studenten).not.toHaveLength(0);
        expect(studenten).toHaveLength(1);

        const [student] = studenten;

        expect(student!.name?.nachname).toBe(nameVorhanden);
    });

    test.concurrent('Student mit vorhandenem Teilnamen abfragen', async () => {
        //given
        const body: GraphQLRequest = {
            query: `
                {
                    studenten(suchkriterien: {
                        name: "${teilnameVorhanden}"
                    }) {
                        name {
                            nachname
                        }
                    }
                }
            `,
        };

        //when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        //then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();
        expect(data.data).toBeDefined();

        const { studenten } = data.data! as { studenten: StudentDTO[] };

        expect(studenten).not.toHaveLength(0);

        studenten
            .map((student: StudentDTO) => student.name)
            .forEach((name) =>
                expect(name?.nachname?.toLowerCase()).toStrictEqual(
                    expect.stringContaining(teilnameVorhanden),
                ),
            );
    });

    test.concurrent('Student zu nicht vorhandenem Namen abfragen', async () => {
        //given
        const body: GraphQLRequest = {
            query: `
            {
                studenten(suchkriterien: {
                        name: "${teilnamenichtvorhanden}"
                    }) {
                    studiengang
                    name {
                        nachname
                    }
                }
            }`,
        };

        //when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        //then
        expect(status).toBe(200);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.studenten).toBeNull();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { message, path, extensions } = error;

        expect(message).toMatch(/^Keine Studenten gefunden:/u);
        expect(path).toBeDefined();
        expect(path![0]).toBe('studenten');
        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('BAD_USER_INPUT');
    });

    test.concurrent('Student mit Matrikelnummer abfragen', async () => {
        //given
        const body: GraphQLRequest = {
            query: `
            {
                studenten(suchkriterien:{
                    matrikelnr: "${matrikelNrVorhanden}"
                    }) {
                        id
                        matrikelnr
                        name {
                            nachname
                            vorname
                        }
                }
            }`,
        };

        //when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);
        //then

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();

        const { studenten } = data.data! as { studenten: StudentDTO[] };

        expect(studenten).not.toHaveLength(0);
        expect(studenten).toHaveLength(1);

        const [student] = studenten;
        const { matrikelnr, name } = student!;

        expect(matrikelnr).toBe(matrikelNrVorhanden);
        expect(name?.nachname).toBeDefined();
    });

    test.concurrent('Studenten mit Studiengang WI abfragen', async () => {
        // given
        const studiengangWi: studiengang = 'WI';
        const body: GraphQLRequest = {
            query: `
            {
                studenten(suchkriterien: {
                    studiengang: ${studiengangWi}
                }) {
                    id
                    matrikelnr
                    studiengang
                    name {
                        nachname
                        vorname
                    }
                }
            }`,
        };

        //when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        //then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();
        expect(data.data).toBeDefined();

        const { studenten } = data.data! as { studenten: StudentDTO[] };

        expect(studenten).not.toHaveLength(0);

        studenten.forEach((student) => {
            const { studiengang, name } = student;

            expect(studiengang).toBe(studiengangWi);
            expect(name?.nachname).toBeDefined();
        });
    });

    test.concurrent(
        'Studenten mit Studiengang nicht vorhanden abfragen',
        async () => {
            //given
            const studiengang = 'xyz';
            const body: GraphQLRequest = {
                query: `
                    {
                        studenten(suchkriterien: {
                            studiengang: ${studiengang}
                        }) {
                            id
                            matrikelnr
                            studiengang
                            name {
                                nachname
                                vorname
                            }
                        }
                    }
                `,
            };

            //when
            const {
                status,
                headers,
                data,
            }: AxiosResponse<GraphQLResponseBody> = await client.post(
                graphqlPath,
                body,
            );

            //then
            expect(status).toBe(HttpStatus.BAD_REQUEST);
            expect(headers['content-type']).toMatch(/json/iu);
            expect(data.data).toBeUndefined();

            const { errors } = data;

            expect(errors).toHaveLength(1);

            const [error] = errors!;
            const { extensions } = error;

            expect(extensions).toBeDefined();
            expect(extensions!.code).toBe('GRAPHQL_VALIDATION_FAILED');
        },
    );
});
/* eslint-enable @typescript-eslint/no-non-null-assertion */
