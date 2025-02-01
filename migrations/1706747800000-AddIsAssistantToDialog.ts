import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsAssistantToDialog1706747800000 implements MigrationInterface {
    name = 'AddIsAssistantToDialog1706747800000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dialog" ADD "isAssistant" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dialog" DROP COLUMN "isAssistant"`);
    }
} 