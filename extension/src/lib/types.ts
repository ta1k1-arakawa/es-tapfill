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

export type GeneratedTextKey = keyof GeneratedTexts;

export type Settings = {
  backendUrl: string;
  mockMode: boolean;
};

export type InsertResponse = {
  success: boolean;
  error?: string;
};

export type PageFieldCategory = GeneratedTextKey | "other";

export type PageFieldCandidate = {
  fieldId: string;
  label: string;
  placeholder: string;
  name: string;
  value: string;
  tagName: string;
  inputType: string;
  required: boolean;
  maxLength?: number;
  targetLength?: number;
  category: PageFieldCategory;
};

export type PageCompanySuggestion = Partial<Company>;

export type PageAnalysis = {
  url: string;
  title: string;
  headline: string;
  pageSummary: string;
  companySuggestion: PageCompanySuggestion;
  fields: PageFieldCandidate[];
};

export type PageAnalysisResponse =
  | {
      success: true;
      analysis: PageAnalysis;
    }
  | {
      success: false;
      error: string;
    };
