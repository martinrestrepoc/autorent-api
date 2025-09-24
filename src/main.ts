import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no definidas en los DTOs
      forbidNonWhitelisted: true, // Lanza un error si se envían propiedades no definidas
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      }, // Permite la conversión automática de tipos, para que la clave no se muestre al crear un usuario
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
