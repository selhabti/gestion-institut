// src/components/attendance/PaymentModal.tsx
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Check } from "lucide-react";
import type { Member, PaymentMode } from "@/types/member";
import { capitalize } from "@/lib/utils";

interface PaymentModalProps {
  member: Member | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    memberId: string,
    amount: number,
    mode: PaymentMode,
    installmentLabel?: string
  ) => void;
}

const MODES: [PaymentMode, string][] = [
  ["mensuel", "Mensuel"],
  ["complet", "Complet"],
  ["plusieurs_fois", "En plusieurs fois"],
];

export function PaymentModal({
  member,
  open,
  onOpenChange,
  onSubmit,
}: PaymentModalProps) {
  const [amount, setAmount] = useState("20");
  const [mode, setMode] = useState<PaymentMode>("mensuel");
  const [installment, setInstallment] = useState("");

  if (!member) return null;

  const handleSubmit = () => {
    const amt = parseInt(amount, 10) || 20;
    onSubmit(
      member.id,
      amt,
      mode,
      mode === "plusieurs_fois" ? installment.trim() || undefined : undefined
    );
    setAmount("20");
    setMode("mensuel");
    setInstallment("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Paiement — {capitalize(member.firstName)}{" "}
            {capitalize(member.lastName)}
          </DialogTitle>
          <DialogDescription>
            Choisissez le montant et le mode de paiement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Montant (€)</Label>
            <Input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Mode de paiement</Label>
            <div className="grid grid-cols-3 gap-2">
              {MODES.map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setMode(val)}
                  className={`rounded-xl border-2 p-3 text-sm font-medium transition-all ${
                    mode === val
                      ? "bg-indigo-600 text-white border-transparent"
                      : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {mode === "plusieurs_fois" && (
            <div className="space-y-2">
              <Label>Versement (ex : 2/3)</Label>
              <Input
                value={installment}
                onChange={(e) => setInstallment(e.target.value)}
                placeholder="2/3"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit}>
            <Check className="h-4 w-4 mr-1" />
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PaymentModal;
