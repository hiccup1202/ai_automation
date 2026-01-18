import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { AlertStatus } from '../entities/alert.entity';

export class UpdateAlertDto {
  @ApiProperty({
    enum: AlertStatus,
    example: AlertStatus.ACKNOWLEDGED,
    description: 'New status for the alert',
  })
  @IsEnum(AlertStatus)
  status: AlertStatus;
}









