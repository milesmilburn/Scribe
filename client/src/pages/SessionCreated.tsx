import { useParams, useNavigate } from "react-router";

export default function SessionCreated() {
    const { code } = useParams();
    const navigate = useNavigate();
    const link = `${window.location.origin}/session/${code}`;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 w-full max-w-sm text-center space-y-4">
                <h1 className="text-2xl font-bold text-slate-900">Session Created!</h1>
                <p className="text-slate-600">Share this link with your players:</p>

                <div className="flex gap-2">
                <input
                    readOnly
                    value={link}
                    onClick={(e) => e.currentTarget.select()}
                    className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-slate-700 text-sm bg-slate-50 focus:outline-none"
                />
                <button
                    onClick={() => navigator.clipboard.writeText(link)}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium px-3 py-2 rounded-md cursor-pointer transition-colors"
                >
                    Copy
                </button>
                </div>

                <button
                onClick={() => navigate(`/session/${code}`)}
                className="w-full bg-slate-700 hover:bg-slate-800 text-white font-medium py-2 rounded-md cursor-pointer transition-colors"
                >
                Enter Session
                </button>
            </div>
        </div>
    );
}