import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, CameraOff, Search } from "lucide-react";
import { logError } from "@/utils/errorLogger";
import { toast } from "sonner";

interface Props {
  onCodigo: (codigo: string) => void;
  autoStart?: boolean;
}

const ELEMENT_ID = "escaner-valera-region";

export function EscanerValera({ onCodigo, autoStart = false }: Props) {
  const [activo, setActivo] = useState(autoStart);
  const [manual, setManual] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!activo) return;
    let cancelado = false;

    const iniciar = async () => {
      try {
        const scanner = new Html5Qrcode(ELEMENT_ID);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (texto) => {
            if (cancelado) return;
            cancelado = true;
            onCodigo(texto.trim());
            setActivo(false);
          },
          () => undefined
        );
      } catch (e) {
        logError("No se pudo iniciar la cámara del escáner:", e);
        toast.error("No se pudo acceder a la cámara. Escribe el código manualmente.");
        setActivo(false);
      }
    };

    iniciar();

    return () => {
      cancelado = true;
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => undefined);
      }
    };
  }, [activo, onCodigo]);

  return (
    <div className="space-y-3">
      <div id={ELEMENT_ID} className={activo ? "rounded-lg overflow-hidden border" : "hidden"} />

      <Button
        type="button"
        variant={activo ? "secondary" : "default"}
        className="w-full"
        onClick={() => setActivo((v) => !v)}
      >
        {activo ? <CameraOff className="w-4 h-4 mr-2" /> : <Camera className="w-4 h-4 mr-2" />}
        {activo ? "Detener cámara" : "Escanear QR con la cámara"}
      </Button>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (manual.trim()) {
            onCodigo(manual.trim());
            setManual("");
          }
        }}
      >
        <Input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder="O escribe el código (VAL-2026-0001)"
          autoComplete="off"
        />
        <Button type="submit" variant="outline">
          <Search className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
