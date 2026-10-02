-- AlterTable
ALTER TABLE "Value" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

-- Existujuce hodnoty dostanu poradie podla doterajsieho (abecedneho)
-- zoradenia, aby sa paleta po migracii nijako nepreusporiadala.
UPDATE "Value" AS v
SET "order" = ranked.position
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "sheetId" ORDER BY name) - 1 AS position
  FROM "Value"
) AS ranked
WHERE v.id = ranked.id;
