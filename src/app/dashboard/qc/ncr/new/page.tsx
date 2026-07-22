import NcrForm from "../components/NcrForm";
import { getNcrFormData } from "../actions";
import Link from "next/link";

export default async function NewNcrPage() {
  const formData = await getNcrFormData();

  return (
    <div className="p-6">
      <div className="flex items-center space-x-4 mb-6">
        <Link href="/dashboard/qc/ncr" className="text-gray-500 hover:text-gray-700">
          ← Back to List
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Create Non-Conformance Report</h1>
      </div>
      
      <NcrForm formData={formData} />
    </div>
  );
}
