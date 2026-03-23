export const Role = {
    Admin: 'Admin',
    SystemAdmin: 'SystemAdmin',
    DistrictAdmin: 'DistrictAdmin',
    Teacher: 'Teacher',
    Student: 'Student',
    SchoolAdmin: 'SchoolAdmin',
    Guardian: 'Guardian'
} as const;

export type RoleType = typeof Role[keyof typeof Role];

export const QuestionType = {
    Text: 'text',
    Select: 'select',
    Number: 'number'
} as const;
