import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getCurrentTerms } from "@/api";
import TermsPage from "@/components/TermsPage";
import LegalPdfPage from "@/components/LegalPdfPage";

type PublicKind = "terms" | "privacy";

export default function PublicLegalPage({ kind }: { kind: PublicKind }) {
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const data = await getCurrentTerms(kind);
      if (!active) return;
      setDoc(data?.terms?.content ? data.terms : null);
      setLoading(false);
    };
    load();
    return () => { active = false; };
  }, [kind]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#00a58c]" />
      </div>
    );
  }

  if (!doc) return <LegalPdfPage doc={kind} />;
  return <TermsPage terms={doc} />;
}
