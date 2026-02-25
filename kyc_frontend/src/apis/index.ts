import axios from "axios";

interface FileData {
  zip_url: string;
  share_code: string;
}
interface aadharDetails {
  name: string;
  dob: string;
  gender: string;
  address: {
    house: string;
    street: string;
    vtc: string;
    dist: string;
    state: string;
    pincode: string;
  };
  photo_base64: string;
  success: boolean;
  message: string;
}
interface FacesData {
  passport_image_base64: string;
  aadhaar_image_base64: string;
  live_image_base64: string;
}
interface FaceDataResult {
  passport_live_match_percent: Number;
  aadhaar_live_match_percent: Number;
  passport_aadhaar_match_percent: Number;
  threshold_percent: Number;
  verified: boolean;
  success: boolean;
  message: string;
}
const API = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URI,
});

export const getAadharDetails = async (
  fileData: FileData
): Promise<aadharDetails> => {
  const response = await API.post("/extract-aadhaar-from-url", fileData);
  return response.data as aadharDetails;
};

export const verifyFaces = async (faces: FacesData) => {
  const res = await API.post("/multi-face-match", faces);
  return res.data as FaceDataResult;
};
