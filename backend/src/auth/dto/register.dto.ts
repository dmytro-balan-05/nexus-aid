import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Неправильний формат email' })
  email: string;

  @IsNotEmpty()
  @MinLength(6, { message: 'Пароль містити як мінімум 6 символів' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Імя не може бути пустим' })
  name: string;
}
