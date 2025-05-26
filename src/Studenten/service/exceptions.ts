import { HttpException, HttpStatus } from '@nestjs/common';

export class matrikelnrException extends HttpException {
    readonly matrikelnr: string | undefined;

    constructor(matrikelnr: string | undefined) {
        super(
            `Die Matrikel-Nummer ${matrikelnr} existiert bereits.`,
            HttpStatus.UNPROCESSABLE_ENTITY,
        );
        this.matrikelnr = matrikelnr;
    }
}

/**
 * Exception-Klasse für eine ungültige Versionsnummer beim Ändern.
 */
export class VersionInvalidException extends HttpException {
    readonly version: string | undefined;

    constructor(version: string | undefined) {
        super(
            `Die Versionsnummer ${version} ist ungueltig.`,
            HttpStatus.PRECONDITION_FAILED,
        );
        this.version = version;
    }
}

/**
 * Exception-Klasse für eine veraltete Versionsnummer beim Ändern.
 */
export class VersionOutdatedException extends HttpException {
    readonly version: number;

    constructor(version: number) {
        super(
            `Die Versionsnummer ${version} ist nicht aktuell.`,
            HttpStatus.PRECONDITION_FAILED,
        );
        this.version = version;
    }
}

/* eslint-enable max-classes-per-file */
