import zipfile
import base64
from pathlib import Path
import lxml.etree as ET


def extract_aadhaar_xml(zip_path: str, share_code: str):
    """Extract XML from Offline Aadhaar ZIP using share code."""
    zip_path = Path(zip_path)

    if not zip_path.exists():
        raise FileNotFoundError("ZIP file not found")

    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.setpassword(share_code.encode("utf-8"))

        # Find XML file
        xml_files = [name for name in zf.namelist() if name.endswith(".xml")]
        if not xml_files:
            raise ValueError("No XML file found inside ZIP")

        xml_name = xml_files[0]
        xml_content = zf.read(xml_name)

    return xml_content


def parse_aadhaar_xml(xml_bytes: bytes):
    """Parse Name, DOB, Gender, Address + Photo from Aadhaar XML."""
    root = ET.fromstring(xml_bytes)

    uid_data = root.find("UidData")
    poi = uid_data.find("Poi")
    poa = uid_data.find("Poa")
    pht = uid_data.find("Pht")

    data = {
        "name": poi.get("name"),
        "dob": poi.get("dob") or poi.get("dobt"),
        "gender": poi.get("gender"),
        "address": {
            "house": poa.get("house"),
            "street": poa.get("street"),
            "vtc": poa.get("vtc"),
            "dist": poa.get("dist"),
            "state": poa.get("state"),
            "pincode": poa.get("pc")
        },
        "photo_base64": pht.text.strip()
    }

    return data


def save_photo(photo_b64: str, out_path="aadhaar_photo.jpg"):
    """Decode base64 photo and save as JPG."""
    img_bytes = base64.b64decode(photo_b64)
    with open(out_path, "wb") as f:
        f.write(img_bytes)
    return out_path


if __name__ == "__main__":
    zip_path = r"modules\offlineaadhaar20251127082221860.zip" #"offlineaadhaar.zip"     # Your ZIP file
    share_code = input("Enter Aadhaar share code: ")

    # Extract XML
    xml_bytes = extract_aadhaar_xml(zip_path, share_code)

    # Parse Data
    data = parse_aadhaar_xml(xml_bytes)

    print("\n✔ Aadhaar XML Parsed Successfully!\n")
    print("Name:", data["name"])
    print("DOB:", data["dob"])
    print("Gender:", data["gender"])
    print("Address:", data["address"])

    # Save Photo
    photo_file = save_photo(data["photo_base64"])
    print("\n✔ Photo saved as:", photo_file)
