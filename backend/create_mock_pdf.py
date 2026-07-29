import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

def create_mock_pdf(filename="ICICI Q2FY26.pdf"):
    c = canvas.Canvas(filename, pagesize=letter)
    width, height = letter
    
    # PAGE 1
    c.setFont("Helvetica-Bold", 18)
    c.drawString(50, height - 50, "Geojit Financial Services Ltd")
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 70, "Sector: Financial Services | Date: 24 July 2026")
    
    c.drawString(50, height - 100, "CMP: 125")
    c.drawString(150, height - 100, "Target Price: 145")
    c.drawString(250, height - 100, "Rating: BUY")
    
    c.drawString(50, height - 130, "Mkt Cap (cr): 2,980")
    c.drawString(50, height - 150, "NSE Code: GEOJIT")
    c.drawString(50, height - 170, "BSE Code: 532285")
    
    # Description
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 210, "Business Description:")
    c.setFont("Helvetica", 9)
    desc = "Geojit Financial Services Ltd is a premier financial services company in India with a strong footprint in retail brokerage, wealth management, and distribution of financial products."
    c.drawString(50, height - 230, desc)
    
    # Financial metrics
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 270, "Quarterly Financials Consolidated:")
    
    # Table headers
    c.setFont("Helvetica-Bold", 10)
    c.drawString(50, height - 290, "Rs.cr")
    c.drawString(150, height - 290, "Q2FY26")
    c.drawString(220, height - 290, "Q1FY26")
    c.drawString(290, height - 290, "Q2FY25")
    c.drawString(360, height - 290, "YoY (%)")
    c.drawString(430, height - 290, "QoQ (%)")
    
    # Table rows
    c.setFont("Helvetica", 9)
    # Revenue row
    c.drawString(50, height - 310, "Revenue")
    c.drawString(150, height - 310, "182.4")
    c.drawString(220, height - 310, "175.2")
    c.drawString(290, height - 310, "150.8")
    c.drawString(360, height - 310, "21.0")
    c.drawString(430, height - 310, "4.1")
    
    # EBITDA row
    c.drawString(50, height - 330, "EBITDA")
    c.drawString(150, height - 330, "55.8")
    c.drawString(220, height - 330, "52.4")
    c.drawString(290, height - 330, "43.2")
    c.drawString(360, height - 330, "29.2")
    c.drawString(430, height - 330, "6.5")
    
    # PAT row
    c.drawString(50, height - 350, "PAT")
    c.drawString(150, height - 350, "38.5")
    c.drawString(220, height - 350, "35.2")
    c.drawString(290, height - 350, "29.4")
    c.drawString(360, height - 350, "31.0")
    c.drawString(430, height - 350, "9.4")
    
    c.showPage()
    
    # PAGE 2
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, height - 50, "Key Highlights")
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 80, "- Active client base crossed the 1.4 million milestone in Q2FY26.")
    c.drawString(50, height - 100, "- Successfully launched its advanced trading platform.")
    c.drawString(50, height - 120, "- Strong balance sheet with zero debt and robust cash reserves.")
    
    c.showPage()
    c.save()
    print(f"Mock PDF created successfully: {filename}")

if __name__ == "__main__":
    create_mock_pdf()
