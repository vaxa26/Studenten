import Decimal from 'decimal.js'; // eslint-disable-line @typescript-eslint/naming-convention
import { type ValueTransformer } from 'typeorm';

export class DecimalTransformer implements ValueTransformer {
    to(decimal?: Decimal): string | undefined {
        return decimal?.toString();
    }

    from(decimal?: string): Decimal | undefined {
        return decimal === undefined ? undefined : Decimal(decimal);
    }
}
