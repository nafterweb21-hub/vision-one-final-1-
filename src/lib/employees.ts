import { prisma } from "@/lib/prisma";

export interface Employee {
  id: string;
  code: string;
  name: string;
  nricFin: string;
  designation: string | null;
  email: string;
  mobileNo: string | null;
  gender: string | null;
  contactNo: string | null;
  employmentType: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeInput {
  code: string;
  name: string;
  nricFin: string;
  designation?: string;
  email: string;
  mobileNo?: string;
  gender?: string;
  contactNo?: string;
  employmentType?: string;
  status?: string;
}

function toEmployee(emp: any): Employee {
  return {
    id: emp.id,
    code: emp.code,
    name: emp.name,
    nricFin: emp.nricFin,
    designation: emp.designation,
    email: emp.email,
    mobileNo: emp.mobileNo,
    gender: emp.gender,
    contactNo: emp.contactNo,
    employmentType: emp.employmentType,
    status: emp.status,
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

  const existingNric = await prisma.employee.findUnique({ where: { nricFin: data.nricFin } });
  if (existingNric) throw new Error(`NRIC / FIN "${data.nricFin}" already exists.`);

  const emp = await prisma.employee.create({
    data: {
      code: data.code,
      name: data.name,
      nricFin: data.nricFin,
      designation: data.designation || null,
      email: data.email,
      mobileNo: data.mobileNo || null,
      gender: data.gender || null,
      contactNo: data.contactNo || null,
      employmentType: data.employmentType || null,
      status: data.status || "ACTIVE",
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
  if (data.nricFin !== undefined && data.nricFin.toLowerCase() !== existing.nricFin.toLowerCase()) {
    const dup = await prisma.employee.findFirst({
      where: { nricFin: data.nricFin, NOT: { id } },
    });
    if (dup) throw new Error(`NRIC / FIN "${data.nricFin}" already in use.`);
  }

  const emp = await prisma.employee.update({
    where: { id },
    data: {
      code: data.code,
      designation: data.designation,
      email: data.email,
      mobileNo: data.mobileNo,
      gender: data.gender,
      contactNo: data.contactNo,
      employmentType: data.employmentType,
      status: data.status,
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

