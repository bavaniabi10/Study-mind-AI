import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Gemini AI client initialization
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in environment variables.");
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "StudyMind AI Server" });
  });

  // 1. Doubt Resolver Endpoint
  app.post("/api/doubt", async (req, res) => {
    try {
      const { subject, question, style, contextText } = req.body;
      if (!question) {
        return res.status(400).json({ error: "Question is required." });
      }

      const ai = getGeminiClient();

      let styleGuidance = "";
      switch (style) {
        case "feynman":
          styleGuidance = "Explain using the Feynman Technique: extremely simple language, plain everyday analogies, zero unnecessary jargon, as if teaching a beginner or high-school student.";
          break;
        case "analogies":
          styleGuidance = "Focus heavily on intuitive real-world analogies and visual metaphors to explain the core mechanism before formal details.";
          break;
        case "step_by_step":
          styleGuidance = "Provide a strict, numbered step-by-step problem-solving or logical breakdown showing exact reasoning at each step.";
          break;
        default:
          styleGuidance = "Provide a clean, rigorous, college-level explanation balancing theory, intuition, and academic depth.";
          break;
      }

      const prompt = `Subject: ${subject || "General Academic Subject"}
Student Question / Study Doubt: ${question}
${contextText ? `Additional Reading Context: ${contextText}` : ""}

${styleGuidance}

Provide your answer in strict JSON format.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an elite college professor and empathetic study mentor. You break down complex concepts into crystal-clear explanations.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING, description: "A concise 1-2 sentence core concept summary." },
              answer: { type: Type.STRING, description: "Comprehensive, well-formatted Markdown explanation." },
              analogies: { type: Type.STRING, description: "A memorable real-world analogy." },
              keyTakeaways: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3 to 5 key bullet points to remember for exams."
              },
              commonMisconceptions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "1 to 3 frequent mistakes or misconceptions students make on this topic."
              },
              suggestedFollowUps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3 relevant follow-up questions the student should ask next to deepen understanding."
              }
            },
            required: ["summary", "answer", "keyTakeaways", "commonMisconceptions", "suggestedFollowUps"]
          }
        }
      });

      const resultText = response.text || "{}";
      const parsedData = JSON.parse(resultText);
      res.json(parsedData);
    } catch (error: any) {
      console.error("Error resolving doubt:", error);
      res.status(500).json({ error: error.message || "Failed to resolve study doubt." });
    }
  });

  // 2. Study Notes Generator Endpoint
  app.post("/api/notes", async (req, res) => {
    try {
      const { subject, topic, depth, lectureText } = req.body;
      if (!topic && !lectureText) {
        return res.status(400).json({ error: "Topic or lecture text is required." });
      }

      const ai = getGeminiClient();

      const prompt = `Generate comprehensive, exam-ready college study notes.
Subject: ${subject || "General Academic"}
Topic / Content: ${topic || "Lecture Content"}
Depth level: ${depth || "comprehensive"}
${lectureText ? `Source Text / Transcript:\n${lectureText}` : ""}

Create structured notes in JSON format.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an expert academic tutor creating structured, pristine study notes. Use rich markdown formatting, headings, bullet points, and code/latex blocks where applicable.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Clear, engaging notes title." },
              executiveSummary: { type: Type.STRING, description: "A high-level 3-sentence summary of the core topic." },
              markdownContent: { type: Type.STRING, description: "Full structured notes in Markdown (including Overview, Core Principles, Key Formulas/Rules, Detailed Breakdown, and Practical Examples)." },
              keyTerms: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    term: { type: Type.STRING },
                    definition: { type: Type.STRING }
                  },
                  required: ["term", "definition"]
                },
                description: "5 to 8 key terms and vocabulary definitions."
              },
              examPitfalls: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3 to 5 common exam traps, tricks, or points where students lose marks."
              },
              flashcards: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    front: { type: Type.STRING, description: "Question or term on front of flashcard" },
                    back: { type: Type.STRING, description: "Answer or explanation on back of flashcard" }
                  },
                  required: ["front", "back"]
                },
                description: "5 active-recall flashcard question-answer pairs."
              }
            },
            required: ["title", "executiveSummary", "markdownContent", "keyTerms", "examPitfalls", "flashcards"]
          }
        }
      });

      const resultText = response.text || "{}";
      const parsedData = JSON.parse(resultText);
      res.json({
        ...parsedData,
        id: `note-${Date.now()}`,
        subject: subject || "General",
        timestamp: Date.now()
      });
    } catch (error: any) {
      console.error("Error generating study notes:", error);
      res.status(500).json({ error: error.message || "Failed to generate notes." });
    }
  });

  // 3. Quiz & MCQ Generator Endpoint
  app.post("/api/quiz", async (req, res) => {
    try {
      const { subject, topic, numQuestions = 5, difficulty = "medium", focus = "conceptual" } = req.body;
      if (!topic) {
        return res.status(400).json({ error: "Topic is required for quiz generation." });
      }

      const ai = getGeminiClient();

      const prompt = `Generate a high-quality college practice quiz with multiple-choice questions (MCQs).
Subject: ${subject || "General Academic"}
Topic: ${topic}
Number of Questions: ${numQuestions}
Difficulty: ${difficulty} (college undergrad level)
Focus: ${focus} (e.g. conceptual understanding, calculations, or practical applications)

Return a strict JSON object with a 'questions' array. Each question must have 4 options, 1 correct index (0-3), detailed explanation of why the correct option is right AND why common wrong choices are traps, a helpful hint, and a specific concept tag.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an experienced college exam creator. Make MCQs realistic, thought-provoking, and educational with clear explanations.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    question: { type: Type.STRING, description: "The MCQ question text." },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Array of 4 options."
                    },
                    correctAnswerIndex: { type: Type.INTEGER, description: "Index 0, 1, 2, or 3." },
                    explanation: { type: Type.STRING, description: "Comprehensive explanation of the correct solution." },
                    hint: { type: Type.STRING, description: "Subtle nudge without giving away the answer." },
                    conceptTag: { type: Type.STRING, description: "Sub-topic tag like 'Memory Overhead' or 'Integral Calculus'." }
                  },
                  required: ["question", "options", "correctAnswerIndex", "explanation", "hint", "conceptTag"]
                }
              }
            },
            required: ["questions"]
          }
        }
      });

      const resultText = response.text || "{}";
      const parsedData = JSON.parse(resultText);
      const formattedQuestions = (parsedData.questions || []).map((q: any, idx: number) => ({
        ...q,
        id: q.id || `q-${idx + 1}-${Date.now()}`
      }));

      res.json({ questions: formattedQuestions });
    } catch (error: any) {
      console.error("Error generating quiz:", error);
      res.status(500).json({ error: error.message || "Failed to generate quiz questions." });
    }
  });

  // 4. Study Plan Generator Endpoint
  app.post("/api/study-plan", async (req, res) => {
    try {
      const { subject, goal, daysRemaining = 7, dailyHours = 2, currentLevel = "intermediate", studyMethod = "active_recall" } = req.body;
      if (!subject || !goal) {
        return res.status(400).json({ error: "Subject and goal are required." });
      }

      const ai = getGeminiClient();

      const prompt = `Create an actionable, day-by-day college study plan.
Subject: ${subject}
Target Goal / Exam: ${goal}
Days Available: ${daysRemaining} days
Daily Dedicated Hours: ${dailyHours} hours/day
Current Knowledge Level: ${currentLevel}
Study Strategy Preference: ${studyMethod}

Return a JSON plan with weekly overview, key milestone checkpoints, daily structured tasks (with specific topic focus, active study exercise, and estimated hours), and exam day strategy.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an expert academic advisor specializing in learning psychology, active recall, and spaced repetition schedules.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              weeklyOverview: { type: Type.STRING, description: "Strategic summary of the study plan structure." },
              examStrategy: { type: Type.STRING, description: "Advice for the final 24 hours and exam execution." },
              milestones: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    day: { type: Type.INTEGER },
                    milestone: { type: Type.STRING }
                  },
                  required: ["day", "milestone"]
                }
              },
              dailyTasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    dayNumber: { type: Type.INTEGER },
                    title: { type: Type.STRING, description: "Catchy title for the day's study block." },
                    topics: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Specific subtopics to master."
                    },
                    activity: { type: Type.STRING, description: "Concrete study technique action item." },
                    estimatedHours: { type: Type.NUMBER }
                  },
                  required: ["dayNumber", "title", "topics", "activity", "estimatedHours"]
                }
              }
            },
            required: ["weeklyOverview", "examStrategy", "milestones", "dailyTasks"]
          }
        }
      });

      const resultText = response.text || "{}";
      const parsedData = JSON.parse(resultText);

      res.json({
        id: `plan-${Date.now()}`,
        subject,
        goal,
        totalDays: Number(daysRemaining),
        dailyHours: Number(dailyHours),
        ...parsedData,
        timestamp: Date.now()
      });
    } catch (error: any) {
      console.error("Error creating study plan:", error);
      res.status(500).json({ error: error.message || "Failed to create study plan." });
    }
  });

  // 5. Revision Flashcards Generator Endpoint
  app.post("/api/revision/flashcards", async (req, res) => {
    try {
      const { subject, topic, count = 8 } = req.body;
      if (!topic) {
        return res.status(400).json({ error: "Topic is required for flashcards." });
      }

      const ai = getGeminiClient();

      const prompt = `Generate ${count} high-yield active recall flashcards for college revision.
Subject: ${subject || "General Academic"}
Topic: ${topic}

Each flashcard should test a fundamental concept, formula, mechanism, or distinction. Return JSON array of flashcards with 'front' (clear question or prompt) and 'back' (concise, clear answer with key terms).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a master of active recall and spaced repetition flashcard design.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              flashcards: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    front: { type: Type.STRING },
                    back: { type: Type.STRING }
                  },
                  required: ["front", "back"]
                }
              }
            },
            required: ["flashcards"]
          }
        }
      });

      const resultText = response.text || "{}";
      const parsedData = JSON.parse(resultText);

      const cards = (parsedData.flashcards || []).map((card: any, index: number) => ({
        id: `card-${Date.now()}-${index}`,
        subject: subject || "General",
        topic,
        front: card.front,
        back: card.back,
        status: "new"
      }));

      res.json({ flashcards: cards });
    } catch (error: any) {
      console.error("Error generating revision flashcards:", error);
      res.status(500).json({ error: error.message || "Failed to generate revision flashcards." });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`StudyMind AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
