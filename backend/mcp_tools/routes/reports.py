import os
import uuid
import pandas as pd
from fpdf import FPDF
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any

router = APIRouter(prefix="/api")

class ReportRequest(BaseModel):
    data: List[Dict[str, Any]]

@router.post("/generate-reports")
async def generate_reports(req: ReportRequest):
    data = req.data
    if not data:
        return {"error": "No data provided"}

    unique_id = str(uuid.uuid4())[:8]
    excel_path = f"/tmp/laporan_nasabah_{unique_id}.xlsx"
    pdf_path = f"/tmp/laporan_nasabah_{unique_id}.pdf"

    # 1. Generate Excel using Pandas
    df = pd.DataFrame(data)
    df.to_excel(excel_path, index=False)

    # 2. Generate PDF using FPDF
    class PDF(FPDF):
        def header(self):
            self.set_font("helvetica", "B", 12)
            self.cell(0, 10, "Laporan Data Nasabah (BulkBuddy)", align="C")
            self.ln(15)

    pdf = PDF(orientation="L", unit="mm", format="A4")
    pdf.add_page()
    
    columns = ["nama", "no_ktp", "kelamin", "tgl_lhr", "handphone", "produk", "kode_cabang"]
    col_widths = [45, 45, 15, 25, 35, 30, 25]
    
    # Table Header
    pdf.set_font("helvetica", "B", 8)
    for i, col in enumerate(columns):
        pdf.cell(col_widths[i], 8, str(col).upper(), border=1, align="C")
    pdf.ln()

    # Table Rows
    pdf.set_font("helvetica", "", 8)
    for row in data:
        for i, col in enumerate(columns):
            val = str(row.get(col, ""))[:25]
            pdf.cell(col_widths[i], 8, val, border=1)
        pdf.ln()

    pdf.output(pdf_path)

    return {
        "excel_path": excel_path,
        "pdf_path": pdf_path
    }
