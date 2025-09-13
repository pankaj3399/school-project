import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { Question, FormType } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { GoalTypes } from "@/lib/types";

type QuestionBuilderProps = {
  question: Question;
  onUpdate: (question: Question) => void;
  onRemove: (id: string) => void;
  formType: FormType;
};

export function QuestionBuilder({
  question,
  onUpdate,
  onRemove,
  formType,
}: QuestionBuilderProps) {
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...question, text: e.target.value });
  };

  const handleTypeChange = (value: "text" | "select") => {
    onUpdate({
      ...question,
      type: value,
      options: value === "select" ? [] : undefined,
    });
  };

  const handleCompulsoryChange = (checked: boolean) => {
    onUpdate({ ...question, isCompulsory: checked });
  };

  const handleOptionChange = (index: number, value: string) => {
    if (question.options) {
      const newOptions = [...question.options];
      newOptions[index] = { value, points: 0 };
      onUpdate({ ...question, options: newOptions });
    }
  };

  const addOption = () => {
    if (question.options) {
      onUpdate({
        ...question,
        options: [...question.options, { value: "", points: 0 }],
      });
    }
  };

  const removeOption = (index: number) => {
    if (question.options && question.options.length > 1) {
      const newOptions = question.options.filter((_, i) => i !== index);
      onUpdate({ ...question, options: newOptions });
    }
  };

  // Force minimum 1 point for IEP forms
  React.useEffect(() => {
    if (formType === FormType.AwardPointsIEP) {
      onUpdate({
        ...question,
        maxPoints: question.maxPoints < 1 ? 1 : question.maxPoints,
      });
    }
  }, [formType]);

  return (
    <div className="border p-4 rounded-md space-y-4">
      {formType === FormType.AwardPointsIEP && (
        <div className="space-y-4 border-b pb-4">
          <div className="space-y-2">
            <Label>1. GOAL</Label>
            <Select
              value={question.goal}
              onValueChange={(value) => onUpdate({ ...question, goal: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select goal type" />
              </SelectTrigger>
              <SelectContent>
                {GoalTypes.map((goalType) => (
                  <SelectItem key={goalType} value={goalType}>
                    {goalType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {question.goal === "Other" && (
              <Input
                placeholder="Specify other goal"
                value={question.otherGoal || ""}
                onChange={(e) =>
                  onUpdate({ ...question, otherGoal: e.target.value })
                }
                className="mt-2"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>2. BRIEF SUMMARY OF GOAL</Label>
            <Textarea
              value={question.goalSummary || ""}
              onChange={(e) =>
                onUpdate({ ...question, goalSummary: e.target.value })
              }
              placeholder="Provide a brief summary of the goal"
            />
          </div>

          <div className="space-y-2">
            <Label>3. TARGETED BEHAVIOUR</Label>
            <Textarea
              value={question.targetedBehaviour || ""}
              onChange={(e) =>
                onUpdate({ ...question, targetedBehaviour: e.target.value })
              }
              placeholder="Describe the targeted behaviour"
            />
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor={`text-${question.id}`}>Question Text</Label>
          <Input
            id={`text-${question.id}`}
            value={question.text}
            onChange={handleTextChange}
            placeholder="Enter your question"
            required
          />
        </div>

        <div className="flex items-center space-x-4">
          <div>
            <Label htmlFor={`type-${question.id}`}>Question Type</Label>
            <Select value={question.type} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="select">Select</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id={`compulsory-${question.id}`}
              checked={question.isCompulsory}
              onCheckedChange={handleCompulsoryChange}
            />
            <Label htmlFor={`compulsory-${question.id}`}>Required</Label>
          </div>
        </div>

        {/* Points input - only show for non-Feedback forms */}
        {formType !== FormType.Feedback && (
          <>
            <div className="flex items-center w-full justify-start space-x-2">
              <Label htmlFor={`points-${question.id} w-full`}>Max Points</Label>
              <Input
                type="number"
                value={question.maxPoints}
                onChange={(e) => {
                  const value = Math.max(1, parseInt(e.target.value) || 1);
                  onUpdate({ ...question, maxPoints: value });
                }}
                placeholder="1"
                className="w-50"
                min={1}
              />
            </div>
          </>
        )}
      </div>

      {question.type === "select" && question.options && (
        <div className="space-y-2">
          {question.options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Input
                type="text"
                value={option.value}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                className="flex-grow"
              />
              <Input
                type="number"
                value={option.points}
                onChange={(e) =>
                  onUpdate({
                    ...question,
                    options: question.options?.map((o, i) =>
                      i === index
                        ? { ...o, points: parseInt(e.target.value, 10) || 0 }
                        : o
                    ),
                  })
                }
                placeholder="Enter points"
                className="w-full"
                min={0}
              />

              <Button
                onClick={() => removeOption(index)}
                variant="destructive"
                size="sm"
              >
                <Trash2 />
              </Button>
            </div>
          ))}
          <Button onClick={addOption} variant="outline" size="sm">
            Add Option
          </Button>
        </div>
      )}

      <Button onClick={() => onRemove(question.id)} variant="destructive">
        Remove Question
      </Button>
    </div>
  );
}
