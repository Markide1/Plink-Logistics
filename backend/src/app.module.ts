import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ParcelsModule } from './parcels/parcels.module';
import { EmailModule } from './email/email.module';
import { MapsModule } from './maps/maps.module';
import { ParcelRequestsModule } from './parcel-requests/parcel-requests.module';
import { ReviewsModule } from './reviews/reviews.module';
import { PaymentsModule } from './payments/payments.module';
import { ReportsModule } from './reports/reports.module';
import { AdminModule } from './admin/admin.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { PrismaModule } from './prisma/prisma.module';
import { ContactMessagesModule } from './contact-messages/contact-messages.module';
import { APP_FILTER } from '@nestjs/core/constants';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      useFactory: () => ({
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
        },
      }),
    }),
    AuthModule,
    UsersModule,
    ParcelsModule,
    ParcelRequestsModule,
    ReviewsModule,
    PaymentsModule,
    ReportsModule,
    AdminModule,
    EmailModule,
    MapsModule,
    PrismaModule,
    ContactMessagesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
