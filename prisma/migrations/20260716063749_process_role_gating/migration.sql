-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "roleProfileId" TEXT;

-- CreateTable
CREATE TABLE "_MainProcessRoles" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MainProcessRoles_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_MainProcessRoles_B_index" ON "_MainProcessRoles"("B");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_roleProfileId_fkey" FOREIGN KEY ("roleProfileId") REFERENCES "RoleProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MainProcessRoles" ADD CONSTRAINT "_MainProcessRoles_A_fkey" FOREIGN KEY ("A") REFERENCES "MainProcess"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MainProcessRoles" ADD CONSTRAINT "_MainProcessRoles_B_fkey" FOREIGN KEY ("B") REFERENCES "RoleProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
