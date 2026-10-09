import { IsUUID, IsString, MaxLength } from 'class-validator';

export class CreateAccountDto {
  @IsUUID()
  customerId!: string;

  @IsUUID()
  tariffId!: string;

  @IsString()
  @MaxLength(80)
  accountNumber!: string;

  @IsString()
  @MaxLength(80)
  meterNumber!: string;
}
