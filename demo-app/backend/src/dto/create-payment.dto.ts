import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePaymentDto {
  @IsUUID()
  serviceAccountId!: string;

  @IsUUID()
  billId!: string;

  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  amountMinor!: number;

  @IsIn(['mpesa', 'cash', 'bank', 'other'])
  method!: 'mpesa' | 'cash' | 'bank' | 'other';

  @IsOptional()
  @IsString()
  @MaxLength(120)
  externalReference?: string;

  @IsString()
  @MaxLength(120)
  idempotencyKey!: string;

  @IsOptional()
  @IsUUID()
  recordedBy?: string;
}
