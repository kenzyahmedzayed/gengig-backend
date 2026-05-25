import { IsString, IsOptional, IsArray } from 'class-validator';

export class AgentOnboardingDto {
  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsArray()
  workTypes?: string[];
}