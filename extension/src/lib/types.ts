export type Profile = {
  education: string;
  research: string;
  selfPr: string;
  internship: string;
  skills: string;
  values: string;
  careerGoal: string;
};

export type Company = {
  name: string;
  jobType: string;
  business: string;
  jobDescription: string;
  attractivePoint: string;
  targetLength: number;
};

export type GeneratedTexts = {
  motivation: string;
  selfPr: string;
  research: string;
  internship: string;
};

export type Settings = {
  backendUrl: string;
  mockMode: boolean;
};

export type InsertResponse = {
  success: boolean;
  error?: string;
};
