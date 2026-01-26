export interface Question {
  id: number;
  category: string;
  title: string;
  text: string;
  quickWin: string;
}

export interface MaturityLevel {
  min: number;
  max: number;
  name: string;
  nameEn: string;
  desc: string;
}

export interface UserDetails {
  email: string;
  schoolName: string;
  city: string;
  role: string;
}

export interface AssessmentRecord extends UserDetails {
  id?: string;
  createdAt: string;
  answers: number[];
  totalScore: number;
  level: string;
}
