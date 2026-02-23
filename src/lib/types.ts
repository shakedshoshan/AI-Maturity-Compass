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
  link?: string;
  linkLabel?: string;
  info?: string;
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
  /** סמל המוסד - required */
  institutionSymbol: string;
  /** שם מלא - מנהל/ת - required */
  principalName: string;
  /** סה"כ מס' אמצעי הקצה בבעלות בית הספר (מחשבים נייחים, ניידים, טבלטים) */
  totalDevices?: string;
}

export interface AssessmentRecord extends UserDetails {
  id?: string;
  createdAt: string;
  answers: (number | string)[];
  totalScore: number;
  level: string;
}
