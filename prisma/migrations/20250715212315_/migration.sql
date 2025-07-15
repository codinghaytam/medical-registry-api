/*
  Warnings:

  - The values [RECOLLAGE] on the enum `SeanceType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SeanceType_new" AS ENUM ('DETARTRAGE', 'SURFACAGE', 'ACTIVATION', 'DEBUT_DE_TRAITEMENT', 'FIN_DE_TRAITEMENT', 'SUIVI_POST_TRAITEMENT', 'REEVALUATION');
ALTER TABLE "Seance" ALTER COLUMN "type" TYPE "SeanceType_new" USING ("type"::text::"SeanceType_new");
ALTER TYPE "SeanceType" RENAME TO "SeanceType_old";
ALTER TYPE "SeanceType_new" RENAME TO "SeanceType";
DROP TYPE "SeanceType_old";
COMMIT;
