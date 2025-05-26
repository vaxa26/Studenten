import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiNoContentResponse,
    ApiOperation,
    ApiParam,
    ApiPreconditionFailedResponse,
    ApiTags,
    ApiResponse,
} from '@nestjs/swagger';
import { StudentWriteService } from '../service/student-write.service.js';
import {
    Body,
    Controller,
    Delete,
    Headers,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Req,
    Res,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { AuthGuard, Public, Roles } from 'nest-keycloak-connect';
import { ResponseTimeInterceptor } from '../logger/response-time.interceptor.js';
import { paths } from '../../config/paths.js';
import { getLogger } from '../logger/logger.js';
import { StudentDTO, StudentOhneRef } from './studentDTO.entity.js';
import { createBaseUri } from './createBaseUri.js';
import { Student } from '../entity/studenten.entity.js';
import { type Name } from '../entity/name.entity.js';
import { Foto } from '../entity/foto.entity.js';
import Decimal from 'decimal.js';
import { Express, Request, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

const MSG_FORBIDDEN = 'You are not allowed to perform this action';

/**
 * Controller für Post, Put und Delete
 */
@Controller(paths.rest)
@UseGuards(AuthGuard)
@UseInterceptors(ResponseTimeInterceptor)
@ApiTags('Student REST-API')
@ApiBearerAuth()
export class StudentWriteController {
    readonly #service: StudentWriteService;

    readonly #logger = getLogger(StudentWriteController.name);

    constructor(service: StudentWriteService) {
        this.#service = service;
    }

    /**
     * Erstellt einen neuen Studenten.
     * @param studentDTO - Die Daten des Studenten, die erstellt werden sollen.
     * @param req - Die Anfrage, um die Basis-URI zu erstellen.
     * @param res - Die Antwort, um den Status und die Location zu setzen.
     * @returns Eine Response mit dem Status 201 Created und der Location des neuen Studenten.
     */
    @Post()
    @Roles('admin', 'user')
    @ApiOperation({ summary: 'Create a new student' })
    @ApiCreatedResponse({ description: 'Student created successfully' })
    @ApiBadRequestResponse({ description: 'Invalid input data' })
    @ApiForbiddenResponse({ description: MSG_FORBIDDEN })
    async post(
        @Body() studentDTO: StudentDTO,
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<Response> {
        this.#logger.debug('post: studentDTO=%o', studentDTO);

        const student = this.#studentDtoToStudent(studentDTO);
        const id = await this.#service.create(student);

        const location = `${createBaseUri(req)}/${id}`;
        this.#logger.debug('post: location=%s', location);
        return res.location(location).send();
    }

    /**
     * Fügt eine Binärdatei zu einem Studenten hinzu.
     * @param id id des Studenten, zu dem die Datei hinzugefügt werden soll.
     * @param file Die hochgeladene Datei, die als Binärdatei gespeichert werden soll.
     * @param req Request-Objekt von Express, um die Basis-URI zu erstellen.
     * @param res Response-Objekt von Express, um den Status und die Location zu setzen.
     * @returns Leeres Promise-Objekt.
     */
    @Post(':id')
    @Public()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Binärdatei hochladen' })
    @ApiParam({
        name: 'id',
        description: 'Zb 1',
    })
    @ApiCreatedResponse({ description: 'Binärdatei erfolgreich hochgeladen' })
    @ApiBadRequestResponse({ description: 'Ungültige Eingabedaten' })
    @ApiForbiddenResponse({ description: MSG_FORBIDDEN })
    @UseInterceptors(FileInterceptor('file'))
    async addFile(
        @Param(
            'id',
            new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_FOUND }),
        )
        id: number,
        @UploadedFile() file: Express.Multer.File,
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<Response> {
        this.#logger.debug(
            'addFile: id: %d, originalname=%s, mimetype=%s',
            id,
            file.originalname,
            file.mimetype,
        );

        await this.#service.addFile(
            id,
            file.buffer,
            file.originalname,
            file.mimetype,
        );

        const location = `${createBaseUri(req)}/file/${id}`;
        this.#logger.debug('addFile: location=%s', location);
        return res.location(location).send();
    }

    /**
     * Vorhandener Studenten aktualisiert.
     * @param studentDTO  Studenten-Daten ohne Referenzen.
     * @param id Id eines Studenten, der aktualisiert werden soll.
     * @param version Version des Studenten, die im Header If-Match übergeben wird.
     * @param res Response-Objekt von Express, um den Status und die Header zu setzen.
     * @returns Leeres Promise-Objekt.
     */
    @Put(':id')
    @Roles('admin', 'user')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Update student by ID' })
    @ApiParam({
        name: 'If-Match',
        description: 'Version des Studenten',
        required: false,
    })
    @ApiNoContentResponse({ description: 'Student updated successfully' })
    @ApiBadRequestResponse({ description: 'Invalid input data' })
    @ApiPreconditionFailedResponse({
        description: 'Wrong Version im Header',
    })
    @ApiResponse({
        status: HttpStatus.PRECONDITION_FAILED,
        description: 'Header If-Match fehlt',
    })
    @ApiForbiddenResponse({ description: MSG_FORBIDDEN })
    async put(
        @Body() studentDTO: StudentOhneRef,
        @Param(
            'id',
            new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_FOUND }),
        )
        id: number,
        @Headers('If-Match') version: string | undefined,
        @Res() res: Response,
    ): Promise<Response> {
        this.#logger.debug(
            'put: studentDTO=%o, id=%d, version=%s',
            studentDTO,
            id,
            version,
        );

        if (version === undefined) {
            const msg = 'Header If-Match fehlt';
            this.#logger.debug('put: %s', msg);
            return res
                .status(HttpStatus.PRECONDITION_FAILED)
                .send()
                .set('Content-Type', 'application/json')
                .send(msg);
        }

        const student = this.#studenDtoOhneRefToStudent(studentDTO);
        const newVersion = await this.#service.update({ id, student, version });
        this.#logger.debug('put: newVersion=%s', newVersion);
        return res.header('ETag', `"${newVersion}"`).send();
    }

    /**
     * Löscht einen Studenten anhand der ID.
     * @param id ID des Studenten, der gelöscht werden soll.
     */
    @Delete(':id')
    @Roles('admin')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete student by ID' })
    @ApiNoContentResponse({ description: 'Student deleted successfully' })
    @ApiForbiddenResponse({ description: MSG_FORBIDDEN })
    async delete(@Param('id') id: number) {
        this.#logger.debug('delete: id=%d', id);
        await this.#service.delete(id);
    }

    #studentDtoToStudent(studentDTO: StudentDTO): Student {
        const nameDTO = studentDTO.name;
        const name: Name = {
            id: undefined,
            vorname: nameDTO.vorname,
            nachname: nameDTO.nachname,
            student: undefined,
        };
        const fotos = studentDTO.fotos?.map((fotoDTO) => {
            const foto: Foto = {
                id: undefined,
                beschriftung: fotoDTO.beschriftung,
                contentType: fotoDTO.contentType,
                student: undefined,
            };
            return foto;
        });
        const student: Student = {
            id: undefined,
            version: undefined,
            matrikelnr: studentDTO.matrikelnr,
            studiengang: studentDTO.studiengang,
            guthaben: Decimal(studentDTO.guthaben),
            bd: studentDTO.bd,
            name,
            fotos,
            file: undefined,
            created: new Date(),
            updated: new Date(),
        };
        name.student = student;
        student.fotos?.forEach((foto) => {
            foto.student = student;
        });
        return student;
    }

    #studenDtoOhneRefToStudent(studentDTO: StudentOhneRef): Student {
        return {
            id: undefined,
            version: undefined,
            matrikelnr: studentDTO.matrikelnr,
            studiengang: studentDTO.studiengang,
            guthaben: studentDTO.guthaben,
            bd: studentDTO.bd,
            name: undefined,
            fotos: undefined,
            file: undefined,
            created: undefined,
            updated: new Date(),
        };
    }
}
