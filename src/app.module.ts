import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VehiculosModule } from './vehiculos/vehiculos.module';

@Module({
  imports: [VehiculosModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
