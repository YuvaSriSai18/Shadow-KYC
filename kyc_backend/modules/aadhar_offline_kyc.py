import zipfile
from pathlib import Path
import base64

import lxml.etree as ET
import xmlsec


# -----------------------------
# 1. Extract XML from ZIP
# -----------------------------
def extract_xml_from_zip(zip_path: str, share_code: str) -> bytes:
    """
    zip_path: path to offline eKYC ZIP downloaded from UIDAI
    share_code: 4+ char password user set while downloading
    returns: raw XML bytes
    """
    zip_path = Path(zip_path)

    if not zip_path.exists():
        raise FileNotFoundError(f"ZIP not found: {zip_path}")

    with zipfile.ZipFile(zip_path, "r") as zf:
        # ZIP is password-protected with share code
        zf.setpassword(share_code.encode("utf-8"))

        # There is typically a single XML file inside; pick first *.xml
        xml_names = [n for n in zf.namelist() if n.lower().endswith(".xml")]
        if not xml_names:
            raise ValueError("No XML file found inside ZIP")

        xml_name = xml_names[0]
        xml_bytes = zf.read(xml_name)

    return xml_bytes


# -----------------------------
# 2. Verify XML Digital Signature
# -----------------------------
def verify_xml_signature(xml_bytes: bytes, cert_pem_path: str) -> None:
    """
    Verifies XMLDSIG signature on OfflinePaperlessKyc XML using UIDAI public key.
    Raises if verification fails.
    """
    # Parse XML
    root = ET.fromstring(xml_bytes)

    # Prepare xmlsec keys manager with UIDAI public cert
    manager = xmlsec.KeysManager()
    key = xmlsec.Key.from_file(cert_pem_path, xmlsec.KeyFormat.PEM, None)
    manager.add_key(key)

    # Find Signature node (namespace aware)
    sign_node = xmlsec.tree.find_node(root, xmlsec.Node.SIGNATURE)
    if sign_node is None:
        raise ValueError("No <Signature> element found in XML")

    ctx = xmlsec.SignatureContext(manager)

    # Will raise xmlsec.VerificationError if invalid
    ctx.verify(sign_node)


# -----------------------------
# 3. Parse demographic data
# -----------------------------
def parse_offline_ekyc_xml(xml_bytes: bytes) -> dict:
    """
    Parses the OfflinePaperlessKyc XML into a clean dict.
    """
    root = ET.fromstring(xml_bytes)

    # Root: <OfflinePaperlessKyc referenceId="XXXX">
    ref_id = root.get("referenceId")

    # Children under <UidData>
    uid_data = root.find("UidData")
    if uid_data is None:
        raise ValueError("UidData element not found")

    poi = uid_data.find("Poi")  # name, dob, gender, email hash, mobile hash
    poa = uid_data.find("Poa")  # address fields
    pht = uid_data.find("Pht")  # base64 photo

    if poi is None or poa is None:
        raise ValueError("Poi/Poa elements missing in XML")

    # Poi attributes
    name = poi.get("name")
    dob = poi.get("dob") or poi.get("dobt")  # some versions use dobt
    gender = poi.get("gender")
    email_hash = poi.get("e")
    mobile_hash = poi.get("m")

    # Poa attributes (address)
    address = {
        "care_of": poa.get("careof"),
        "house": poa.get("house"),
        "street": poa.get("street"),
        "landmark": poa.get("loc"),
        "vtc": poa.get("vtc"),
        "subdist": poa.get("subdist"),
        "dist": poa.get("dist"),
        "state": poa.get("state"),
        "pincode": poa.get("pc"),
        "country": poa.get("country"),
        "po": poa.get("po"),
    }

    # Photo (base64 string inside <Pht>...</Pht>)
    photo_b64 = pht.text.strip() if pht is not None and pht.text else None

    return {
        "reference_id": ref_id,
        "name": name,
        "dob": dob,
        "gender": gender,
        "email_hash": email_hash,
        "mobile_hash": mobile_hash,
        "address": address,
        "photo_base64": photo_b64,
    }


# -----------------------------
# 4. High-level helper
# -----------------------------
def verify_offline_ekyc(
    zip_path: str,
    share_code: str,
    cert_pem_path: str = r"modules\certificates\uidai_offline_publickey.pem",
) -> dict:
    """
    Main function you will call from your app.

    Returns dict:
      {
        "valid": bool,
        "error": Optional[str],
        "data": Optional[dict]  # Only if valid == True
      }
    """
    try:
        xml_bytes = extract_xml_from_zip(zip_path, share_code)

        # Validate signature with UIDAI public key
        verify_xml_signature(xml_bytes, cert_pem_path)

        # Parse user data
        data = parse_offline_ekyc_xml(xml_bytes)

        # Optionally, save photo to file for debugging / demo
        if data.get("photo_base64"):
            img_bytes = base64.b64decode(data["photo_base64"])
            with open("aadhaar_photo_from_xml.jpg", "wb") as f:
                f.write(img_bytes)

        return {"valid": True, "error": None, "data": data}

    except Exception as e:
        return {"valid": False, "error": str(e), "data": None}


# -----------------------------
# 5. CLI entrypoint (for testing)
# -----------------------------
if __name__ == "__main__":
    zip_path = r"modules\offlineaadhaar20251127115703024.zip" #input("Path to Aadhaar offline eKYC ZIP: ").strip()
    share_code = input("Share code (ZIP password): ").strip()

    result = verify_offline_ekyc(zip_path, share_code)

    if not result["valid"]:
        print("\n❌ Verification FAILED:")
        print(result["error"])
    else:
        print("\n✅ Aadhaar Offline eKYC Verified Successfully!")
        print("Parsed Data:")
        from pprint import pprint

        pprint(result["data"])
        print("\nPhoto saved (if present) as aadhaar_photo_from_xml.jpg")
