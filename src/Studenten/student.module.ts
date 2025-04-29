import { Module } from '@nestjs/common';
import { KeycloakModule } from '../security/keycloak/keycloak.module.js';
import { MailModule } from '../mail/mail.module.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from './entity/entities.js';
import { StudentQueryResolver } from './resolver/student-query.resolver.js';
import { StudentMutationResolver } from './resolver/student-mutation.resolver.js';
import { QueryBuilder } from './service/query-builder.js';
import { StudentReadService } from './service/student-read.service.js';
import { StudentWriteService } from './service/student-write.service.js';

@Module({
    imports: [KeycloakModule, MailModule, TypeOrmModule.forFeature(entities)],
    providers: [
        StudentReadService,
        StudentWriteService,
        StudentQueryResolver,
        StudentMutationResolver,
        QueryBuilder,
    ],
    exports: [StudentReadService, StudentWriteService],
})
export class StudentModule {}
