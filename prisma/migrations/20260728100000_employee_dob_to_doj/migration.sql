-- Employee: replace Date of Birth with Date of Joining.
-- RENAME (not drop + add) so no existing values are lost. Note that any value
-- already captured was entered as a birth date and now reads as a joining
-- date, so existing rows should be reviewed.
ALTER TABLE "Employee" RENAME COLUMN "dob" TO "doj";
