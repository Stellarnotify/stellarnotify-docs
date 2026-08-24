import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    { type: "doc", id: "introduction", label: "Introduction" },
    { type: "doc", id: "quick-start", label: "Quick Start" },
    { type: "doc", id: "architecture", label: "Architecture" },
    {
      type: "category",
      label: "Contract",
      items: [
        "contract/overview",
        "contract/initialise",
        "contract/subscribe",
        "contract/manage",
        "contract/errors",
      ],
    },
    {
      type: "category",
      label: "Backend",
      items: [
        "backend/overview",
        "backend/event-ingester",
        "backend/webhook-dispatcher",
        "backend/api-reference",
        "backend/self-hosting",
      ],
    },
    {
      type: "category",
      label: "Frontend",
      items: [
        "frontend/overview",
        "frontend/wallet-connect",
        "frontend/sse",
      ],
    },
    { type: "doc", id: "security", label: "Security Model" },
    { type: "doc", id: "endpoint-privacy", label: "Endpoint Privacy" },
    { type: "doc", id: "integration-guide", label: "Integration Guide" },
    { type: "doc", id: "faq", label: "FAQ" },
    { type: "doc", id: "roadmap", label: "Roadmap" },
    { type: "doc", id: "changelog", label: "Changelog" },
    { type: "doc", id: "testing", label: "Testing" },
    { type: "doc", id: "contributing", label: "Contributing" },
    { type: "doc", id: "license", label: "License" },
  ],
};

export default sidebars;
