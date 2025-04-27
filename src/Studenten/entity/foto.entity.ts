import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Student } from "./studenten.entity.js";

@Entity()
export class Foto {
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @Column()
    readonly beschriftung!: string;

    @Column('varchar')
    readonly contentType: string | undefined;

    @ManyToOne(() => Student, (student) => student.fotos)
    @JoinColumn({ name:'student_id '})
    student: Student | undefined;

    public toString = (): string => 
        JSON.stringify({
            id: this.id,
            beschriftung: this.beschriftung,
            contentType: this.contentType,
        });
}