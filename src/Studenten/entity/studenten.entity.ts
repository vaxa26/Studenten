import { ApiProperty } from '@nestjs/swagger';
import Decimal from 'decimal.js'; // eslint-disable-line @typescript-eslint/naming-convention
import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    VersionColumn,
} from 'typeorm';
import { dbType } from '../../config/db.js';
import { DecimalTransformer } from './decimal-transformer.js';
import { Name } from './name.entity.js';
import { Foto } from './foto.entity.js';



export type studiengang = 'WI' | 'IIB' | 'ET' | 'MB';

@Entity()
export class Student {

    @PrimaryGeneratedColumn()
    id: number | undefined;

    @VersionColumn()
    readonly version: number | undefined;

    @Column( 'int' )
    @ApiProperty({ example: 12345, type: Number})
    readonly matrikelnr!: number;

    @Column('varchar')
    @ApiProperty({ example: 'WI', type: String})
    readonly studiengang: studiengang | undefined;

    @Column('decimal', {
        precision: 8,
        scale: 2,
        transformer: new DecimalTransformer(),
    })
    @ApiProperty({ example: 0.22, type: Number})
    readonly guthaben!: Decimal;

    @Column('date')
    @ApiProperty({ example:'2004-26-07 ' })
    readonly bd: Date | string | undefined;

// - - -- - - - - - - - - - - - - - - - - - - - -- - 

    @OneToOne(() => Name, (name) =>name.student, {
        cascade: ['insert','remove'],
    })
    readonly name: Name | undefined;

    @OneToMany(() => Foto, (foto) => foto.student, {
        cascade: ['insert', 'remove'],
    })
    readonly fotos: Foto[] | undefined;

// - - -- - - - - - - - - - - - - - - - - - - - -- - 


    @CreateDateColumn({
        type: dbType === 'sqlite' ? 'datetime' : 'timestamp',
    })
    readonly created: Date | undefined;

    @UpdateDateColumn({
        type: dbType === 'sqlite' ? 'datetime' : 'timestamp',
    })
    readonly updated: Date | undefined;

// - - -- - - - - - - - - - - - - - - - - - - - -- - 


    public toString=(): string =>
        JSON.stringify({
            id: this.id,
            version: this.version,
            matrikelnr: this.matrikelnr,
            studiengang: this.studiengang,
            guthaben: this.guthaben,
            bd: this.bd,
            created: this.created,
            updated: this.updated,
        })
}