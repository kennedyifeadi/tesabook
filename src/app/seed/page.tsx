import SeederButton from "@/components/SeederButton";

export default function SeedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center flex-col gap-6 bg-slate-50">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center max-w-md w-full">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Database Seeder</h1>
                <p className="text-slate-500 mb-6">Click below to populate the Firestore <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">sections</code> collection with the default venue data.</p>
                <SeederButton />
            </div>
        </div>
    );
}
