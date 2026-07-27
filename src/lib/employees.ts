import { prisma } from "@/lib/prisma";

export interface Employee {
  id: string;
  code: string;
  name: string;
  aadharNumber: string;
  designation: string | null;
  email: string;
  mobileNo: string | null;
  gender: string | null;
  dob: string | null;
  employmentType: string | null;
  status: string;
  roleProfileId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeInput {
  code: string;
  name: string;
  aadharNumber: string;
  designation?: string;
  email: string;
  mobileNo?: string;
  gender?: string;
  dob?: string;
  employmentType?: string;
  status?: string;
  roleProfileId?: string | null;
}

function toEmployee(emp: any): Employee {
  return {
    id: emp.id,
    code: emp.code,
    name: emp.name,
    aadharNumber: emp.aadharNumber,
    designation: emp.designation,
    email: emp.email,
    mobileNo: emp.mobileNo,
    gender: emp.gender,
    dob: emp.dob ? new Date(emp.dob).toISOString().split('T')[0] : null,
    employmentType: emp.employmentType,
    status: emp.status,
    roleProfileId: emp.roleProfileId ?? null,
    createdAt: emp.createdAt.toISOString(),
    updatedAt: emp.updatedAt.toISOString(),
  };
}

export async function getEmployees(): Promise<Employee[]> {
  const rows = await prisma.employee.findMany({ orderBy: { code: "asc" } });
  return rows.map(toEmployee);
}

export async function getEmployeeById(id: string): Promise<Employee | null> {
  const emp = await prisma.employee.findUnique({ where: { id } });
  return emp ? toEmployee(emp) : null;
}

export async function createEmployee(data: EmployeeInput): Promise<Employee> {
  const existingCode = await prisma.employee.findUnique({ where: { code: data.code } });
  if (existingCode) throw new Error(`Employee Code "${data.code}" already exists.`);

  const existingAadhar = await prisma.employee.findUnique({ where: { aadharNumber: data.aadharNumber } });
  if (existingAadhar) throw new Error(`Aadhar Number "${data.aadharNumber}" already exists.`);

  const emp = await prisma.employee.create({
    data: {
      code: data.code,
      name: data.name,
      aadharNumber: data.aadharNumber,
      designation: data.designation || null,
      email: data.email,
      mobileNo: data.mobileNo || null,
      gender: data.gender || null,
      dob: data.dob ? new Date(data.dob) : null,
      employmentType: data.employmentType || null,
      status: data.status || "ACTIVE",
      roleProfileId: data.roleProfileId || null,
    },
  });
  return toEmployee(emp);
}

export async function updateEmployee(id: string, data: Partial<EmployeeInput>): Promise<Employee> {
  const existing = await prisma.employee.findUnique({ where: { id } });
  if (!existing) throw new Error("Employee not found");

  if (data.name !== undefined && data.name !== existing.name) {
    throw new Error("Employee Name is immutable and cannot be changed once saved.");
  }

  if (data.code !== undefined && data.code.toLowerCase() !== existing.code.toLowerCase()) {
    const dup = await prisma.employee.findFirst({
      where: { code: data.code, NOT: { id } },
    });
    if (dup) throw new Error(`Employee Code "${data.code}" already in use.`);
  }
  if (data.aadharNumber !== undefined && data.aadharNumber?.toLowerCase() !== existing.aadharNumber?.toLowerCase()) {
    const dup = await prisma.employee.findFirst({
      where: { aadharNumber: data.aadharNumber, NOT: { id } },
    });
    if (dup) throw new Error(`Aadhar Number "${data.aadharNumber}" already in use.`);
  }

  const emp = await prisma.employee.update({
    where: { id },
    data: {
      code: data.code,
      ...(data.aadharNumber !== undefined ? { aadharNumber: data.aadharNumber } : {}),
      designation: data.designation,
      email: data.email,
      mobileNo: data.mobileNo,
      gender: data.gender,
      ...(data.dob !== undefined ? { dob: data.dob ? new Date(data.dob) : null } : {}),
      employmentType: data.employmentType,
      status: data.status,
      ...(data.roleProfileId !== undefined ? { roleProfileId: data.roleProfileId || null } : {}),
    },
  });
  return toEmployee(emp);
}

export async function deleteEmployee(id: string): Promise<Employee> {
  const emp = await prisma.employee.update({
    where: { id },
    data: { status: "INACTIVE" },
  });
  return toEmployee(emp);
}

