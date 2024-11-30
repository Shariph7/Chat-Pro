import React, { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAi = new GoogleGenerativeAI("AIzaSyC09fXG8iduP7azHLz3j1j3DxHvg84P2Z4");
const model = genAi.getGenerativeModel({ model: "gemini-1.5-pro" });

function ChatApp() {
  const [messages, setMessages] = useState([
    { sender: "user", text: "Hello" },
    { sender: "ai", text: "Hello, Hi" },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messageEndRef = useRef(null);
  const chatSessionRef = useRef(null);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    if (!chatSessionRef.current) {
      chatSessionRef.current = model.startChat({
        generationConfig: {
          temperature: 0.9,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        },
        history: [],
      });
    }
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: input }]);
    setInput("");
    setIsTyping(true);

    try {
      let fullResponse = "";
      const result = await chatSessionRef.current.sendMessageStream(input);

      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "", isGenerating: true },
      ]);

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullResponse += chunkText;

        setMessages((prev) => [
          ...prev.slice(0, -1),
          { sender: "ai", text: fullResponse, isGenerating: true },
        ]);
      }

      setMessages((prev) => [
        ...prev.slice(0, -1),
        { sender: "ai", text: fullResponse, isGenerating: false },
      ]);
      setIsTyping(false);
    } catch (error) {
      console.error("Error during API call:", error);
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Sorry, there is an error!" },
      ]);
    }
  };

  const MarkdownComponent = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Sidebar */}
      <div className="sidebar">
        <h1>Chat Pro+</h1>
        <button onClick={() => setMessages([])}>+ New Chat</button>
      </div>

      {/* Main Section */}
      <div className="main">
        <div className="content">
          {/* Header */}
          <div className="hello-section">
            <h1>
              Chat Pro+ <span>Plus</span>
            </h1>
            <div>Hello, how can I help you?</div>
          </div>

          {/* Chat Messages */}
          <div
            className="cards"
            style={{
              flexGrow: 1,
              overflowY: "auto",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {messages.map((message, index) => (
              <div
                key={index}
                className={`${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
                style={{
                  display: "flex",
                  justifyContent:
                    message.sender === "user" ? "flex-end" : "flex-start",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    maxWidth: "70%",
                    padding: "10px",
                    borderRadius: "10px",
                    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
                    backgroundColor:
                      message.sender === "user" ? "#007BFF" : "#EFEFEF",
                    color: message.sender === "user" ? "#fff" : "#333",
                  }}
                >
                  {message.sender === "user" ? (
                    message.text
                  ) : (
                    <ReactMarkdown
                      components={MarkdownComponent}
                      className={`prose ${
                        message.isGenerating ? "typing-animation" : ""
                      }`}
                    >
                      {message.text || "Thinking..."}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div
                style={{
                  padding: "10px",
                  backgroundColor: "#EFEFEF",
                  borderRadius: "10px",
                }}
              >
                Typing...
              </div>
            )}

            <div ref={messageEndRef} />
          </div>
        </div>

        {/* Footer */}
        <form className="footer" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Chat with Chat Pro+"
            style={{
              flex: 1,
              padding: "10px",
              border: "none",
              borderRadius: "8px",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "12px 40px",
              backgroundColor: "#007BFF",
              color: "white",
              border: "none",
              borderRadius: "8px",
              marginLeft: "10px",
              cursor: "pointer",
            }}
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatApp;