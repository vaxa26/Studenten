import { ApiProperty } from "@nestjs/swagger";
import { Matches, MaxLength } from "class-validator";

export class NameDTO {
    @Matches(String.raw`^\w.*`)
    @MaxLength(32)
    @ApiProperty({ example: 'Tralalelo', type: String})
    readonly vorname!: string

    @Matches(String.raw`^\w.*`)
    @MaxLength(32)
    @ApiProperty({ example: 'Tralalala', type: String})
    readonly nachname: string | undefined;
    
}