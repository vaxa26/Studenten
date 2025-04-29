import { Injectable } from '@nestjs/common';
import { Student } from '../entity/studenten.entity.js';
import { Name } from '../entity/name.entity.js';
import { Foto } from '../entity/foto.entity.js';
import { Repository } from 'typeorm';
import { getLogger } from '../../logger/logger.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Suchkriterien } from './suchkriterien.js';
import {
    DEFAULT_PAGE_NUMBER,
    DEFAULT_PAGE_SIZE,
    Pageable,
} from './pageable.js';
import { typeOrmModuleOptions } from '../../config/typeormOptions.js';

export type BuidlIdParams = {
    readonly id: number;

    readonly mitFotos?: boolean;
};

@Injectable()
export class QueryBuilder {
    readonly #studentAlias = `${Student.name
        .charAt(0)
        .toLowerCase()}${Student.name.slice(1)}`;

    readonly #nameAlias = `${Name.name
        .charAt(0)
        .toLowerCase()}${Name.name.slice(1)}}`;

    readonly #fotoAlias = `${Foto.name
        .charAt(0)
        .toLowerCase()}${Foto.name.slice(1)}`;

    readonly #repo: Repository<Student>;

    readonly #logger = getLogger(QueryBuilder.name);

    constructor(@InjectRepository(Student) repo: Repository<Student>) {
        this.#repo = repo;
    }

    buildId({ id, mitFotos = false }: BuidlIdParams) {
        const queryBuilder = this.#repo.createQueryBuilder(this.#studentAlias);

        queryBuilder.innerJoinAndSelect(
            `${this.#studentAlias}.name`,
            this.#nameAlias,
        );

        if (mitFotos) {
            queryBuilder.innerJoinAndSelect(
                `${this.#studentAlias}.fotos`,
                this.#fotoAlias,
            );
        }
        queryBuilder.where(`${this.#studentAlias}.id = :id`, { id: id });
        return queryBuilder;
    }

    build(
        { name, matrikelnr, guthaben, ...restProps }: Suchkriterien,
        pageable: Pageable,
    ) {
        this.#logger.debug(
            'build: name=%s, matrikelnr=%s, guthaben=%s, restProps=%o, pageable=%o',
            name,
            matrikelnr,
            guthaben,
            restProps,
            pageable,
        );

        let queryBuilder = this.#repo.createQueryBuilder(this.#studentAlias);
        queryBuilder.innerJoinAndSelect(`${this.#studentAlias}.name`, 'name');

        let useWhere = true;

        if (name !== undefined && typeof name === 'string') {
            const ilike =
                typeOrmModuleOptions.type === 'postgres' ? 'ilike' : 'like';
            queryBuilder = queryBuilder.where(
                `${this.#nameAlias}.name ${ilike} :name`,
                { name: `${name}` },
            );
            useWhere = false;
        }

        if (matrikelnr !== undefined) {
            const matrikelnrNumber =
                typeof matrikelnr === 'string'
                    ? parseInt(matrikelnr)
                    : matrikelnr;
            if (!isNaN(matrikelnrNumber)) {
                queryBuilder = queryBuilder.where(
                    `${this.#studentAlias}.matrikelnr >=${matrikelnrNumber}`,
                );
                useWhere = false;
            }
        }

        //::::::::SCHLAGWÖRTER TODO:::::::::::::::

        Object.entries(restProps).forEach(([key, value]) => {
            const param: Record<string, any> = {};
            param[key] = value;
            queryBuilder = useWhere
                ? queryBuilder.where(
                      `${this.#studentAlias}.${key} = :${key}`,
                      param,
                  )
                : queryBuilder.andWhere(
                      `${this.#studentAlias}.${key} = :${key}`,
                      param,
                  );
            useWhere = false;
        });

        this.#logger.debug('build: sql=%s', queryBuilder.getSql());

        if (pageable?.size === 0) {
            return queryBuilder;
        }
        const size = pageable?.size ?? DEFAULT_PAGE_SIZE;
        const number = pageable?.number ?? DEFAULT_PAGE_NUMBER;
        const skip = number * size;
        this.#logger.debug('take=%s, skip=%s', size, skip);
        return queryBuilder.take(size).skip(skip);
    }
}
