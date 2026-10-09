import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @MaxLength(80)
  customerNumber!: string;

  @IsString()
  @MaxLength(160)
  fullName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;
}
