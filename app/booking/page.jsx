"use client";

import BookingForm from "../../components/booking/BookingForm";

export default function BookingPage() {
  return (
    <>
      {/* Booking Form First */}
      <BookingForm />

      {/* SEO Content at Bottom */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Book Your Photography Session
        </h1>

        <p className="text-lg text-gray-600 leading-8 mb-6">
          Thank you for choosing Kutti Story Photography. We specialize in
          wedding photography, candid photography, cinematic wedding
          videography, pre-wedding shoots, engagement photography, maternity
          photography, baby shower photography, birthday events, and family
          portraits across Madurai and Tamil Nadu.
        </p>

        <p className="text-lg text-gray-600 leading-8 mb-6">
          Use the booking form below to reserve your preferred date. After
          receiving your enquiry, our team will contact you to discuss your
          event, photography requirements, location, package options, and
          pricing. We will help you choose the best package that suits your
          celebration and budget.
        </p>

        <p className="text-lg text-gray-600 leading-8">
          We recommend booking your wedding or event as early as possible to
          secure your preferred date. Our goal is to capture every special
          moment with creative storytelling, natural emotions, and timeless
          photographs that you and your family will cherish forever.
        </p>
      </section>
    </>
  );
}