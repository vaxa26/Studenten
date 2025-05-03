import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Student } from "./studenten.entity.js";
import { binaryType } from "../../config/db.js";

@Entity()
export class StudentFile {
  @PrimaryGeneratedColumn()
  id: number | undefined;

  @Column('varchar')
  filename: string | undefined;

  @Column('varchar')
  mimetype: string | undefined;

  @OneToOne(() => Student, (student) => student.file)
  @JoinColumn({ name: 'student_id'})
  student: Student | undefined;

  @Column({ type: binaryType })
  data: Uint8Array | undefined;

  public toString = (): string => 
    JSON.stringify({
        id: this.id,
        filename: this.filename,
        mimetype: this.mimetype,
    });
}