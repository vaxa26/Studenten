import { IsInt, IsNumberString, Min } from 'class-validator';
import { StudentDTO } from '../controller/studentDTO.entity.js';
import { UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard, Roles } from 'nest-keycloak-connect';
import { HttpExceptionFilter } from './http-exception.filter.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { StudentWriteService } from '../service/student-write.service.js';
import { getLogger } from '../../logger/logger.js';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { type IdInput } from './student-query.resolver.js';
import { type Student } from '../entity/studenten.entity.js';
import { type Name } from '../entity/name.entity.js';
import { type Foto } from '../entity/foto.entity.js';
import Decimal from 'decimal.js';

export type CreatePayload = {
    readonly id: number;
};

export type UpdatePayload = {
    readonly version: number;
};

export class StudentUpdateDTO extends StudentDTO {
    @IsNumberString()
    readonly id!: string;

    @IsInt()
    @Min(0)
    readonly version!: number;
}

@Resolver('Student')
@UseGuards(AuthGuard)
@UseFilters(HttpExceptionFilter)
@UseInterceptors(ResponseTimeInterceptor)
export class StudentMutationResolver {
    readonly #service: StudentWriteService;

    readonly #logger = getLogger(StudentMutationResolver.name);

    constructor(service: StudentWriteService) {
        this.#service = service;
    }

    @Mutation()
    @Roles('admin', 'user')
        async create(@Args('input')studentDTO: StudentDTO) {
        this.#logger.debug('create: studentDTO=%o', studentDTO);

        const student= this.#studentDtoToStudent(studentDTO);
        const id = await this.#service.create(student);
        this.#logger.debug('createStuden: id=%d', id);
        const payload: CreatePayload = { id };
        return payload
    }

    @Mutation()
    @Roles('admin', 'user')
    async update(@Args('input') studentDTO: StudentUpdateDTO) {
        this.#logger.debug('update: student=%o', studentDTO);

        const student = this.#studentUpdateDtoTOStudent(studentDTO);
        const versionStr = `"${studentDTO.version.toString()}"`;

        const versionResult= await this.#service.update({
            id: Number.parseInt(studentDTO.id, 10),
            student,
            version: versionStr,
        });
        // TODO BadUserInputError
        this.#logger.debug('updateStudent: versionResult=%d', versionResult);
        const payload: UpdatePayload = { version: versionResult };
        return payload;
    }

    @Mutation()
    @Roles('admin')
    async delete(@Args() id: IdInput) {
        const idStr = id.id;
        this.#logger.debug('delete: id=%s', idStr);
        const deletePerformed = await this.#service.delete(idStr);
        this.#logger.debug('deleteStudent: deletePerformed=%s', deletePerformed);
        return deletePerformed;
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
            created: new Date(),
            updated: new Date(),
    
        };

        student.name!.student = student;
        return student;
    }

    #studentUpdateDtoTOStudent(studentDTO: StudentUpdateDTO): Student {
        return {
            id: undefined,
            version: undefined,
            matrikelnr: studentDTO.matrikelnr,
            studiengang: studentDTO.studiengang,
            guthaben: Decimal(studentDTO.guthaben),
            bd: studentDTO.bd,        
            name: undefined,
            fotos: undefined,
            created: undefined,
            updated: new Date(),
        }
    }
}