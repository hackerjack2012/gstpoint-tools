"use client";

type SelectedFileProps = {
  file: File;
  onRemove: () => void;
};

export default function SelectedFile({
  file,
  onRemove,
}: SelectedFileProps) {
  return (
    <div className="mt-6 flex items-center justify-between rounded-xl border bg-white p-4">

      <div>

        <h4 className="font-semibold">
          {file.name}
        </h4>

        <p className="text-sm text-slate-500">
          {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>

      </div>

      <button
        onClick={onRemove}
        className="rounded-lg bg-red-100 px-4 py-2 text-red-600 hover:bg-red-200"
      >
        Remove
      </button>

    </div>
  );
}