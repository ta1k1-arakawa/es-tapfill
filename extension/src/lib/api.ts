import type { Company, GeneratedTexts, Profile } from "./types";

type GenerateRequest = {
  profile: {
    education: string;
    research: string;
    self_pr: string;
    internship: string;
    skills: string;
    values: string;
    career_goal: string;
  };
  company: {
    name: string;
    job_type: string;
    business: string;
    job_description: string;
    attractive_point: string;
    target_length: number;
  };
  mock_mode: boolean;
};

type GenerateResponse = {
  motivation: string;
  self_pr: string;
  research: string;
  internship: string;
};

export async function generateAll(
  backendUrl: string,
  profile: Profile,
  company: Company,
  mockMode: boolean,
): Promise<GeneratedTexts> {
  const payload: GenerateRequest = {
    profile: {
      education: profile.education,
      research: profile.research,
      self_pr: profile.selfPr,
      internship: profile.internship,
      skills: profile.skills,
      values: profile.values,
      career_goal: profile.careerGoal,
    },
    company: {
      name: company.name,
      job_type: company.jobType,
      business: company.business,
      job_description: company.jobDescription,
      attractive_point: company.attractivePoint,
      target_length: company.targetLength,
    },
    mock_mode: mockMode,
  };

  let response: Response;
  try {
    response = await fetch(`${backendUrl.replace(/\/$/, "")}/generate/all`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    throw new Error("Backendに接続できません。Backend URLと起動状態を確認してください。");
  }

  if (!response.ok) {
    let message = "AI生成に失敗しました。";
    try {
      const errorBody = (await response.json()) as { detail?: string };
      message = errorBody.detail ?? message;
    } catch {
      message = `${message} HTTP ${response.status}`;
    }
    throw new Error(message);
  }

  const data = (await response.json()) as GenerateResponse;
  return {
    motivation: data.motivation,
    selfPr: data.self_pr,
    research: data.research,
    internship: data.internship,
  };
}
