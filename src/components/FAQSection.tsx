import { useTranslation } from "react-i18next";
import { HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQSection = () => {
  const { t } = useTranslation();

  const faqs = [
    { key: "howMuchCost" },
    { key: "roofSize" },
    { key: "paybackPeriod" },
    { key: "maintenance" },
    { key: "gridConnection" },
    { key: "lifespan" },
    { key: "weather" },
    { key: "permits" },
  ];

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="container max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <HelpCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{t('faq.badge')}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
            {t('faq.title')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('faq.subtitle')}
          </p>
        </div>

        {/* FAQ Accordion */}
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={faq.key}
              value={faq.key}
              className="bg-card border border-border/50 rounded-xl px-6 data-[state=open]:border-primary/30 data-[state=open]:shadow-lg transition-all"
            >
              <AccordionTrigger className="text-start hover:no-underline py-5">
                <span className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  <span className="font-medium text-foreground">
                    {t(`faq.questions.${faq.key}.q`)}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5 ps-11">
                {t(`faq.questions.${faq.key}.a`)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
