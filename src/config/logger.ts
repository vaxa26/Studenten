// Copyright (C) 2016 - present Juergen Zimmermann, Hochschule Karlsruhe
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program. If not, see <https://www.gnu.org/licenses/>.

import path from 'node:path';
import pino from 'pino';
import { type PrettyOptions } from 'pino-pretty';
import { config } from './app.js';
import { env } from './env.js';

/**
 * Das Modul enthält die Konfiguration für den Logger.
 * @packageDocumentation
 */

const logDirDefault = '/tmp';
const logFileNameDefault = 'server.log';
const logFileDefault = path.resolve(logDirDefault, logFileNameDefault);

const { log } = config;

if (log !== null && log.dir !== undefined && typeof log.dir !== 'string') {
    throw new TypeError('Das konfigurierte Log-Verzeichnis ist kein String');
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const logDir: string | undefined =
    (log?.dir as string | undefined) === undefined
        ? undefined
        : log.dir.trimEnd(); // eslint-disable-line @typescript-eslint/no-unsafe-call
const logFile =
    logDir === undefined
        ? logFileDefault
        : path.resolve(logDir, logFileNameDefault);
const pretty = log?.pretty === true;

// https://getpino.io
// Log-Levels: fatal, error, warn, info, debug, trace
// Alternativen: Winston, log4js, Bunyan
// Pino wird auch von Fastify genutzt.
// https://blog.appsignal.com/2021/09/01/best-practices-for-logging-in-nodejs.html

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';
let logLevelTmp: LogLevel = 'info';
if (env.LOG_LEVEL !== undefined) {
    logLevelTmp = env.LOG_LEVEL as LogLevel;
} else if (log?.level !== undefined) {
    logLevelTmp = log?.level as LogLevel;
}
export const logLevel = logLevelTmp;

console.debug(
    `logger config: logLevel=${logLevel}, logFile=${logFile}, pretty=${pretty}`,
);

const fileOptions = {
    level: logLevel,
    target: 'pino/file',
    options: { destination: logFile },
};
const prettyOptions: PrettyOptions = {
    translateTime: 'SYS:standard',
    singleLine: true,
    colorize: true,
    ignore: 'pid,hostname',
};
const prettyTransportOptions = {
    level: logLevel,
    target: 'pino-pretty',
    options: prettyOptions,
};

const options: pino.TransportMultiOptions | pino.TransportSingleOptions = pretty
    ? { targets: [fileOptions, prettyTransportOptions] }
    : { targets: [fileOptions] };
// in pino: type ThreadStream = any
// type-coverage:ignore-next-line
const transports = pino.transport(options); // eslint-disable-line @typescript-eslint/no-unsafe-assignment

// https://github.com/pinojs/pino/issues/1160#issuecomment-944081187
export const parentLogger: pino.Logger<string> = pino(
    { level: logLevel },
    transports,
); // eslint-disable-line @typescript-eslint/no-unsafe-argument
