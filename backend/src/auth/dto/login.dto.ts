import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email адреса' })
  @IsEmail({}, { message: 'Неправильний формат email' })
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Пароль (мін. 6 символів)',
  })
  @IsNotEmpty({ message: 'Пароль не може бути пустим' })
  password: string;
}
