import axios from "axios";

// Configure axios instance for backend API
// Update this URL to match your backend server
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  timeout: 60000, // 60 seconds for file uploads
  headers: {
    "Content-Type": "multipart/form-data",
  },
});

// Payment Matcher API
export interface PaymentMatcherParams {
  ledger_type: "single" | "multi";
  delay_threshold: number;
  gst_rate: number;
}

export interface PaymentMatcherResponse {
  data: Blob;
  headers: {
    "content-disposition"?: string;
  };
}

/**
 * Process a file with the Payment Matcher backend
 * @param file - The Excel file to process
 * @param params - Configuration parameters
 * @returns Promise with file URL and filename for download
 */
export const processPaymentMatcher = async (
  file: File,
  params: PaymentMatcherParams
): Promise<{ fileUrl: string; fileName: string }> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("ledger_type", params.ledger_type);
  formData.append("delay_threshold", params.delay_threshold.toString());
  formData.append("gst_rate", params.gst_rate.toString());

  try {
    const response = await axios.post("/api/payment-matcher", formData, {
  responseType: "blob",
});

    // Create a URL for the downloaded file
    const fileUrl = window.URL.createObjectURL(new Blob([response.data]));

    // Extract filename from content-disposition or use default
    const contentDisposition = response.headers["content-disposition"];
    let fileName = "MatchedFIFO.xlsx";

    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (fileNameMatch && fileNameMatch[1]) {
        fileName = fileNameMatch[1];
      }
    }

    return { fileUrl, fileName };
  } catch (error) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    // Error response comes back as Blob because responseType = "blob"
    if (data instanceof Blob) {
      try {
        const text = await data.text();
        const parsed = JSON.parse(text);

        throw new Error(
          parsed.detail || parsed.message || "Failed to process file"
        );
      } catch (parseError) {
        if (parseError instanceof Error &&
            parseError.message !== "Failed to process file") {
          throw parseError;
        }
      }
    }

    throw new Error(
      data?.detail ||
      data?.message ||
      error.message ||
      "Failed to process file"
    );
  }

  throw new Error("Failed to process file");
}
};

/**
 * Check if backend is running
 */
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await apiClient.get("/");
    return response.status === 200;
  } catch {
    return false;
  }
};

/**
 * Get backend status and version
 */
export const getBackendStatus = async (): Promise<{ status: string; application: string }> => {
  try {
    const response = await apiClient.get("/");
    return response.data;
  } catch (error) {
    throw new Error("Backend is not responding");
  }
};

export default apiClient;
