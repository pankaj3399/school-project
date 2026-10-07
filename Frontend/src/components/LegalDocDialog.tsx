import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TermsPage from "@/components/TermsPage";
import { getCurrentTerms } from "@/api";
import { LEGAL_PDF } from "@/lib/legal";

type LegalDoc = "terms" | "privacy";

interface LegalDocDialogProps {
  doc: LegalDoc | null;
  onOpenChange: (open: boolean) => void;
}

const TITLES: Record<LegalDoc, string> = {
  terms: "Terms of Use",
  privacy: "Privacy Policy",
};

export default function LegalDocDialog({
  doc,
  onOpenChange,
}: LegalDocDialogProps) {
  const [text, setText] = useState<any>(null);

  useEffect(() => {
    if (!doc) {
      setText(null);
      return;
    }
    let active = true;
    getCurrentTerms(doc).then((data) => {
      if (!active) return;
      setText(data?.terms?.content ? data.terms : null);
    });
    return () => { active = false; };
  }, [doc]);

  return (
    <Dialog open={doc !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-3 border-b shrink-0">
          <DialogTitle>{doc ? TITLES[doc] : ""}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
          {text ? (
            <TermsPage isRegistration terms={text} />
          ) : (
            doc && (
              <iframe
                title={TITLES[doc]}
                src={LEGAL_PDF[doc === "terms" ? "terms" : "privacy"]}
                className="w-full h-[60vh] border-0 rounded-md"
              />
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
