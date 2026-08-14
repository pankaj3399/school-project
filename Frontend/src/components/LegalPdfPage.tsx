import { LEGAL_PDF } from '@/lib/legal';

type LegalDoc = 'terms' | 'privacy';

const COPY: Record<LegalDoc, { title: string; src: string }> = {
  terms: { title: 'Terms of Service', src: LEGAL_PDF.terms },
  privacy: { title: 'Privacy Policy', src: LEGAL_PDF.privacy },
};

export default function LegalPdfPage({ doc }: { doc: LegalDoc }) {
  const { title, src } = COPY[doc];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="px-4 py-3 border-b bg-white flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#00a58c] font-semibold hover:underline shrink-0"
        >
          Open PDF
        </a>
      </div>
      <iframe title={title} src={src} className="flex-1 w-full min-h-[80vh] border-0" />
    </div>
  );
}
