import {
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiProperty,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Suchkriterien } from '../service/suchkriterien.js';
import {
    Controller,
    Get,
    HttpStatus,
    Param,
    ParseIntPipe,
    Req,
    Res,
    Headers,
    UseInterceptors,
    Query,
    NotFoundException,
    StreamableFile,
} from '@nestjs/common';
import { paths } from '../../config/paths.js';
import { ResponseTimeInterceptor } from '../logger/response-time.interceptor.js';
import { StudentReadService } from '../service/student-read.service.js';
import { Public } from 'nest-keycloak-connect';
import { Request, Response } from 'express';
import { getLogger } from '../logger/logger.js';
import { createPageable } from '../service/pageable.js';
import { createPage } from './page.js';
import { Readable } from 'node:stream';
import { Student, studiengang } from '../entity/studenten.entity.js';
/**
 * Klasse für 'StudentGetController', für Queries in OpenApi bzw Swagger.
 */
export class StudentQuery implements Suchkriterien {
    @ApiProperty({ required: false })
    declare readonly matrikelnr?: string;

    @ApiProperty({ required: false })
    declare readonly studiengang?: studiengang;

    @ApiProperty({ required: false })
    declare readonly guthaben?: number;

    @ApiProperty({ required: false })
    declare readonly bd?: string | undefined;

    @ApiProperty({ required: false })
    declare readonly name?: string;

    @ApiProperty({ required: false })
    declare size?: string;

    @ApiProperty({ required: false })
    declare page?: string;
}

/**
 * Controller Klasse um Studenten zu Verwalten.
 */
@Controller(paths.rest)
@UseInterceptors(ResponseTimeInterceptor)
@ApiTags('Student REST-API')
export class StudentGetController {
    readonly #service: StudentReadService;
    readonly #logger = getLogger(StudentGetController.name);

    constructor(service: StudentReadService) {
        this.#service = service;
    }

    /**
     * Asynchrone Mehtode um Student nach ID zu Suchen.
     * 304 für Not Modified
     * 404 für Not Found
     * 204 für erfolgreiche Suche
     * @param id Pfad-Parameter.
     * @param req Request Objekt.
     * @param version Versionsnummer.
     * @param res Leeres Response Objekt.
     * @returns Leeres Promise-Objekt.
     */
    @Get(':id')
    @Public()
    @ApiOperation({ summary: 'Get student by ID' })
    @ApiParam({
        name: 'id',
        description: 'ID of the student to retrieve',
        required: false,
    })
    @ApiOkResponse({ description: 'Student found' })
    @ApiNotFoundResponse({ description: 'Student not found' })
    @ApiResponse({
        status: HttpStatus.NOT_MODIFIED,
        description: 'Student already exists',
    })
    async getById(
        @Param(
            'id',
            new ParseIntPipe({
                errorHttpStatusCode: HttpStatus.NOT_FOUND,
            }),
        )
        id: number,
        @Req() req: Request,
        @Headers('If-None-Match') version: string | undefined,
        @Res() res: Response,
    ): Promise<Response<Student | undefined>> {
        this.#logger.debug(`getById: id=%s, version=%s`, id, version);

        if (req.accepts(['json', 'html']) === false) {
            this.#logger.debug('getById: accepted=%o', req.accepted);
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
        }

        const student = await this.#service.findById({ id });
        if (this.#logger.isLevelEnabled('debug')) {
            this.#logger.debug('getById: student=%o', student);
            this.#logger.debug('getById: name=%s', student?.name);
        }

        const versionDb = student.version;
        if (version === `"${versionDb}"`) {
            this.#logger.debug('getById: not modified');
            return res.sendStatus(HttpStatus.NOT_MODIFIED);
        }
        this.#logger.debug('getById:  versionDb=%s', versionDb);
        res.header('ETag', `"${versionDb}"`);

        this.#logger.debug('getById: student=%o', student);
        return res.json(student);
    }

    /**
     * Suche Studenten mit Suchkriterien die mind. eins erfüllen.
     * @param query Query-Objekt von Express.
     * @param req Request-Objekt von Express.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */

    @Get()
    @Public()
    @ApiOperation({ summary: 'Get with suchkriterien students' })
    @ApiOkResponse({ description: 'Students found' })
    async get(
        @Query() query: StudentQuery,
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<Response<Student[] | undefined>> {
        this.#logger.debug(`get: query=%o`, query);

        if (req.accepts(['json', 'html']) === false) {
            this.#logger.debug('get: accepted=%o', req.accepted);
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
        }

        const { page, size } = query;
        delete query['page'];
        delete query['size'];
        this.#logger.debug('get: page=%s, size=%s', page, query);

        const keys = Object.keys(query) as (keyof StudentQuery)[];
        keys.forEach((key) => {
            if (query[key] === undefined) {
                delete query[key];
            }
        });
        this.#logger.debug('get: query=%o', query);

        const pageable = createPageable({ number: page, size });
        const studentenSlice = await this.#service.find(query, pageable);
        const studentPage = createPage(studentenSlice, pageable);
        this.#logger.debug('get: studentPage=%o', studentPage);

        return res.json(studentPage).send();
    }

    @Get('/file/:id')
    @Public()
    @ApiOperation({ summary: 'Get student by ID as file' })
    @ApiParam({
        name: 'id',
        description: 'Z.B 1',
    })
    @ApiNotFoundResponse({ description: 'Data not found' })
    @ApiOkResponse({ description: 'Data found' })
    async getFileById(
        @Param('id') idStr: number,
        @Res({ passthrough: true }) res: Response,
    ) {
        this.#logger.debug(`getFileById: studentId=%s`, idStr);

        const id = Number(idStr);
        if (!Number.isInteger(id)) {
            this.#logger.debug('getById: not isInteger()');
            throw new NotFoundException(`Die ID ${id} ist ungültig`);
        }

        const studentFile = await this.#service.findFileByStudentId(id);
        if (studentFile?.data === undefined) {
            throw new NotFoundException('No Data Found');
        }

        const stream = Readable.from(studentFile.data);
        res.contentType(studentFile.mimetype ?? 'img/png').set({
            'Content-Disposition': `attachment; filename="${studentFile.filename}"`, // eslint-disable-line @typescript-eslint/naming-convention
        });
        return new StreamableFile(stream);
    }
}
