import { Module } from '@nestjs/common';
import { ParcelRequestsService } from './parcel-requests.service';
import { ParcelRequestsController } from './parcel-requests.controller';
import { EmailModule } from '../email/email.module';
import { MapsModule } from '../maps/maps.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [EmailModule, MapsModule, PrismaModule],
  controllers: [ParcelRequestsController],
  providers: [ParcelRequestsService],
  exports: [ParcelRequestsService],
})
export class ParcelRequestsModule {}
