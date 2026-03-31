import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SolarCalculation } from "@/lib/solarData";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

type Message = { role: "user" | "assistant"; content: string };

interface SolarChatBotProps {
  results?: SolarCalculation | null;
  locationName?: string;
  preloadedRecommendation?: string;
  monthlyConsumption?: number;
  pvType?: string;
  buildingType?: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/solar-chat`;

async function streamChat({
  messages,
  solarContext,
  language,
  onDelta,
  onDone,
  onError,
}: {
  messages: Message[];
  solarContext: Record<string, unknown> | null;
  language: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (status: number) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, solarContext, language }),
  });

  if (!resp.ok) {
    onError(resp.status);
    return;
  }
  if (!resp.body) throw new Error("No response body");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") { streamDone = true; break; }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  // flush
  if (textBuffer.trim()) {
    for (let raw of textBuffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
}

const SolarChatBot = ({ results, locationName, preloadedRecommendation, monthlyConsumption, pvType, buildingType }: SolarChatBotProps) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize with preloaded recommendation on first open
  const handleOpen = useCallback(() => {
    setIsOpen(true);
    if (!initialized && preloadedRecommendation && preloadedRecommendation !== "AI analysis unavailable. Results are based on engineering calculations.") {
      setMessages([{ role: "assistant", content: preloadedRecommendation }]);
      setInitialized(true);
    } else if (!initialized) {
      setInitialized(true);
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [initialized, preloadedRecommendation]);

  const solarContext = results ? {
    locationName: locationName || "",
    systemSize: results.kWInstalled,
    annualProduction: results.energyYear,
    totalCost: results.totalCost,
    annualSavings: results.savingsYear,
    paybackYears: results.paybackYears,
    coverageRatio: results.coverageRatio,
    co2Saved: results.co2Saved,
    pvType: pvType || "",
    buildingType: buildingType || "",
    monthlyConsumption: monthlyConsumption || 0,
  } : null;

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMsg: Message = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && prev.length === newMessages.length + 1) {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: newMessages,
        solarContext,
        language: i18n.language,
        onDelta: upsertAssistant,
        onDone: () => setIsStreaming(false),
        onError: (status) => {
          setIsStreaming(false);
          if (status === 429) toast.error(t("chat.rateLimit"));
          else if (status === 402) toast.error(t("chat.paymentError"));
          else toast.error(t("chat.error"));
        },
      });
    } catch {
      setIsStreaming(false);
      toast.error(t("chat.error"));
    }
  };

  const suggestedQuestions = [
    t("chat.suggested1"),
    t("chat.suggested2"),
    t("chat.suggested3"),
  ];

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed z-50 bottom-20 md:bottom-6 p-3.5 rounded-full shadow-lg gradient-solar text-primary-foreground hover:scale-110 transition-transform"
          style={{ [isAr ? "left" : "right"]: "1.25rem" }}
          aria-label="Open Solar Chat"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div
          className="fixed z-50 bottom-20 md:bottom-6 flex flex-col bg-background border border-border rounded-2xl shadow-2xl overflow-hidden"
          style={{
            [isAr ? "left" : "right"]: "1.25rem",
            width: "min(360px, calc(100vw - 2rem))",
            height: "min(460px, calc(100vh - 8rem))",
          }}
          dir={isAr ? "rtl" : "ltr"}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold text-sm">{t("chat.title")}</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:opacity-80">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-2">
                <Sparkles className="w-8 h-8 text-primary opacity-50" />
                <p className="text-xs text-muted-foreground">{t("chat.welcome")}</p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q)}
                      className="text-xs px-2.5 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? (isAr ? "justify-start" : "justify-end") : (isAr ? "justify-end" : "justify-start")}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-1 [&>ul]:mb-1">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}

            {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}

            {/* Suggested after first AI response */}
            {messages.length > 0 && !isStreaming && messages[messages.length - 1]?.role === "assistant" && messages.length <= 2 && (
              <div className="flex flex-wrap gap-1.5">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="text-xs px-2.5 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-border px-3 py-2.5 flex items-center gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
              placeholder={t("chat.placeholder")}
              disabled={isStreaming}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              dir="auto"
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isStreaming}
              className="shrink-0 h-8 w-8"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default SolarChatBot;
