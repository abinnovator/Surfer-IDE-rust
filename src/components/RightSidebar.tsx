import { useState } from "react";
import { Send } from "lucide-react";
import { getAiResponse } from "../lib/actions/AiActions";

const RightSidebar = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    const userText = input.trim();
    if (!userText || isLoading) return;

    // 1. Append user's new message to existing conversation history
    const updatedMessages = [...messages, { role: "user", message: userText }];

    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const payload = updatedMessages.map((msg) => ({
        role: msg.role,
        content: msg.message,
      }));

      const botResponse = await getAiResponse(payload);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", message: botResponse },
      ]);
    } catch (error) {
      console.error("Failed to fetch AI response:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          message: "Sorry, I ran into an error getting a response.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="flex h-full max-h-full w-[250px] max-w-full flex-col justify-between overflow-hidden bg-[#16110B]/50">
      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex-shrink-0 border-b-2 border-b-[#675D49] px-5 py-2">
          <h1 className="font-bold text-[#675D49]">Surfer AI</h1>
        </div>

        {/* Messages List */}
        <div className="flex flex-col gap-3 p-2 text-white">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`max-w-[85%] whitespace-pre-wrap break-words rounded px-2.5 py-1.5 text-[11px] ${
                msg.role === "user"
                  ? "self-end bg-[#3D3020] text-[#E8C088]"
                  : "self-start bg-[#1C1610] text-[#9A8A78] border border-[#675D49]/30"
              }`}
            >
              {msg.message}
            </div>
          ))}

          {isLoading && (
            <div className="self-start text-[11px] italic text-[#9A8A78] animate-pulse px-2 py-1">
              Surfer AI is thinking...
            </div>
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="flex flex-shrink-0 gap-1 border-t border-t-[#3d3020] px-2 pb-3 pt-2">
        <input
          type="text"
          value={input}
          disabled={isLoading}
          aria-label="Ask Surfer AI"
          placeholder="Ask Surfer AI..."
          className="w-full rounded border border-[#675D49] bg-[#0F0B08]/80 px-3 py-2 text-sm text-[#E8C088] outline-none placeholder:text-[#675D49] focus:border-[#E8C088] disabled:opacity-50"
          onKeyDown={handleKeyDown}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="flex items-center justify-center rounded-sm bg-[#3d3020] px-2.5 text-[#E8C088] transition-colors hover:bg-[#4d3d2a] disabled:opacity-40 cursor-pointer"
        >
          <Send size={12} className="text-[#E8C088]" />
        </button>
      </div>
    </div>
  );
};

export default RightSidebar;
