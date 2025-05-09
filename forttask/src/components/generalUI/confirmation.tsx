export default function ConfirmationBox({
    name,
    onCancel,
    onConfirm,
}: {
    name: string;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-zinc-900 text-white rounded-xl shadow-lg p-6 w-96">
                <h2 className="text-lg font-semibold mb-4">Are you sure?</h2>
                <p className="text-zinc-400 mb-6">
                    Do you really want to delete <span className="text-white font-bold">{name}</span>?
                </p>
                <div className="flex justify-end gap-4">
                    <button onClick={onCancel} className="px-4 py-2 rounded bg-zinc-700 hover:bg-zinc-600 transition">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 transition">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}
