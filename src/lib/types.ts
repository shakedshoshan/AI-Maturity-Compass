export type QuestionType = 'rating' | 'boolean' | 'percentage' | 'open';

export interface QuestionOption {
  value: number;
  label: string;
}

export interface Question {
  id: number;
  category: string;
  title: string;
  text: string;
  quickWin?: string;
  type: QuestionType;
  options?: QuestionOption[];
}

export interface MaturityLevel {
  min: number;
  max: number;
  name: string;
  nameEn: string;
  desc: string;
  situation: string;
  nextStep: string;
}

export interface UserDetails {
  /** שם המוסד החינוכי - required */
  institutionName: string;
  /** שם מלא - מנהל/ת - required */
  principalName: string;
  /** שם מלא - רכז/ת התקשוב */
  ictCoordinatorName?: string;
  /** שם מלא - רכז/ת חדשנות / 'פיוצ'ריסט' (אם קייים) */
  innovationCoordinatorName?: string;
  /** שכבות הגיל במוסד החינוכי */
  ageGroups?: string;
  /** סה"כ מס' התלמידים/ות */
  totalStudents?: string;
  /** % התלמידים הבנים */
  percentMaleStudents?: string;
  /** % התלמידות הבנות */
  percentFemaleStudents?: string;
  /** מס' המורים/ות */
  numberOfTeachers?: string;
  /** סה"כ מס' אמצעי הקצה בבעלות בית הספר (מחשבים נייחים, ניידים, טבלטים) */
  totalDevices?: string;
  email?: string;
  emailConsent?: boolean;
}

export interface AssessmentRecord extends UserDetails {
  id?: string;
  createdAt: string;
  answers: (number | string)[];
  totalScore: number;
  level: string;
}
