"use client"

import Layout from "../components/Layout"
import { useState } from "react"

const faqs = [
  {
    question: "¿Qué es Radarte?",
    answer:
      "Radarte es una plataforma boliviana diseñada para mostrar espacios y eventos relacionados con el arte y la cultura en todo el país.",
  },
  {
    question: "¿Cómo puedo registrar mi espacio cultural?",
    answer:
      "Para registrar tu espacio cultural, crea una cuenta en Radarte y sigue las instrucciones en el panel de control para agregar la información de tu espacio.",
  },
  {
    question: "¿Es gratis usar Radarte?",
    answer:
      "Sí, Radarte es gratuito para los usuarios que buscan eventos y espacios culturales. Para los organizadores de eventos y espacios culturales, ofrecemos opciones gratuitas y de pago con características adicionales.",
  },
  // Add more FAQs as needed
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null)

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Preguntas frecuentes</h1>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-gray-200 pb-4">
              <button className="flex justify-between items-center w-full text-left" onClick={() => toggleFAQ(index)}>
                <span className="text-lg font-semibold">{faq.question}</span>
                <svg
                  className={`w-6 h-6 transition-transform ${openIndex === index ? "transform rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === index && <p className="mt-2 text-gray-600">{faq.answer}</p>}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}

