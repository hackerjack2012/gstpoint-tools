"use client";

type UploadZoneProps = {
  onFileSelect: (file: File) => void;
};

export default function UploadZone({
  onFileSelect,
}: UploadZoneProps) {
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-16 transition hover:border-blue-500 hover:bg-blue-50">

      <div className="text-6xl">
        📄
      </div>

      <h3 className="mt-4 text-xl font-semibold">
        Drag & Drop Excel File
      </h3>

      <p className="mt-2 text-slate-500">
        or click to browse
      </p>

      <input
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];

          if (file) {
            onFileSelect(file);
          }
        }}
      />
    </label>
  );
}