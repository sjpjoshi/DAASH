"use client";

import { useState, useEffect, useRef } from "react";
import { title } from "@/components/primitives";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { Listbox, ListboxItem } from "@heroui/listbox";
import { Icon } from "@iconify/react";
import ParticleConnections from "@/components/particleConnections";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Document {
  id: string;
  trustLevel: number;
}

export default function AugmentedChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [contextUrls, setContextUrls] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [contextMode, setContextMode] = useState<"url" | "docs">("url");
  const [useTrustedDocs, setUseTrustedDocs] = useState(false);
  const [trustedDocs, setTrustedDocs] = useState<Document[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [trustLevel, setTrustLevel] = useState<number>(1);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch trusted documents when the toggle is switched on
  useEffect(() => {
    if (useTrustedDocs) {
      fetchTrustedDocs();
    }
  }, [useTrustedDocs, trustLevel]);

  // Auto-scroll to the bottom of the chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchTrustedDocs = async () => {
    try {
      const response = await fetch(`/api/getTrustedDocs?level=${trustLevel}`);
      const data = await response.json();
      setTrustedDocs(data);
    } catch (error) {
      console.error("Error fetching trusted documents:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message to chat
    const userMessage = { role: "user" as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Call the actual API endpoint
      const response = await fetch("/api/sendChatMessage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: input,
          trustedUrls: selectedDocs,
          untrustedUrls: contextUrls,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response}`);
      }

      const data = await response.json();

      const assistantMessage = {
        role: "assistant" as const,
        content: data.response || "Sorry, I couldn't generate a response.",
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        role: "assistant" as const,
        content: "Sorry, there was an error processing your request. Please try again.",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;

    try {
      // Validate URL format
      new URL(urlInput);

      // Check if URL exists in either contextUrls or selectedDocs
      if (!contextUrls.includes(urlInput) && !selectedDocs.includes(urlInput)) {
        setContextUrls(prev => [...prev, urlInput]);
      } else {
        alert("This URL is already added as context");
      }
      setUrlInput("");
    } catch (e) {
      alert("Please enter a valid URL");
    }
  };

  const handleRemoveUrl = (url: string) => {
    setContextUrls(prev => prev.filter(item => item !== url));
  };

  const handleToggleDocument = (docId: string) => {
    setSelectedDocs(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (contextMode === "url" && urlInput) {
        handleAddUrl();
      } else if (input) {
        handleSendMessage();
      }
    }
  };

  const getTrustLevelLabel = (level: number) => {
    switch (level) {
      case 0:
        return "Untrusted";
      case 1:
        return "Machine Checked";
      case 2:
        return "AI Assisted";
      case 3:
        return "Human Verified";
      default:
        return "Unknown";
    }
  };

  const getDocumentTrustLevel = (docId: string): number | null => {
    const doc = trustedDocs.find(doc => doc.id === docId);
    return doc ? doc.trustLevel : null;
  };

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <ParticleConnections className="absolute inset-0 z-0" />
      <div className="relative z-10 flex h-full w-full max-w-[50vw] flex-col">
        <h1 className={title({ class: "mb-6 text-center" })}>
          Chat with <span className={title({ color: "violet" })}>Context</span>
        </h1>

        <div className="flex max-h-[68vh] flex-grow flex-col overflow-hidden rounded-lg bg-content1 shadow-md">
          {/* Chat messages area */}
          <div className="flex flex-grow flex-col overflow-hidden">
            <div className="max-h-[50vh] flex-grow overflow-y-auto p-4 scrollbar-hide">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-4 ${message.role === "assistant" ? "bg-secondary-50 dark:bg-secondary-900/20" : "bg-content2"} rounded-lg p-3`}
                >
                  <div className="mb-1 font-semibold">
                    {message.role === "assistant" ? "Assistant" : "You"}
                  </div>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              ))}
              {isLoading && (
                <div className="mb-4 rounded-lg bg-secondary-50 p-3 dark:bg-secondary-900/20">
                  <div className="mb-1 font-semibold">Assistant</div>
                  <div className="flex items-center">
                    <div className="mr-1 h-2 w-2 animate-bounce rounded-full bg-secondary"></div>
                    <div
                      className="mr-1 h-2 w-2 animate-bounce rounded-full bg-secondary"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-secondary"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Display selected context */}
            {(contextUrls.length > 0 || selectedDocs.length > 0) && (
              <div className="max-h-[15vh] border-t border-divider p-3">
                <h4 className="mb-1 text-xs font-medium">Active Context:</h4>
                <div className="max-h-[calc(15vh-30px)] overflow-y-auto scrollbar-hide">
                  {contextUrls.map(url => (
                    <div
                      key={url}
                      className="mb-1 flex items-center rounded bg-content2 px-2 py-1 text-xs"
                    >
                      <span className="flex-grow truncate">{url}</span>
                      <span className="ml-2 text-nowrap rounded bg-gray-100 px-1 text-right text-xs dark:bg-secondary-900/30">
                        External
                      </span>
                      <button onClick={() => handleRemoveUrl(url)} className="ml-2 text-danger">
                        <Icon icon="heroicons:x-mark" />
                      </button>
                    </div>
                  ))}
                  {selectedDocs.map(docId => (
                    <div
                      key={docId}
                      className="mb-1 flex items-center rounded bg-content2 px-2 py-1 text-xs"
                    >
                      <span className="flex-grow truncate">{docId}</span>
                      <span className="ml-2 text-nowrap rounded bg-secondary-100 px-1 text-right text-xs dark:bg-secondary-900/30">
                        {getTrustLevelLabel(getDocumentTrustLevel(docId) || 0)}
                      </span>
                      <button
                        onClick={() => handleToggleDocument(docId)}
                        className="ml-2 text-danger"
                      >
                        <Icon icon="heroicons:x-mark" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-divider p-3">
            <div className="flex">
              <Input
                placeholder="Question the LLM with context..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-grow"
                disabled={isLoading}
                endContent={
                  <div className="flex items-center">
                    <Popover placement="top">
                      <PopoverTrigger>
                        <button
                          className="mr-2 text-default-400 hover:text-secondary"
                          aria-label="Add context"
                        >
                          <Icon icon="heroicons:link" className="text-lg" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="max-h-[70vh] w-[350px] overflow-hidden sm:w-[400px]">
                        <div className="flex h-full w-full flex-col p-1">
                          <div className="mb-2 flex items-center justify-center">
                            <div className="flex flex-row items-center gap-2">
                              <button
                                className={`rounded-md px-3 py-1 text-sm ${contextMode === "url" ? "bg-secondary text-white" : "bg-content2"}`}
                                onClick={() => setContextMode("url")}
                              >
                                Add URL
                              </button>
                              <button
                                className={`rounded-md px-3 py-1 text-sm ${contextMode === "docs" ? "bg-secondary text-white" : "bg-content2"}`}
                                onClick={() => {
                                  setContextMode("docs");
                                  setUseTrustedDocs(true);
                                }}
                              >
                                Trusted Docs
                              </button>
                            </div>
                          </div>

                          <div className="flex-grow overflow-auto">
                            {contextMode === "url" ? (
                              <div className="mb-2 w-full px-4 py-2">
                                <div className="flex min-w-full">
                                  <Input
                                    placeholder="Enter a URL to add as context"
                                    value={urlInput}
                                    onChange={e => setUrlInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="flex-grow"
                                    size="sm"
                                  />
                                  <Button
                                    color="secondary"
                                    className="ml-2"
                                    onPress={handleAddUrl}
                                    size="sm"
                                  >
                                    Add
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="mb-2">
                                <div className="mb-2 ml-4 mt-2 flex items-center">
                                  <span className="mr-2 text-center text-xs">
                                    Minimum Trust Level: <br /> {getTrustLevelLabel(trustLevel)}
                                  </span>
                                  <input
                                    type="range"
                                    min="0"
                                    max="3"
                                    value={trustLevel}
                                    onChange={e => setTrustLevel(parseInt(e.target.value))}
                                    className="mr-8 flex-grow accent-secondary"
                                  />
                                </div>
                                <div className="overflow-y-auto" style={{ maxHeight: "40vh" }}>
                                  {trustedDocs.length === 0 ? (
                                    <p className="text-sm text-gray-500">
                                      No trusted documents found at this level
                                    </p>
                                  ) : (
                                    <Listbox
                                      aria-label="Trusted Documents"
                                      selectionMode="multiple"
                                      selectedKeys={selectedDocs}
                                      onSelectionChange={keys => {
                                        if (keys !== "all") {
                                          const newSelectedDocs = Array.from(keys) as string[];

                                          // Check for any docs that are already in contextUrls
                                          const duplicates = newSelectedDocs.filter(doc =>
                                            contextUrls.includes(doc)
                                          );

                                          if (duplicates.length > 0) {
                                            // Alert about duplicates
                                            alert(
                                              `Some documents are already added as external context: ${duplicates.join(", ")}`
                                            );

                                            // Remove duplicates from selection
                                            const filteredDocs = newSelectedDocs.filter(
                                              doc => !contextUrls.includes(doc)
                                            );
                                            setSelectedDocs(filteredDocs);
                                          } else {
                                            // No duplicates, proceed normally
                                            setSelectedDocs(newSelectedDocs);
                                          }
                                        }
                                      }}
                                      className="max-h-full"
                                    >
                                      {trustedDocs.map(doc => (
                                        <ListboxItem key={doc.id} textValue={doc.id}>
                                          <div className="flex w-full items-center justify-between">
                                            <span className="max-w-[220px] truncate text-left text-sm sm:max-w-[220px]">
                                              {doc.id}
                                            </span>
                                            <span className="ml-2 text-nowrap rounded bg-secondary-100 px-1 text-right text-xs dark:bg-secondary-900/30">
                                              {getTrustLevelLabel(doc.trustLevel)}
                                            </span>
                                          </div>
                                        </ListboxItem>
                                      ))}
                                    </Listbox>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                }
              />
              <Button
                color="secondary"
                className="ml-2"
                onPress={handleSendMessage}
                isDisabled={!input.trim() || isLoading}
              >
                <Icon icon="heroicons:paper-airplane" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
