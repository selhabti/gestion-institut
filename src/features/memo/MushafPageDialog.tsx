import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Riwaya } from "./logic";

const TOTAL = 604;

const pageUrl = (riwaya: Riwaya, page: number) =>
  `https://cdn.quran.ws/svg/pages/v1.1.1/${
    riwaya === "warsh" ? "warsh-kfqc" : "hafs-kfqc"
  }/${String(page).padStart(3, "0")}.svg`;

interface MushafPageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  riwaya: Riwaya;
  initialPage: number;
  title?: string;
}

export function MushafPageDialog({
  open,
  onOpenChange,
  riwaya,
  initialPage,
  title,
}: MushafPageDialogProps) {
  const [page, setPage] = useState(initialPage);
  const [input, setInput] = useState(String(initialPage));

  useEffect(() => {
    if (!open) return;
    setPage(initialPage);
    setInput(String(initialPage));
  }, [open, initialPage]);

  useEffect(() => {
    setInput(String(page));
  }, [page]);

  const go = () => {
    const n = Number(input);
    if (!Number.isFinite(n)) {
      setInput(String(page));
      return;
    }
    const next = Math.min(TOTAL, Math.max(1, Math.round(n)));
    setPage(next);
    setInput(String(next));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title ?? `Mushaf — page ${page}`}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Input
            type="number"
            min={1}
            max={TOTAL}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                go();
              }
            }}
            className="h-8 w-20"
          />
          <span className="text-xs text-muted-foreground">/ {TOTAL}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(TOTAL, p + 1))}
            disabled={page >= TOTAL}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={go}>
            Aller
          </Button>
        </div>
        <img
          src={pageUrl(riwaya, page)}
          alt={`Page ${page} du mushaf`}
          className="mx-auto w-full max-w-xl"
          loading="lazy"
        />
      </DialogContent>
    </Dialog>
  );
}
