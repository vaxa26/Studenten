import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Student } from "./studenten.entity.js";

@Entity()
export class Name {

    @PrimaryGeneratedColumn()
    id: number | undefined;

    @Column()
    readonly vorname!: string;

    @Column('varchar')
    readonly nachname: string | undefined;

    @OneToOne(() => Student,(student) =>student.name)
    @JoinColumn({ name: 'student_id'})
    student: Student | undefined;

    public toString= (): string =>
        JSON.stringify({
            id: this.id,
            vorname: this.vorname,
            nachname: this.nachname,
        })
}   