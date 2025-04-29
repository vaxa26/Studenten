import { ApiProperty } from '@nestjs/swagger';
import {
    IsArray,
    IsISO8601,
    IsOptional,
    Matches,
    Validate,
    ValidateNested,
    ValidationArguments,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';
import Decimal from 'decimal.js';
import { studiengang } from '../entity/studenten.entity.js';
import { Transform, Type } from 'class-transformer';
import { FotoDTO } from './fotoDTO.entity.js';
import { NameDTO } from './nameDTO.entity.js';


const number2Decimal = ({ value }: { value: Decimal.Value | undefined }) => {
    if (value === undefined) {
        return;
    }

    Decimal.set({ precision: 6 });
    return Decimal(value);
};

@ValidatorConstraint({ name: 'decimalMin', async: false })
class DecimalMin implements ValidatorConstraintInterface {
    validate(value: Decimal | undefined, args: ValidationArguments) {
        if (value === undefined) {
            return true;
        }
        const [minValue]: Decimal[] = args.constraints;
        return value.greaterThanOrEqualTo(minValue!);
    }

    defaultMessage(args: ValidationArguments): string {
        return `Der Wert muss groesser oder gleich ${(args.constraints[0] as Decimal).toNumber()} sein!`;
    }
}

export class StudentOhneRef {

    @ApiProperty({ example: 88283, type: Number })
    readonly matrikelnr!: number;

    @Matches(/^(WI|IIB|ET|MB)$/u)
    @IsOptional()
    @ApiProperty({ example: 'WI', type: String })
    readonly studiengang: studiengang | undefined;

    @Transform(number2Decimal)
    @Validate(DecimalMin, [Decimal(0)], {
        message: 'guthaben muss Positiv sein.',
    })
    @ApiProperty({ example: 1, type: Number })
    readonly guthaben!: Decimal;

    @IsISO8601({ strict: true })
    @IsOptional()
    @ApiProperty({ example: '2021-01-31' })
    readonly bd: Date | string | undefined;
}

export class StudentDTO extends StudentOhneRef {
    @ValidateNested()
    @Type(() => StudentDTO)
    @ApiProperty({ type: StudentDTO })
    readonly name!: NameDTO;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FotoDTO)
    @ApiProperty({ type: [FotoDTO] })
    readonly fotos: FotoDTO[] | undefined;
}
