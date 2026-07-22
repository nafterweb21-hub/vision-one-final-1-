import NcrForm from "../components/NcrForm";
import PrintButton from "../components/PrintButton";
import { getNcrFormData, getNcr } from "../actions";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditNcrPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  const [formData, ncr] = await Promise.all([
    getNcrFormData(),
    getNcr(id)
  ]);

  if (!ncr) {
    notFound();
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/qc/ncr" className="text-gray-500 hover:text-gray-700">
            ← Back to List
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Edit NCR: {ncr.ncrNo}</h1>
        </div>
        <PrintButton ncrId={ncr.id} />
      </div>
      
      <NcrForm formData={formData} initialData={ncr} />
    </div>
  );
}
