import pdfplumber
import os

def parse_pdf_words(pdf_path: str):
    """
    Extracts text and coordinate metadata for all words in the PDF.
    """
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"File not found: {pdf_path}")
        
    all_text = []
    all_words = []
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            pages_count = len(pdf.pages)
            for page_idx, page in enumerate(pdf.pages):
                page_num = page_idx + 1
                page_text = page.extract_text() or ""
                all_text.append(page_text)
                
                # Extract words with coordinates
                words = page.extract_words()
                for w in words:
                    all_words.append({
                        "text": w["text"],
                        "x0": float(w["x0"]),
                        "top": float(w["top"]),
                        "x1": float(w["x1"]),
                        "bottom": float(w["bottom"]),
                        "page_number": page_num
                    })
    except Exception as e:
        print(f"Error parsing PDF: {e}")
        return {"text": "", "words": [], "scanned": True, "pages": 0}
        
    full_text = "\n--- PAGE BREAK ---\n".join(all_text)
    scanned = len(full_text.strip()) < 100 or len(all_words) < 20
    
    return {
        "text": full_text,
        "words": all_words,
        "scanned": scanned,
        "pages": pages_count
    }
