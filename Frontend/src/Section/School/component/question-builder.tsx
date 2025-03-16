import React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Trash2 } from 'lucide-react'
import { PointsType, Question } from '@/lib/types'
import { Textarea } from "@/components/ui/textarea"
import { GoalTypes } from "@/lib/types"

type QuestionBuilderProps = {
  question: Question
  onUpdate: (question: Question) => void
  onRemove: (id: string) => void
  formType: 'AwardPoints' | 'Feedback' | 'PointWithdraw' | 'DeductPoints' | 'AWARD POINTS WITH INDIVIDUALIZED EDUCTION PLAN (IEP)'
}

export function QuestionBuilder({ question, onUpdate, onRemove, formType }: QuestionBuilderProps) {
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...question, text: e.target.value })
  }

  const handleTypeChange = (value: 'text' | 'select') => {
    onUpdate({ ...question, type: value, options: value === 'select' ? [] : undefined })
  }

  const handleCompulsoryChange = (checked: boolean) => {
    onUpdate({ ...question, isCompulsory: checked })
  }

  const handleOptionChange = (index: number, value: string) => {
    if (question.options) {
      const newOptions = [...question.options]
      newOptions[index] = {value, points: 0}
      onUpdate({ ...question, options: newOptions })
    }
  }

  const handlePointsTypeChange = (value: PointsType) => {
    onUpdate({ ...question, pointsType: value })
  }

  const addOption = () => {
    if (question.options) {
      onUpdate({ ...question, options: [...question.options, {value: '', points: 0}] })
    }
  }

  const removeOption = (index: number) => {
    if (question.options && question.options.length > 1) {
      const newOptions = question.options.filter((_, i) => i !== index)
      onUpdate({ ...question, options: newOptions })
    }
  }

  // Force Award type and minimum 1 point for IEP forms
  React.useEffect(() => {
    if (formType === 'AWARD POINTS WITH INDIVIDUALIZED EDUCTION PLAN (IEP)') {
      onUpdate({ 
        ...question, 
        pointsType: 'Award',
        maxPoints: question.maxPoints < 1 ? 1 : question.maxPoints 
      });
    }
  }, [formType]);

  return (
    <div className="border p-4 rounded-md space-y-4">
      {formType === 'AWARD POINTS WITH INDIVIDUALIZED EDUCTION PLAN (IEP)' && (
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
            {question.goal === 'Other' && (
              <Input
                placeholder="Specify other goal"
                value={question.otherGoal || ''}
                onChange={(e) => onUpdate({ ...question, otherGoal: e.target.value })}
                className="mt-2"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>2. BRIEF SUMMARY OF GOAL</Label>
            <Textarea
              placeholder="E.g. Jimmy will advocate for himself in 3 out of 5 classes."
              value={question.goalSummary || ''}
              onChange={(e) => onUpdate({ ...question, goalSummary: e.target.value })}
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label>3. OPERATIONAL DEFINITION OF TARGETED BEHAVIOR</Label>
            <Textarea
              placeholder='Example: "Advocacy looks like, emailing, or talking to his teacher to address his needs".'
              value={question.targetedBehaviour || ''}
              onChange={(e) => onUpdate({ ...question, targetedBehaviour: e.target.value })}
              className="min-h-[120px]"
            />
          </div>
        </div>
      )}

      {/* Question Text */}
      <div className="space-y-2">
        <Label>{formType !== 'AWARD POINTS WITH INDIVIDUALIZED EDUCTION PLAN (IEP)' ? 'Question Text':'TARGETED BEHAVIOR'}</Label>
        <Input
          type="text"
          value={question.text}
          onChange={handleTextChange}
          placeholder="Enter question text"
          className="w-full"
        />
      </div>

      <div className="flex items-center space-x-4">
        <Select onValueChange={handleTypeChange} value={question.type}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Question type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="select">Select</SelectItem>
            <SelectItem value="number">Number</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center space-x-2">
          <Switch
            id={`compulsory-${question.id}`}
            checked={question.isCompulsory}
            onCheckedChange={handleCompulsoryChange}
          />
          <Label htmlFor={`compulsory-${question.id}`}>Required</Label>
        </div>

        {/* Points input - always shown for IEP forms */}
        {(formType === 'AWARD POINTS WITH INDIVIDUALIZED EDUCTION PLAN (IEP)' || 
          ((question.type === 'number' || question.type === 'text') && question.pointsType !== 'None')) && (
          <div className="flex items-center space-x-2">
            <Label htmlFor={`points-${question.id}`}>Points</Label>
            <Input
              type="number"
              value={question.maxPoints}
              onChange={(e) => {
                const value = Math.max(1, parseInt(e.target.value) || 1);
                onUpdate({ ...question, maxPoints: value })
              }}
              placeholder="1"
              className="w-full"
              min={1}
            />
          </div>
        )}
      </div>

      {question.type === 'select' && question.options && (
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
                 onChange={(e) => onUpdate({ ...question, options: question.options?.map((o, i) => i === index ? {...o, points: parseInt(e.target.value, 10) || 0} : o) })}
                 placeholder="Enter points"
                className="w-full"
                min={0}
              />

              <Button onClick={() => removeOption(index)} variant="destructive" size="sm">
                <Trash2 />
              </Button>
            </div>
          ))}
          <Button onClick={addOption} variant="outline" size="sm">
            Add Option
          </Button>
        </div>
      )}

      {/* Points Type - Hidden for IEP forms since it's always Award */}
      {formType !== 'AWARD POINTS WITH INDIVIDUALIZED EDUCTION PLAN (IEP)' && (
        <div className="flex items-center space-x-2">
          <Label htmlFor={`pointsType-${question.id}`}>Points Type</Label>
          <Select onValueChange={handlePointsTypeChange} value={question.pointsType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Points Type" />
            </SelectTrigger>
            <SelectContent>
              {formType === 'AwardPoints' && <SelectItem value="Award">Award</SelectItem>}
              {(formType === 'DeductPoints' || formType === 'PointWithdraw') && 
                <SelectItem value="Deduct">Deduct</SelectItem>}
              <SelectItem value="None">None</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <Button onClick={() => onRemove(question.id)} variant="destructive">
        Remove Question
      </Button>
    </div>
  )
}