CREATE TYPE studiengang AS ENUM ('WI','IIB','ET','MB');


CREATE TABLE IF NOT EXISTS student (
    id              integer GENERATED ALWAYS AS IDENTITY(START WITH 1000) PRIMARY KEY USING INDEX TABLESPACE studentspace,
    version         integer NOT NULL DEFAULT 0,
    matrikelnr      text UNIQUE NOT NULL,
    studiengang     studiengang,
    guthaben        decimal(8,2) DEFAULT 0,
    bd              date,
    created         timestamp NOT NULL DEFAULT NOW(),
    updated         timestamp NOT NULL DEFAULT NOW()
) TABLESPACE studentspace;

CREATE TABLE IF NOT EXISTS name (
    id              integer GENERATED ALWAYS AS IDENTITY(START WITH 10000) PRIMARY KEY USING INDEX TABLESPACE studentspace,
    nachname        text NOT NULL,
    vorname         text,
    student_id      integer NOT NULL UNIQUE USING INDEX TABLESPACE studentspace REFERENCES student
) TABLESPACE studentspace;

CREATE TABLE IF NOT EXISTS foto (
    id              integer GENERATED ALWAYS AS IDENTITY(START WITH 1000) PRIMARY KEY USING INDEX TABLESPACE studentspace,
    beschriftung    text NOT NULL,
    content_type    text NOT NULL,
    student_id      integer NOT NULL REFERENCES student
) TABLESPACE studentspace;

CREATE INDEX IF NOT EXISTS foto_student_id_idx ON foto(student_id) TABLESPACE studentspace;

CREATE TABLE IF NOT EXISTS student_file (
    id              integer GENERATED ALWAYS AS IDENTITY(START WITH 1000) PRIMARY KEY USING INDEX TABLESPACE studentspace,
    data            bytea NOT NULL,
    filename        text NOT NULL,
    mimetype        text,
    student_id      integer NOT NULL REFERENCES student
) TABLESPACE studentspace;

CREATE INDEX IF NOT EXISTS student_file_student_id_idx ON student_file(student_id) TABLESPACE studentspace;