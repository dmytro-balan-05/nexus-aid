import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email адреса' })
  @IsEmail({}, { message: 'Неправильний формат email' })
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Пароль (мін. 6 символів)',
  })
  @IsNotEmpty()
  @MinLength(6, { message: 'Пароль містити як мінімум 6 символів' })
  password: string;

  @ApiProperty({ example: 'Дмитро Балан', description: "Ім'я користувача" })
  @IsString()
  @IsNotEmpty({ message: 'Імя не може бути пустим' })
  name: string;
}
