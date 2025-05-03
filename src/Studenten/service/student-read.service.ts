import { Injectable, NotFoundException } from '@nestjs/common';
import { getLogger } from '../../logger/logger.js';
import { Student } from '../entity/studenten.entity.js';
import { QueryBuilder } from './query-builder.js';
import { Suchkriterien } from './suchkriterien.js';
import { Pageable } from './pageable.js';
import { Slice } from './slice.js';
import { Repository } from 'typeorm';
import { StudentFile } from '../entity/studentFile.entity.js';
import { InjectRepository } from '@nestjs/typeorm';

export type FindByIdParams = {
    readonly id: number;
    readonly mitFotos?: boolean;
};

@Injectable()
export class StudentReadService {
    static readonly ID_PATTERN = /^[1-9]\d{0,10}$/u;

    readonly #queryBuilder: QueryBuilder;

    readonly #fileRepo: Repository<StudentFile>;

    readonly #logger = getLogger(StudentReadService.name);

    constructor(queryBuilder: QueryBuilder, @InjectRepository(StudentFile) fileRepo: Repository<StudentFile>) {
        this.#queryBuilder = queryBuilder;
        this.#fileRepo = fileRepo;
    }

    async findById({
        id,
        mitFotos = false,
    }: FindByIdParams): Promise<Readonly<Student>> {
        this.#logger.debug('findById: id=$d', id);

        const student = await this.#queryBuilder
            .buildId({ id, mitFotos })
            .getOne();
        if (student === null) {
            throw new NotFoundException(
                `Es gibt kein Student mit der ID ${id}!`,
            );
        }
        if (this.#logger.isLevelEnabled('debug')) {
            this.#logger.debug(
                'findById: student=%s, name=%o',
                student.toString(),
                student.name,
            );
            if (mitFotos) {
                this.#logger.debug('findById: fotos=%o', student.fotos);
            }
        }
        return student;
    }

    async findFileByStudentId(
        studentId: number,
    ): Promise<Readonly<StudentFile> | undefined> {
        this.#logger.debug('findFileByStudentId: studentId=%d', studentId);
        const studentFile = await this.#fileRepo
            .createQueryBuilder('student_file')
            .where('student_id = :id', { id: studentId })
            .getOne();
        if (studentFile === null) {
            this.#logger.debug('findFileByStudentId: kein StudentFile gefunden');
            return;
        }

        this.#logger.debug('findFileByStudentId: studentFile=%o', studentFile.filename);
        return studentFile;
    }




    async find(
        suchkriterien: Suchkriterien | undefined,
        pageable: Pageable,
    ): Promise<Slice<Student>> {
        this.#logger.debug(
            'find:; suchkriterien=%o, pageable=%o',
            suchkriterien,
            pageable,
        );

        if (suchkriterien === undefined) {
            return await this.#findAll(pageable);
        }
        const keys = Object.keys(suchkriterien);
        if (keys.length === 0) {
            return await this.#findAll(pageable);
        }

        if (!this.#checkEnums(suchkriterien)) {
            throw new NotFoundException('ungeltige Suchkriterien');
        }

        const queryBuilder = this.#queryBuilder.build(suchkriterien, pageable);
        const studenten = await queryBuilder.getMany();
        if (studenten.length === 0) {
            this.#logger.debug('find: Keine Studenten gefunden');
            throw new NotFoundException(
                `Keine Studenten gefunden: ${JSON.stringify(suchkriterien)}, Seite ${pageable.number}`,
            );
        }
        const totalElements = await queryBuilder.getCount();
        return this.#createSlice(studenten, totalElements);
    }

    async #findAll(pageable: Pageable) {
        const queryBuilder = this.#queryBuilder.build({}, pageable);
        const studenten = await queryBuilder.getMany();
        if (studenten.length === 0) {
            throw new NotFoundException(
                `Ungueltige Seite "${pageable.number}"`,
            );
        }
        const totalElements = await queryBuilder.getCount();
        return this.#createSlice(studenten, totalElements);
    }

    #createSlice(studenten: Student[], totalElements: number) {
        const studentSlice: Slice<Student> = {
            content: studenten,
            totalElements,
        };
        this.#logger.debug('createSlice: studentSlice=%o', studentSlice);
        return studentSlice;
    }

    // ::::::::::::: #CHECKKEYS ::::::::::::::::::

    #checkEnums(suchkriterien: Suchkriterien) {
        const { studiengang } = suchkriterien;
        this.#logger.debug(
            '#checkEnums: Suchkriterien "studiengang=%s"',
            studiengang,
        );
        return (
            studiengang === undefined ||
            studiengang === 'WI' ||
            studiengang === 'IIB' ||
            studiengang === 'ET' ||
            studiengang === 'MB'
        );
    }
}
