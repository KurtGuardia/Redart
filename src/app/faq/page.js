import Spot from '../../components/ui/Spot'
import FAQItem from '../../components/FAQItem'

const faqs = [
  {
    question: '¿Qué es Radart?',
    answer:
      'Radart es una plataforma boliviana diseñada para mostrar espacios y eventos relacionados con el arte y la cultura en todo el país.',
  },
  {
    question: '¿Cómo puedo registrar mi espacio cultural?',
    answer:
      'Para registrar tu espacio cultural, crea una cuenta en Radart y sigue las instrucciones en el panel de control para agregar la información de tu espacio.',
  },
  {
    question: '¿Es gratis usar Radart?',
    answer:
      'Sí, Radart es gratuito para los usuarios que buscan eventos y espacios culturales. Para los organizadores de eventos y espacios culturales, ofrecemos opciones gratuitas y de pago con características adicionales.',
  },
  // Add more FAQs as needed
]

export default function FAQ () {
  return (
    <>
      <Spot colorName={'SlateBlue'} />
      <Spot colorName={'Magenta'} />
      <Spot colorName={'red'} />
      <Spot colorName={'Indigo'} />
      <Spot colorName={'red'} />
      <Spot colorName={'Indigo'} />
      <div className='container mx-auto my-24 '>
        <p className='text-xl font-bold text-center mb-12'>
          Preguntas Frecuentes
        </p>
        <div className='space-y-4 max-w-9xl mx-auto '>
          {faqs.map( ( faq, index ) => (
            <div className='transform transition-transform duration-300 hover:translate-y-[-7px]'>
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
              />
            </div>
          ) )}
        </div>
      </div>
    </>
  )
}
