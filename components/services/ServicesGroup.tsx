"use client";

import PhotographyServiceSection from "./PhotographyServiceSection";
import PhotographyShowcase from "./PhotographyShowcase";
import ServiceCardGrid from "./ServiceCardGrid";

export default function ServicesGroup() {
  return (
    <>
      <PhotographyServiceSection />
      <PhotographyShowcase />
      <ServiceCardGrid />
    </>
  );
}
