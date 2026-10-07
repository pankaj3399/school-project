import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Video } from "lucide-react";
import { updateTrainingMaterials } from "@/api";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage, isApiError } from "@/lib/errors";

function isHttpUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return true;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function TrainingMaterials({
  schoolId,
  pdfUrl,
  videoUrl,
}: {
  schoolId: string;
  pdfUrl?: string;
  videoUrl?: string;
}) {
  const { toast } = useToast();
  const [pdf, setPdf] = useState(pdfUrl || "");
  const [video, setVideo] = useState(videoUrl || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPdf(pdfUrl || "");
    setVideo(videoUrl || "");
  }, [schoolId, pdfUrl, videoUrl]);

  const save = async () => {
    if (!isHttpUrl(pdf) || !isHttpUrl(video)) {
      toast({
        title: "Check the links",
        description: "Each link must be a full http or https URL, or left blank.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const response = await updateTrainingMaterials(schoolId, {
        trainingPdfUrl: pdf.trim(),
        trainingVideoUrl: video.trim(),
      });
      if (isApiError(response)) {
        throw new Error(getErrorMessage(response, "Could not save training links."));
      }
      toast({
        title: "Training links saved",
        description: "New teachers at this school will receive these links in their welcome email.",
      });
    } catch (error) {
      toast({
        title: "Could not save",
        description: getErrorMessage(error, "Could not save training links."),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 px-2">
        <div className="h-6 w-1 bg-[#00a58c] rounded-full" />
        <div>
          <h2 className="text-xl font-bold text-neutral-800 tracking-tight">Training materials</h2>
          <p className="text-sm text-neutral-500 font-medium">
            Links for this school. They go out in the welcome email after a teacher finishes registration.
          </p>
        </div>
      </div>
      <Card className="border-neutral-200 shadow-sm">
        <CardHeader>
          <CardTitle>Onboarding links</CardTitle>
          <CardDescription>
            One guide and one video for every teacher at this school. Leave a field blank to use the shared default for that resource.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="training-pdf" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#00a58c]" />
              Training guide link
            </Label>
            <Input
              id="training-pdf"
              type="url"
              inputMode="url"
              placeholder="https://"
              value={pdf}
              onChange={(e) => setPdf(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="training-video" className="flex items-center gap-2">
              <Video className="h-4 w-4 text-[#00a58c]" />
              Training video link
            </Label>
            <Input
              id="training-video"
              type="url"
              inputMode="url"
              placeholder="https://"
              value={video}
              onChange={(e) => setVideo(e.target.value)}
            />
          </div>
          <Button
            className="bg-[#00a58c] hover:bg-[#00a58c]/90"
            onClick={save}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save training links"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
