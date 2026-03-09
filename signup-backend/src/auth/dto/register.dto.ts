import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto{
 
   @IsString()
   @MinLength(2, { message: 'Name must be at least 2 characters' })
   @MaxLength(80, { message: 'Name must not exceed 80 characters' })
   name: string;


   @IsEmail({}, { message: 'Please provide a valid email' })
   email: string;

   @IsString()
   @MinLength(8, { message: 'Password must be at least 8 characters' })
   @MaxLength(64, { message: 'Password must not exceed 64 characters' })
   password: string;
}