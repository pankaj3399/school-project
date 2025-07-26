export type FormType = 'AwardPoints' | 'DeductPoints' | 'Feedback' | 'PointWithdraw' | 'AWARD POINTS WITH INDIVIDUALIZED EDUCTION PLAN (IEP)'
export type Question = {
    id: string
    text: string
    type: string
    isCompulsory: boolean
    options?: {value: string, points: number}[],
    maxPoints: number,
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

export const GRADE_OPTIONS = [
  // Regular grades
  'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
  
  // Case Managers
  'Case Manager #1', 'Case Manager #2', 'Case Manager #3', 'Case Manager #4',
  'Case Manager #5', 'Case Manager #6', 'Case Manager #7', 'Case Manager #8',
  'Case Manager #9', 'Case Manager #10', 'Case Manager #11', 'Case Manager #12',
  'Case Manager #13', 'Case Manager #14', 'Case Manager #15', 'Case Manager #16',
  'Case Manager #17', 'Case Manager #18', 'Case Manager #19', 'Case Manager #20',
  
  // Programs
  'Program #1', 'Program #2', 'Program #3', 'Program #4', 'Program #5',
  'Program #6', 'Program #7', 'Program #8', 'Program #9', 'Program #10',
  'Program #11', 'Program #12', 'Program #13', 'Program #14', 'Program #15',
  'Program #16', 'Program #17', 'Program #18', 'Program #19', 'Program #20',
  
  // Centers and Special Programs
  'AN Center #1', 'AN Center #2', 'AN Center #3', 'AN Center #4', 'AN Center #5',
  'ASD #1', 'ASD #2', 'ASD #3', 'ASD #4', 'ASD #5',
  'SSN #1', 'SSN #2', 'SSN #3', 'SSN #4', 'SSN #5'
]

export type GoalType = typeof GoalTypes[number];