import { IsDateString, IsUUID } from 'class-validator';

export class GenerateBillDto {
  @IsUUID()
  serviceAccountId!: string;

  @IsUUID()
  meterReadingId!: string;

  @IsDateString()
  periodStart!: string;

  @IsDateString()
  periodEnd!: string;

  @IsDateString()
  dueAt!: string;
}
