"""
pdf_reader.py
─────────────
Reads every PDF in input_pdfs/ and dumps raw text to data/raw/<filename>.txt
"""

import os
import pdfplumber
from config import INPUT_DIR, RAW_DIR


def extract_text_from_pdf(pdf_path: str) -> str:
    """Return all text from a PDF as a single string."""
    pages = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                pages.append(text.strip())
    return "\n".join(pages)


def extract_all_pdfs() -> dict:
    """
    Extract text from every PDF in INPUT_DIR.
    Saves a .txt file to RAW_DIR for each PDF.
    Returns  { pdf_filename: raw_text }
    """
    os.makedirs(RAW_DIR, exist_ok=True)
    results = {}

    pdf_files = [f for f in os.listdir(INPUT_DIR) if f.lower().endswith(".pdf")]
    if not pdf_files:
        print(f"[pdf_reader] No PDFs found in {INPUT_DIR}")
        return results

    for filename in pdf_files:
        pdf_path = os.path.join(INPUT_DIR, filename)
        print(f"[pdf_reader] Extracting: {filename}")

        try:
            text = extract_text_from_pdf(pdf_path)
            results[filename] = text

            # Save raw dump for debugging
            raw_out = os.path.join(RAW_DIR, filename.replace(".pdf", ".txt"))
            with open(raw_out, "w", encoding="utf-8") as f:
                f.write(text)

            print(f"[pdf_reader] ✓ Saved raw text → {raw_out}")

        except Exception as e:
            print(f"[pdf_reader] ✗ Failed on {filename}: {e}")

    return results
