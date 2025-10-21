"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const graphql_upload_1 = require("graphql-upload");
const body_parser_1 = require("body-parser");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        cors: true,
    });
    app.use((0, body_parser_1.json)({ limit: '50mb' }));
    app.use((0, graphql_upload_1.graphqlUploadExpress)({ maxFileSize: 1000000, maxFiles: 10 }));
    app.enableCors();
    const port = process.env.GATEWAY_PORT || 3000;
    console.log('listening at:', port);
    app.getHttpAdapter().get('/graphql/hello-world', (req, res) => {
        res.send({
            message: 'Hello World!'
        });
    });
    await app.listen(port);
}
bootstrap();
//# sourceMappingURL=main.js.map