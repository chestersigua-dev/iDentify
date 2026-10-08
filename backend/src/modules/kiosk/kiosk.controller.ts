import {
  Controller,
  Post,
  Body,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { KioskService, KioskScanInput } from './kiosk.service';

@Controller('api/kiosk')
export class KioskController {
  constructor(private readonly kioskService: KioskService) {}

  @Post('scan')
  async scanToken(@Body() body: KioskScanInput, @Req() req: any) {
    if (!body.tokenUid) {
      throw new BadRequestException('Token UID (RFID or Barcode) is required.');
    }
    const schoolId = body.schoolId || '11111111-1111-1111-1111-111111111111';
    const result = await this.kioskService.processScan(
      { ...body, schoolId },
      req.ip,
    );
    return result;
  }
}
