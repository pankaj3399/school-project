import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TermsPage from "@/components/TermsPage";
import { LEGAL_PDF } from "@/lib/legal";

type LegalDoc = "terms" | "privacy";

interface Terms {
  title: string;
  content: string;
  contentHtml?: string;
  version: string;
  effectiveDate: string;
}

interface LegalDocDialogProps {
  doc: LegalDoc | null;
  onOpenChange: (open: boolean) => void;
  terms?: Terms | null;
}

const TITLES: Record<LegalDoc, string> = {
  terms: "Terms of Service",
  privacy: "Privacy Policy",
};

export default function LegalDocDialog({
  doc,
  onOpenChange,
  terms,
}: LegalDocDialogProps) {
  return (
    <Dialog open={doc !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-3 border-b shrink-0">
          <DialogTitle>{doc ? TITLES[doc] : ""}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
          {doc === "terms" && (
            <TermsPage isRegistration={true} terms={terms} />
          )}
          {doc === "privacy" && (
            <iframe
              title="Privacy Policy"
              src={LEGAL_PDF.privacy}
              className="w-full h-[60vh] border-0 rounded-md"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
