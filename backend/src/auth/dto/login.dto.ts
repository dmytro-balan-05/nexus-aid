import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Неправильний формат email' })
  email: string;

  @IsNotEmpty({ message: 'Пароль не може бути пустим' })
  password: string;
}
