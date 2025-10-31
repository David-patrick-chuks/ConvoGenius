"use client";

import { motion } from "framer-motion";
import { useState} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronDownIcon,
  HelpCircleIcon,
  
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface FAQ {
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    question: "How does ConvoGenius ensure the privacy and security of our meetings?",
    answer: "ConvoGenius uses enterprise-grade encryption (AES-256) for all data in transit and at rest. We are SOC2 Type II certified, GDPR compliant, and HIPAA ready. Your meeting data is never used for training our models."
  },
  {
    question: "Can ConvoGenius integrate with our existing video conferencing tools?",
    answer: "Yes! ConvoGenius seamlessly integrates with all major platforms including Zoom, Microsoft Teams, Google Meet, WebEx, and 50+ other tools."
  },
  {
    question: "What languages does ConvoGenius support for transcription?",
    answer: "ConvoGenius supports over 100 languages with high accuracy transcription including English, Spanish, French, German, Chinese, Japanese, and many more."
  },
  {
    question: "How accurate is the AI transcription and summary generation?",
    answer: "Our AI achieves 95%+ accuracy for transcription in optimal conditions and 90%+ in noisy environments with advanced language models."
  },
  {
    question: "Can I customize the AI agents for my specific use case?",
    answer: "Absolutely! Professional and Enterprise plans allow you to create custom AI agents with specific instructions and knowledge bases."
  },
  {
    question: "What happens if I exceed my plan limits?",
    answer: "If you approach your plan limits, we'll notify you in advance. You can easily upgrade your plan - we never interrupt your meetings."
  }
];

export const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-3xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4 bg-green-100 dark:bg-gray-800 text-green-700 dark:text-green-400 border-green-200 dark:border-gray-600">
            <HelpCircleIcon className="w-4 h-4 mr-2" />
            FAQ
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Frequently Asked
            <br />
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Got questions? We&apos;ve got answers. Find everything you need to know about ConvoGenius.
          </p>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true, margin: "-50px" }}
            >
              <Card className="overflow-hidden border border-green-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-green-200 dark:hover:border-gray-600 transition-all duration-300 bg-white dark:bg-gray-800">
                <CardContent className="p-0">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full p-5 text-left flex items-center justify-between bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-gray-700 transition-colors border-l-4 border-l-green-500 dark:border-l-green-400"
                  >
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 pr-4">
                      {faq.question}
                    </h3>
                    <motion.div
                      animate={{ rotate: openIndex === index ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-green-100 dark:bg-gray-700 p-1 rounded-full"
                    >
                      <ChevronDownIcon className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    </motion.div>
                  </button>
                  
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{
                      height: openIndex === index ? "auto" : 0,
                      opacity: openIndex === index ? 1 : 0
                    }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden bg-green-50 dark:bg-gray-700"
                  >
                    <div className="px-5 pb-5">
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
