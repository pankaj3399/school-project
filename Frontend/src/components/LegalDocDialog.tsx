import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TermsPage from "@/components/TermsPage";
import { getCurrentTerms } from "@/api";

type LegalDoc = "terms" | "privacy";

interface LegalDocDialogProps {
  doc: LegalDoc | null;
  onOpenChange: (open: boolean) => void;
}

const TITLES: Record<LegalDoc, string> = {
  terms: "Terms of Service",
  privacy: "Privacy Policy",
};

export default function LegalDocDialog({
  doc,
  onOpenChange,
}: LegalDocDialogProps) {
  const [text, setText] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!doc) {
      setText(null);
      setLoading(false);
      return;
    }
    let active = true;
    setText(null);
    setLoading(true);
    getCurrentTerms(doc).then((data) => {
      if (!active) return;
      setText(data?.terms?.content ? data.terms : null);
      setLoading(false);
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
          {loading ? (
            <div className="flex items-center justify-center h-[40vh]">
              <Loader2 className="h-8 w-8 animate-spin text-[#00a58c]" />
            </div>
          ) : text ? (
            <TermsPage isRegistration terms={text} />
          ) : (
            <p className="text-sm text-gray-600">This document is not available right now.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
