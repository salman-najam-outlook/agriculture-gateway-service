import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { graphqlUploadExpress } from 'graphql-upload';
import { json } from 'body-parser';
import * as cookieParser from 'cookie-parser';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(json({ limit: '50mb' }));
  app.use(cookieParser());
  app.use(graphqlUploadExpress({ maxFileSize: 1000000, maxFiles: 10 }));

   app.enableCors({
    origin:['http://localhost:8080'],
    credentials:true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  });
  const port = process.env.GATEWAY_PORT || 3000;
  console.log('listening at:', port);

  app.getHttpAdapter().get('/',(req, res)=>{
    res.send({
      message:'Hello World!'
    })
  })
  await app.listen(port);
}
bootstrap();
