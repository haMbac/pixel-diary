-- UserRole enum + User.role
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER';

-- Email je teraz povinny prihlasovaci identifikator (obe existujuce riadky
-- uz maju email vyplneny, takze toto je bezpecne).
ALTER TABLE "User" ALTER COLUMN "email" SET NOT NULL;

-- Jednorazovy overovaci kod (bod 1.1/2.11)
CREATE TABLE "LoginCode" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginCode_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "LoginCode_email_key" ON "LoginCode"("email");

-- Prihlasena relacia (bod 1.1/2.3)
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- beka-software.at ako samostatny admin ucet (rozhodnute v konverzacii) -
-- gmail ucet ostava na predvolenej role USER.
UPDATE "User" SET "role" = 'ADMIN' WHERE "email" = 'helena.ravingerova@beka-software.at';
