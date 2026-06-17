import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { uploadImage, type Bucket } from "@/lib/upload";
import { toast } from "sonner";

interface Props {
  bucket: Bucket;
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  shape?: "square" | "circle" | "wide";
}

export function ImageUpload({ bucket, value, onChange, label = "Adicionar foto", shape = "square" }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast.error("Máx 8MB"); return; }
    setBusy(true);
    try {
      const url = await uploadImage(bucket, file);
      onChange(url);
      toast.success("Foto enviada!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro no upload");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  const cls =
    shape === "circle"
      ? "size-28 rounded-full"
      : shape === "wide"
        ? "w-full aspect-[16/9] rounded-2xl"
        : "size-32 rounded-2xl";

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className={`${cls} border-2 border-dashed border-border bg-muted overflow-hidden grid place-items-center relative hover:border-primary transition`}
      >
        {value ? (
          <img src={value} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <Camera className="size-6" />
            <span className="text-xs font-display">{label}</span>
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 grid place-items-center bg-black/40 text-white">
            <Loader2 className="size-6 animate-spin" />
          </div>
        )}
      </button>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}
