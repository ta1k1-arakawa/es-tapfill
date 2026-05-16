from pydantic import BaseModel, Field


class Profile(BaseModel):
    education: str = ""
    research: str = ""
    self_pr: str = ""
    internship: str = ""
    skills: str = ""
    values: str = ""
    career_goal: str = ""


class Company(BaseModel):
    name: str = ""
    job_type: str = ""
    business: str = ""
    job_description: str = ""
    attractive_point: str = ""
    target_length: int = Field(default=400, ge=100, le=10000)


class GenerateAllRequest(BaseModel):
    profile: Profile
    company: Company
    mock_mode: bool = False


class GeneratedResponse(BaseModel):
    motivation: str
    self_pr: str
    research: str
    internship: str
