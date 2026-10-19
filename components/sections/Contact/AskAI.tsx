"use client";

export default function AskAI() {
  return (
    <p className="contact-ai-help">
      Have more questions? <button type="button" aria-controls="oatle-chat"
        onClick={() => window.dispatchEvent(new Event("oatle:open-chat"))}>
        Ask Oatle AI
      </button>.
    </p>
  );
}
