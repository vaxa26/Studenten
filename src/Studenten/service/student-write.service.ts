import { Injectable, NotFoundException } from "@nestjs/common";
import { Student } from "../entity/studenten.entity.js";
import { type DeleteResult, Repository } from "typeorm";
import { StudentReadService } from "./student-read.service.js";
import { getLogger } from "../../logger/logger.js";
import { InjectRepository } from "@nestjs/typeorm";
import { Name } from "../entity/name.entity.js";
import { Foto } from "../entity/foto.entity.js";
import { matrikelnrException, VersionInvalidException, VersionOutdatedException } from "./exceptions.js";

export type UpdateParams = {

    readonly id: number | undefined;
    readonly student: Student;
    readonly version: string;
};

@Injectable()
export class StudentWriteService {
    private static readonly VERSION_PATTERN = /^"\d{1,3}"/u;

    readonly #repo: Repository<Student>;

    readonly #readService: StudentReadService;

    //TODO Mailservice

    readonly #logger = getLogger(StudentWriteService.name)

    constructor(
        @InjectRepository(Student) repo: Repository<Student>,
        readservice: StudentReadService,
        //TODO Mailservice
    ) {
        this.#repo = repo;
        this.#readService = readservice;
        //TODO mail
    }

    async create(student: Student) {
        this.#logger.debug('create: student=%o', student)
        await this.#validateCreate(student);

        const studentDb = await this.#repo.save(student);
        await this.#validateCreate(student);

        return studentDb.id!;
    }

    async update({ id, student, version }: UpdateParams) {
        this.#logger.debug(
            'update: id=%d, student=%o, version=%s',
            id,
            student,
            version,
        );
        if (id === undefined) {
            this.#logger.debug('update: ungueltige ID');
            throw new NotFoundException(`Es gibt kein Student mit der ID ${id}.`);
        }

        const validateResult = await this.#validateUpdate(student, id, version);
        this.#logger.debug('update: validateResult=%o', validateResult);
        if (!(validateResult instanceof Student)) {
            return validateResult;
        }

        const StudentNeu = validateResult;
        const merged = this.#repo.merge(StudentNeu,  student);
        this.#logger.debug('update: merged=%o', merged);
        const updated = await this.#repo.save(merged);
        this.#logger.debug('update: update=%o', updated)

        return updated.version!;
    }

    async delete(id: number) {
        this.#logger.debug('delete: id=%d', id);
        const student = await this.#readService.findById({
            id,
            mitFotos: true,
        });

        let deleteResult: DeleteResult | undefined;
        await this.#repo.manager.transaction(async (transactionalMgr) => {

            const nameid = student.name?.id;
            if (nameid !== undefined) {
                await transactionalMgr.delete(Name, nameid);
            }

            const fotos = student.fotos ?? [];
            for (const foto of fotos) {
                await transactionalMgr.delete(Foto, foto.id)
            }

            deleteResult = await transactionalMgr.delete(Student, id);
            this.#logger.debug('delete: deleteResult=%o', deleteResult);
        });

        return (
            deleteResult?.affected !== undefined &&
            deleteResult.affected !== null &&
            deleteResult.affected > 0
        );
    }

    async #validateCreate ({ matrikelnr }: Student) {
        this.#logger.debug('#validateCreate: matrikelnr=%s', matrikelnr);
        if (await this.#repo.existsBy({ matrikelnr })) {
            throw new matrikelnrException(matrikelnr);
        }
    }

    //TODO mail

    async #validateUpdate(
        student: Student,
        id: number,
        versionStr: string,
    ): Promise<Student> {
        this.#logger.debug(
            '#validateUpdate: student=%o, id=%s, versionStr=%s',
            student,
            id,
            versionStr,
        );
        if (!StudentWriteService.VERSION_PATTERN.test(versionStr)) {
            throw new VersionInvalidException(versionStr);
        }

        const version = Number.parseInt(versionStr.slice(1, -1), 10);
        this.#logger.debug(
            '#validateUpdate: student=%o, version=%d',
            student,
            version,
        );

        const studentDb = await this.#readService.findById({ id });

        const versionDb = studentDb.version!;
        if (version < versionDb) {
            this.#logger.debug('#validateUpdate: versionDb=%d', version);
            throw new VersionOutdatedException(version);
        }
        this.#logger.debug('#validateUpdate: studentDb=%o', studentDb);
        return studentDb
    }


}