export type FormType = 'AwardPoints' | 'DeductPoints' | 'Feedback' | 'PointWithdraw' | 'AWARD POINTS WITH INDIVIDUALIZED EDUCTION PLAN (IEP)'
export type PointsType = 'Award' | 'Deduct' | 'None'
export type Question = {
    id: string
    text: string
    type: string
    isCompulsory: boolean
    options?: {value: string, points: number}[],
    maxPoints: number,
    pointsType: PointsType,
    goal?: string;
    goalSummary?: string;
    targetedBehaviour?: string;
    otherGoal?: string;
  }
  
export type Form = {
    _id: string
    formName: string
    formType: string
    questions: Question[]
    createdAt: string
    schoolId: string | null,
    studentEmail: boolean,
    parentEmail: boolean,
    teacherEmail: boolean,
    schoolAdminEmail: boolean
  }

export type AnswerType = {
    [key: string]: {answer: string, points: number}
}

export type AnswerTypeArray = {
  questionId: string,
  answer: string,
}[]

export const GoalTypes = [
  'Communication goal',
  'Math goal',
  'Reading goal',
  'Social Emotional goal',
  'Self determination goal',
  'Writing goal',
  'Other'
] as const;

export type GoalType = typeof GoalTypes[number];