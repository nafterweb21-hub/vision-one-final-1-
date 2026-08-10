import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const processes = await prisma.processProfile.findMany();
  const mainProcesses = await prisma.mainProcess.findMany();
  return NextResponse.json({ processes, mainProcesses });
}
