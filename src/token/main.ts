import { NestFactory } from "@nestjs/core"
import { ValidationPipe } from "@nestjs/common"
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger"
import { AppModule } from "./app.module"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle("Multi-Chain Token Explorer API")
    .setDescription("API for exploring tokens across multiple blockchains")
    .setVersion("1.0")
    .addTag("Tokens", "Token management and analytics")
    .addTag("Analytics", "Cross-chain analytics and comparisons")
    .addTag("Blockchains", "Supported blockchain networks")
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup("api/docs", app, document)

  const port = process.env.PORT || 3000
  await app.listen(port)

  console.log(`🚀 Multi-Chain Token Explorer API running on port ${port}`)
  console.log(`📚 API Documentation available at http://localhost:${port}/api/docs`)
}

bootstrap()
