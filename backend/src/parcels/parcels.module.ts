import { Module } from '@nestjs/common';
import { ParcelsService } from './parcels.service';
import { ParcelsController } from './parcels.controller';
import { EmailModule } from '../email/email.module';
import { MapsModule } from '../maps/maps.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [EmailModule, MapsModule, PrismaModule],
  controllers: [ParcelsController],
  providers: [ParcelsService],
  exports: [ParcelsService],
})
export class ParcelsModule {}
