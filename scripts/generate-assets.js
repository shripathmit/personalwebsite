/**
 * Generates og-image.png (1200×630) and resume.pdf for the static site.
 * Run: npm run build:assets
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const PDFDocument = require("pdfkit");

const root = path.join(__dirname, "..");

async function generateAppleTouchIcon() {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="180" height="180" xmlns="http://www.w3.org/2000/svg">
  <rect width="180" height="180" rx="36" fill="#141414"/>
  <text x="90" y="112" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="64" font-weight="600" fill="#faf9f7">SP</text>
</svg>`;
  const out = path.join(root, "apple-touch-icon.png");
  await sharp(Buffer.from(svg)).png().toFile(out);
  console.log("Wrote", out);
}

async function generateOgImage() {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect fill="#faf9f7" width="1200" height="630"/>
  <rect fill="#141414" x="0" y="0" width="1200" height="4"/>
  <text x="600" y="260" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="52" font-weight="600" fill="#141414">Shridhar Pathak</text>
  <text x="600" y="320" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="24" fill="#5c5c5c">AI Engineering Leader · MIT Sloan MBA (2026)</text>
  <text x="600" y="370" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="20" fill="#2d4a3e">Moderna · Amazon Alexa · Stealth venture</text>
  <text x="600" y="480" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="16" fill="#8c8c8c">shridharpathak.me</text>
</svg>`;
  const out = path.join(root, "og-image.png");
  await sharp(Buffer.from(svg)).png().toFile(out);
  console.log("Wrote", out);
}

function generateResumePdf() {
  const out = path.join(root, "resume.pdf");
  const doc = new PDFDocument({ margins: { top: 40, bottom: 40, left: 50, right: 50 }, size: "LETTER" });
  const stream = fs.createWriteStream(out);
  doc.pipe(stream);

  const BLACK = "#000000";
  const DARK = "#222222";
  const MUTED = "#444444";
  const ACCENT = "#1a6e1a";
  const contentW = 512;

  function sectionHeading(text) {
    doc.moveDown(0.6);
    doc.fontSize(10.5).font("Helvetica-Bold").fillColor(BLACK).text(text.toUpperCase(), { characterSpacing: 0.5 });
    doc.moveTo(doc.x, doc.y + 1).lineTo(doc.x + contentW, doc.y + 1).lineWidth(0.75).strokeColor(BLACK).stroke();
    doc.moveDown(0.4);
  }

  function roleHeader(title, location, dates) {
    doc.fontSize(9.5).font("Helvetica-Bold").fillColor(DARK).text(title, { continued: false });
    if (location || dates) {
      var meta = [location, dates].filter(Boolean).join(" | ");
      doc.fontSize(8.5).font("Helvetica").fillColor(MUTED).text(meta);
    }
    doc.moveDown(0.2);
  }

  function bullet(text) {
    var x = doc.x;
    doc.fontSize(8.5).font("Helvetica").fillColor(DARK);
    doc.text("\u2022  " + text, x, doc.y, { width: contentW, indent: 0, align: "left" });
    doc.moveDown(0.15);
  }

  function para(text) {
    doc.fontSize(8.5).font("Helvetica").fillColor(DARK).text(text, { width: contentW, align: "left" });
    doc.moveDown(0.15);
  }

  // --- Name ---
  doc.fontSize(16).font("Helvetica-Bold").fillColor(BLACK).text("SHRIDHAR PATHAK", { align: "left" });
  doc.moveDown(0.1);

  // --- Contact ---
  doc.fontSize(8.5).font("Helvetica").fillColor(ACCENT)
    .text("shripathmit@gmail.com", { continued: true, link: "mailto:shripathmit@gmail.com" })
    .fillColor(MUTED).text(",  ", { continued: true })
    .fillColor(ACCENT).text("www.linkedin.com/in/shridhar-pathak-19277927", { continued: true, link: "https://www.linkedin.com/in/shridhar-pathak-19277927" })
    .fillColor(MUTED).text(",  ", { continued: true })
    .fillColor(ACCENT).text("www.shridharpathak.me", { link: "https://www.shridharpathak.me" });

  // --- Professional Summary ---
  sectionHeading("Professional Summary");
  para("AI Engineering Leader with 15 years in distributed systems and multi-agent AI. Built global consumer AI at Amazon Alexa; directs enterprise GenAI at Moderna; Founder & Advisor on a stealth enterprise agent evaluation platform (tracing, observability, evals). Scaled engineering organizations to 50+ members; managed programs with 40 direct reports and 145+ partner-team reports. Executive MBA candidate at MIT Sloan (2026), cross-registered at HBS.");

  // --- Core Leadership & Technical Expertise ---
  sectionHeading("Core Leadership & Technical Expertise");
  para("Conversational Agents & Multi-Agent Systems, LLM Orchestration, Fine-Tuning Strategy, Applied Generative AI Infrastructure, AI Platform Architecture & Developer Experience, Cloud-Native ML Systems (AWS, Distributed Microservices), AI Governance & Enterprise Compliance, Engineering Org Design & Global Delivery, Cross-Org Strategy (Research, Product, Infra, Legal, External Partners), MLOps.");

  // --- Professional Experience ---
  sectionHeading("Professional Experience");

  roleHeader("Stealth AI venture: Founder & Advisor — Enterprise Agent Eval Platform", null, "2025 \u2013 Present");
  bullet("Digital worker platform with full tracing and observability for AI agents (actions, decisions, outputs) plus automated/human evaluation pipeline to catch regressions before launch and improve quality over time.");
  bullet("50+ enterprise discovery calls; three design-partner pilots; validated seed-stage pricing model within six months; technical architecture and MVP.");

  doc.moveDown(0.3);
  roleHeader("Senior Director, AI & ML: Moderna", "Cambridge, MA", "2023 \u2013 Present");
  bullet("Defined and executed Moderna\u2019s generative AI roadmap for 20+ enterprise applications, including conversational agents, function calling, and LLM orchestration workflows for R&D, manufacturing, and clinical operations. Built and led cross-functional AI/ML engineering teams (35+ engineers) delivering production LLM-based applications integrated with cloud infrastructure (AWS).");
  bullet("Partnered with C-suite and business unit leaders to translate AI technical capabilities into measurable business outcomes, accelerating go-to-market strategy and stakeholder buy-in across pharmaceutical R&D, quality, and regulatory teams. Established strategic partnerships with OpenAI, AWS, and cloud AI vendors to integrate cutting-edge generative AI technologies into enterprise platforms.");

  doc.moveDown(0.3);
  roleHeader("Amazon: Senior Manager & Tech Lead, Alexa AI", "Seattle, WA | Bengaluru, India", "2018 \u2013 23");
  para("Senior engineering leader responsible for large-scale conversational AI and multi-agent orchestration frameworks powering Alexa globally, managing 40 direct reports and 145+ partner-team reports spread across 8+ countries. Key Leadership Contributions:");
  doc.moveDown(0.15);
  bullet("Multi-Agent Conversational Framework (Foundational Work for Agentic Systems): Architected and launched Alexa\u2019s first multi-agent conversational switching framework. Enabled seamless orchestration across celebrity personalities (Melissa McCarthy, Shaquille O\u2019Neal, Amitabh Bachchan) and partner agents (Disney). Designed contextual aggregation and routing services handling millions of low-latency voice requests daily. Built scalable architecture supporting dynamic agent selection and personality switching.");
  bullet("Global AI Product Expansion: Launched Alexa Voice Shopping across US, India, Japan, Canada, France, Italy, Spain, Mexico, Ireland, and Australia. Delivered international AI product rollouts requiring localization, regulatory adaptation, and infrastructure scaling.");
  bullet("Applied ML Systems: Led integration of speech recognition, NLP, contextual understanding, and response orchestration. Defined APIs and service endpoints enabling ML-powered interactions in the Amazon India retail app (millions of DAU). Balanced personalization, privacy, latency, and reliability at global scale.");

  doc.end();
  return new Promise((resolve, reject) => {
    stream.on("finish", () => {
      console.log("Wrote", out);
      resolve();
    });
    stream.on("error", reject);
  });
}

async function main() {
  await generateAppleTouchIcon();
  await generateOgImage();
  await generateResumePdf();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
