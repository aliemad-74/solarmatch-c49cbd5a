import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, Quote } from "lucide-react";

const Testimonials = () => {
  const { t } = useTranslation();

  const testimonials = [
    {
      name: t("testimonials.person1.name"),
      role: t("testimonials.person1.role"),
      location: t("testimonials.person1.location"),
      content: t("testimonials.person1.content"),
      rating: 5,
      initials: "أم",
    },
    {
      name: t("testimonials.person2.name"),
      role: t("testimonials.person2.role"),
      location: t("testimonials.person2.location"),
      content: t("testimonials.person2.content"),
      rating: 5,
      initials: "مح",
    },
    {
      name: t("testimonials.person3.name"),
      role: t("testimonials.person3.role"),
      location: t("testimonials.person3.location"),
      content: t("testimonials.person3.content"),
      rating: 5,
      initials: "سا",
    },
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">{t("testimonials.title")}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("testimonials.subtitle")}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="relative overflow-hidden">
              <CardContent className="p-6">
                {/* Quote icon */}
                <Quote className="absolute top-4 end-4 w-8 h-8 text-primary/10" />

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-solar-gold text-solar-gold" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role} • {testimonial.location}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
