export const demoCertificates: Record<
  string,
  {
    certificateId: string;
    charityName: string;
    status: "active" | "expired" | "revoked";
    issueDate: string;
    expiryDate: string;
    certificationYear: number;
  }
> = {
  "YIF-2025-001": {
    certificateId: "YIF-2025-001",
    charityName: "Hope Relief International",
    status: "active",
    issueDate: "2025-11-01",
    expiryDate: "2026-11-01",
    certificationYear: 2025,
  },
  "YIF-2025-042": {
    certificateId: "YIF-2025-042",
    charityName: "Water for Life Foundation",
    status: "active",
    issueDate: "2025-08-20",
    expiryDate: "2026-08-20",
    certificationYear: 2025,
  },
};

export const getCertificate = (id: string) => demoCertificates[id.toUpperCase()] ?? demoCertificates[id];
