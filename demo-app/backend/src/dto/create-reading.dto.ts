import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateReadingDto {
  @IsUUID()
  serviceAccountId!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(999999999.999)
  previousReading!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(999999999.999)
  currentReading!: number;

  @IsDateString()
  readAt!: string;

  @IsOptional()
  @IsUUID()
  submittedBy?: string;

  @IsString()
  @MaxLength(120)
  idempotencyKey!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
