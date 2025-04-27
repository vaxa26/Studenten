import { ApiProperty } from "@nestjs/swagger";
import { MaxLength } from "class-validator";

export class FotoDTO {
    @MaxLength(32)
    @ApiProperty({ example: 'Die Beschriftung', type: String })
    readonly beschriftung!: string;

    @MaxLength(16)
    @ApiProperty({ example: 'image/png', type: String})
    readonly contentType!: string;
}