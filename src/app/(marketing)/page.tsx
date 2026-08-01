"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  MessageSquare,
  Shield,
  FileText,
  Zap,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: <BrainCircuit className="h-10 w-10 text-primary" />,
    title: "Contextual Memory",
    description:
      "The AI remembers past interactions in the conversation, providing highly relevant and continuous responses.",
  },
  {
    icon: <FileText className="h-10 w-10 text-primary" />,
    title: "Document Parsing",
    description:
      "Upload PDFs, DOCX, and TXT files. We extract, chunk, and process the text automatically.",
  },
  {
    icon: <Search className="h-10 w-10 text-primary" />,
    title: "Semantic Search",
    description:
      "Powered by Pinecone vector databases and HuggingFace embeddings for precise information retrieval.",
  },
  {
    icon: <MessageSquare className="h-10 w-10 text-primary" />,
    title: "Interactive Chat",
    description:
      "A professional UI with streaming responses, markdown support, code blocks, and chat history.",
  },
  {
    icon: <Zap className="h-10 w-10 text-primary" />,
    title: "Lightning Fast",
    description:
      "Built on Next.js 15 App Router with server components for optimized performance and SEO.",
  },
  {
    icon: <Shield className="h-10 w-10 text-primary" />,
    title: "Secure by Design",
    description:
      "Supabase Authentication and Row Level Security ensures your documents and chats are private.",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Upload Documents",
    description:
      "Drag and drop your knowledge base files into our secure vault.",
  },
  {
    step: "02",
    title: "AI Processing",
    description:
      "We automatically split, embed, and index your documents into a vector database.",
  },
  {
    step: "03",
    title: "Ask Questions",
    description:
      "Chat with the AI. It retrieves the exact context and generates accurate answers.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-32 lg:pt-36 lg:pb-40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />

        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight">
              Unlock Your Documents with{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">
                EduRAG AI
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              The intelligent, context-aware chatbot that reads your documents
              and provides precise answers with conversational memory.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              {/* FIXED */}
              <Link href="/signup">
                <Button
                  size="lg"
                  className="h-14 px-8 text-lg w-full sm:w-auto group"
                >
                  Start for free
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>

              <Link href="#features">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 text-lg w-full sm:w-auto"
                >
                  Learn more
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Powerful RAG Capabilities
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to turn static documents into an interactive
              knowledge base.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-background rounded-2xl p-8 border shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mb-6 inline-block p-4 bg-primary/10 rounded-xl">
                  {feature.icon}
                </div>

                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>

                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How it Works
            </h2>

            <p className="text-lg text-muted-foreground">
              Three simple steps to transform your knowledge.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-transparent via-border to-transparent" />

            {howItWorks.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="relative text-center z-10"
              >
                <div className="w-24 h-24 mx-auto bg-background border-4 border-primary rounded-full flex items-center justify-center mb-6 shadow-xl">
                  <span className="text-3xl font-black text-primary">
                    {step.step}
                  </span>
                </div>

                <h3 className="text-2xl font-bold mb-4">{step.title}</h3>

                <p className="text-muted-foreground text-lg">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-primary text-primary-foreground text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:4rem_4rem]" />

        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to chat with your documents?
          </h2>

          <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto">
            Join thousands of users who have supercharged their learning and
            productivity with EduRAG AI.
          </p>

          {/* FIXED */}
          <Link href="/signup">
            <Button
              size="lg"
              variant="secondary"
              className="h-14 px-10 text-lg group"
            >
              Create an Account Now
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}