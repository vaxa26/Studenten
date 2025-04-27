import { UseFilters, UseInterceptors } from '@nestjs/common';
import { type Suchkriterien } from '../service/suchkriterien.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { StudentReadService } from '../service/student-read.service.js';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { HttpExceptionFilter } from './http-exception.filter.js';
import { getLogger } from '../../logger/logger.js';
import { Public } from 'nest-keycloak-connect';
import { createPageable } from '../service/pageable.js';
export type IdInput = {
    readonly id: number;
};

export type SuchkriterienInput = {
    readonly suchkriterien: Suchkriterien;
};

@Resolver('Student')
@UseFilters(HttpExceptionFilter)
@UseInterceptors(ResponseTimeInterceptor)
export class StudentQueryResolver {
    readonly #service: StudentReadService;

    readonly #logger = getLogger(StudentQueryResolver.name);

    constructor(service: StudentReadService) {
        this.#service = service;
    }

    @Query('student')
    @Public()
    async findById(@Args() { id }: IdInput) {
        this.#logger.debug('findById: id=%d', id);

        const student = await this.#service.findById({ id });

        if(this.#logger.isLevelEnabled('debug')) {
            this.#logger.debug(
                'findById: student=%s, name=%o',
                student.toString(),
                student.name,
            );
        }
        return student;
    }

    @Query('studenten')
    @Public()
    async find(@Args() input: SuchkriterienInput | undefined) {
        this.#logger.debug('find: input=%o', input);
        const pageable = createPageable({});
        const studentenSlice = await this.#service.find(
            input?.suchkriterien,
            pageable,
        );
        this.#logger.debug('find: studentenSlice=%o', studentenSlice);
        return studentenSlice.content;
    }
}