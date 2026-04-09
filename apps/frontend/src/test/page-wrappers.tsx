import type { ReactNode } from "react";
import { PatientStoreProvider } from "@/lib/patient-store";

export function withPatientStore(children: ReactNode) {
  return <PatientStoreProvider>{children}</PatientStoreProvider>;
}
