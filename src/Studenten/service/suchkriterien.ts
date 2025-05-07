import { studiengang } from '../entity/studenten.entity';

export interface Suchkriterien {
    readonly matrikelnr?: string;
    readonly studiengang?: studiengang;
    readonly guthaben?: number;
    readonly bd?: string;

    readonly name?: string;
}
