import base64
import zipfile
import lxml.etree as ET
import xmlsec


def extract_xml(zip_path, share_code):
    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.setpassword(share_code.encode())
        xml_file = [n for n in zf.namelist() if n.endswith(".xml")][0]
        return zf.read(xml_file)


def extract_embedded_certificate(root):
    cert_node = root.find(".//{http://www.w3.org/2000/09/xmldsig#}X509Certificate")
    if cert_node is None:
        raise ValueError("No embedded X509 certificate found in XML")

    cert_b64 = cert_node.text.strip()
    pem = "-----BEGIN CERTIFICATE-----\n"
    pem += "\n".join(cert_b64[i:i+64] for i in range(0, len(cert_b64), 64))
    pem += "\n-----END CERTIFICATE-----\n"

    with open("embedded_uidai_cert.pem", "w") as f:
        f.write(pem)

    return "embedded_uidai_cert.pem"


def verify_signature(xml_bytes, cert_path):
    root = ET.fromstring(xml_bytes)

    # Load certificate
    key = xmlsec.Key.from_file(cert_path, xmlsec.KeyFormat.PEM, None)

    # Key manager
    manager = xmlsec.KeysManager()
    manager.add_key(key)

    # Signature node
    sign_node = xmlsec.tree.find_node(root, xmlsec.Node.SIGNATURE)
    if sign_node is None:
        raise ValueError("Signature node missing")

    ctx = xmlsec.SignatureContext(manager)
    ctx.verify(sign_node)  # Raises error if invalid

    return True


if __name__ == "__main__":
    zip_path = r"modules\offlineaadhaar20251127082221860.zip"
    share_code = input("Enter Aadhaar share code: ")

    xml_bytes = extract_xml(zip_path, share_code)
    root = ET.fromstring(xml_bytes)

    # Extract certificate from XML
    cert_path = extract_embedded_certificate(root)

    # Verify signature
    try:
        verify_signature(xml_bytes, cert_path)
        print("✅ Signature VALID — XML is genuine from UIDAI")
    except Exception as e:
        print("❌ Signature INVALID:", e)
