import { studiengang } from '../entity/studenten.entity';

export interface Suchkriterien {
    readonly matrikelnr?: number;
    readonly studiengang?: studiengang;
    readonly guthaben?: number;
    readonly bd?: string;

    readonly name?: string;
}
