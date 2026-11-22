import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MemoProgressBar } from "./MemoProgressBar";

export const AIDE_KEY = "memo-aide-vue-v1";

export function AideDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Aide — suivi de mémorisation</DialogTitle>
          <DialogDescription>
            Comprendre les 3 parties et ce que l'application fait toute seule.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm leading-relaxed text-slate-700">
          <MemoProgressBar
            origine={96}
            position={220}
            recentDe={170}
            recentA={220}
            ancienDe={96}
            ancienA={140}
            nouveauDe={220}
            nouveauA={230}
            compact
          />

          <div>
            <h3 className="font-semibold text-slate-900">Le principe</h3>
            <p>
              Chaque élève a une seule position : là où il en est dans le Coran.
              Chaque samedi, il récite 3 choses :
            </p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>
                <strong>Nouveau</strong> : ce qu'il s'était engagé à apprendre
                dans la semaine.
              </li>
              <li>
                <strong>Récent</strong> : ses 4 dernières semaines, pour les
                consolider.
              </li>
              <li>
                <strong>Ancien</strong> : une tranche de tout ce qu'il a
                mémorisé avant. La tranche change chaque semaine ; quand on
                arrive au bout, on recommence au début : c'est{" "}
                <strong>un cycle de révision</strong>.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900">
              Le samedi en 3 gestes
            </h3>
            <ol className="mt-1 list-decimal space-y-1 pl-5">
              <li>
                Ouvre la fiche Mémo de l'élève : les 3 parties à réciter sont
                déjà prêtes.
              </li>
              <li>
                Fais réciter, puis clique : ✓ appris, ½ en partie, ✗ à refaire,
                ou Absent.
              </li>
              <li>
                Clique sur Enregistrer. Le samedi suivant est préparé
                automatiquement.
              </li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900">
              Ce que l'appli fait toute seule
            </h3>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>
                <strong>Nouveau appris</strong> : il passe à la suite.
              </li>
              <li>
                <strong>À refaire ou absent</strong> : il garde le même morceau
                la semaine suivante.
              </li>
              <li>
                <strong>En partie</strong> : il avance jusqu'à l'endroit
                indiqué.
              </li>
              <li>
                <strong>Ancien réussi</strong> : la tranche suivante est
                préparée. <strong>Ancien raté</strong> : il refait la même
                tranche.
              </li>
              <li>
                <strong>Le récent avance tout seul</strong> au rythme du
                nouveau.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900">Démarrer un élève</h3>
            <p>
              Demande-lui où il a commencé à mémoriser et où il en est
              aujourd'hui. Vérifie le verset affiché avec lui, choisis son
              rythme, puis valide. Si une suggestion de l'ancien suivi apparaît,
              contrôle-la avant de valider.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900">
              Corriger une erreur
            </h3>
            <p>
              Dans Historique, clique sur Modifier sur le samedi concerné. Tout
              ce qui suit est recalculé automatiquement.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900">
              Questions fréquentes
            </h3>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>
                <strong>Il a fini le Coran ?</strong> Il n'a plus de nouveau,
                les révisions continuent.
              </li>
              <li>
                <strong>Il veut aller plus vite ou plus lentement ?</strong>{" "}
                Change son rythme dans Réglages ; ça s'applique dès le samedi
                suivant.
              </li>
              <li>
                <strong>« ≈ » à côté d'un verset ?</strong> La limite est
                approximative : vérifie dans le mushaf.
              </li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
