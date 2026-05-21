const callOpenAI = async (messages) => {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages,
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI request failed: ${errorBody}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim();
};

export const generateJobDescription = async (req, res) => {
  try {
    const { positionTitle, companyName, seniority = "Junior", skills = "" } = req.body;

    if (!positionTitle) {
      return res.status(400).json({ message: "Position title is required" });
    }

    const fallback = `We are looking for a ${seniority} ${positionTitle} to join ${companyName || "our team"}. Responsibilities include building reliable features, collaborating with teammates, and improving product quality. Required skills: ${skills || "JavaScript, problem solving, communication"}.`;

    const content = await callOpenAI([
      { role: "system", content: "You write concise, professional job descriptions for an ATS app." },
      {
        role: "user",
        content: `Create a job description for ${seniority} ${positionTitle} at ${companyName || "a company"}. Skills: ${skills}. Keep it under 180 words.`,
      },
    ]);

    res.json({ description: content || fallback, source: content ? "openai" : "fallback" });
  } catch (error) {
    console.error("AI job description error:", error);
    res.status(500).json({ message: "Server error while generating job description" });
  }
};

export const matchResume = async (req, res) => {
  try {
    const { jobDescription, resumeText } = req.body;

    if (!jobDescription || !resumeText) {
      return res.status(400).json({ message: "Job description and resume text are required" });
    }

    const fallbackScore = Math.min(
      95,
      Math.max(35, Math.round((resumeText.length / Math.max(jobDescription.length, 1)) * 45)),
    );

    const content = await callOpenAI([
      {
        role: "system",
        content:
          "You evaluate candidate fit. Return JSON only with score (0-100), strengths (array), gaps (array), summary (string).",
      },
      { role: "user", content: `Job description:\n${jobDescription}\n\nResume:\n${resumeText}` },
    ]);

    if (!content) {
      return res.json({
        score: fallbackScore,
        strengths: ["Resume text was received and can be reviewed manually."],
        gaps: ["Add OPENAI_API_KEY to enable AI-powered analysis."],
        summary: "Fallback match result generated because OpenAI is not configured.",
        source: "fallback",
      });
    }

    try {
      return res.json({ ...JSON.parse(content), source: "openai" });
    } catch {
      return res.json({ raw: content, source: "openai" });
    }
  } catch (error) {
    console.error("AI resume match error:", error);
    res.status(500).json({ message: "Server error while matching resume" });
  }
};

export const analyzeCandidateSkills = async (req, res) => {
  try {
    const { resumeText, skills = "", jobDescription = "" } = req.body;

    if (!resumeText && !skills) {
      return res.status(400).json({ message: "Resume text or skills are required" });
    }

    const fallback = {
      topSkills: (skills || resumeText)
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 6),
      seniority: "Mid",
      recommendations: [
        "Add measurable project outcomes to strengthen the profile.",
        "Highlight tools that match the target job description.",
      ],
      summary: "Fallback skill analysis generated without OpenAI.",
      source: "fallback",
    };

    const content = await callOpenAI([
      {
        role: "system",
        content:
          "You analyze candidate skills for recruiters. Return JSON only with topSkills (array), seniority (string), recommendations (array), summary (string).",
      },
      {
        role: "user",
        content: `Resume:\n${resumeText || "-"}\nDeclared skills:\n${skills || "-"}\nTarget job:\n${jobDescription || "-"}`,
      },
    ]);

    if (!content) {
      return res.json(fallback);
    }

    try {
      return res.json({ ...JSON.parse(content), source: "openai" });
    } catch {
      return res.json({ raw: content, source: "openai" });
    }
  } catch (error) {
    console.error("AI skill analysis error:", error);
    res.status(500).json({ message: "Server error while analyzing skills" });
  }
};
