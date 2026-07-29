from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class BoundingBox(BaseModel):
    x0: float
    top: float
    x1: float
    bottom: float
    page_number: int
class HeaderData(BaseModel):
    company_name: str = "-"
    sector: Optional[str] = "-"
    report_date: Optional[str] = "-"
    target_change_arrow: Optional[str] = "▬"
    rating_change_arrow: Optional[str] = "▬"
    earnings_change_arrow: Optional[str] = "▬"
    target_price: Optional[str] = "-"
    cmp: Optional[str] = "-"
    return_pct: Optional[str] = "-"
    stock_type: Optional[str] = "-"
    bloomberg_code: Optional[str] = "-"
    sensex: Optional[str] = "-"
    nse_code: Optional[str] = "-"
    bse_code: Optional[str] = "-"
    time_frame: Optional[str] = "-"
    rating: Optional[str] = "HOLD"

class CompanyDataItem(BaseModel):
    label: str = "-"
    value: Optional[str] = "-"

class ShareholdingData(BaseModel):
    periods: List[str] = []
    rows: List[Dict[str, Any]] = [] # list of {label: str, values: [float/str/none]}

class PricePerformanceItem(BaseModel):
    label: str = "-"
    m3: Optional[str] = "-"
    m6: Optional[str] = "-"
    y1: Optional[str] = "-"

class YeMarchSummaryRow(BaseModel):
    label: str = "-"
    values: List[Optional[str]] = []
    italic: bool = False

class YeMarchSummary(BaseModel):
    years: List[str] = []
    rows: List[YeMarchSummaryRow] = []

class QuarterlyFinancialsRow(BaseModel):
    label: str = "-"
    values: List[Optional[str]] = []
    italic: bool = False

class QuarterlyFinancials(BaseModel):
    columns: List[str] = []
    rows: List[QuarterlyFinancialsRow] = []

class ChangeInEstimatesRow(BaseModel):
    label: str = "-"
    old: List[Optional[str]] = []
    new: List[Optional[str]] = []
    change: List[Optional[str]] = []

class ChangeInEstimates(BaseModel):
    years: List[str] = []
    rows: List[ChangeInEstimatesRow] = []

class FinRow(BaseModel):
    label: str = "-"
    values: List[Optional[str]] = []
    bold: bool = False
    italic: bool = False

class FinTable(BaseModel):
    years: List[str] = []
    rows: List[FinRow] = []

class RatioRow(BaseModel):
    label: str = "-"
    values: List[Optional[str]] = []
    section_head: bool = False
    bold: bool = False
    italic: bool = False

class RatioTable(BaseModel):
    years: List[str] = []
    rows: List[RatioRow] = []

class RecommendationHistoryRow(BaseModel):
    date: str = "-"
    rating: str = "-"
    target: Optional[str] = "-"

class RatingCriteriaRow(BaseModel):
    rating: str = "-"
    large_caps: str = "-"
    midcaps: str = "-"
    small_caps: str = "-"

class DisclosureData(BaseModel):
    analyst_name: Optional[str] = "-"
    paragraphs: List[str] = []
    registered_office: Optional[str] = ""
    cin: Optional[str] = "-"
    sebi_reg_no: Optional[str] = "-"
    dp_id: Optional[str] = "-"

class ChartUrls(BaseModel):
    price_performance_url: Optional[str] = ""
    revenue_url: Optional[str] = ""
    gov_url: Optional[str] = ""
    ebitda_url: Optional[str] = ""
    pat_url: Optional[str] = ""
    recommendation_summary_url: Optional[str] = ""

class ReportData(BaseModel):
    header: HeaderData = HeaderData()
    company_data: List[CompanyDataItem] = []
    shareholding: ShareholdingData = ShareholdingData()
    price_performance: List[PricePerformanceItem] = []
    ye_march_summary: YeMarchSummary = YeMarchSummary()
    narrative_headline: Optional[str] = ""
    company_description: Optional[str] = ""
    narrative_bullets: List[str] = []
    outlook_valuation: Optional[str] = ""
    quarterly_financials: QuarterlyFinancials = QuarterlyFinancials()
    key_highlights: List[str] = []
    change_in_estimates: ChangeInEstimates = ChangeInEstimates()
    pnl: FinTable = FinTable()
    balance_sheet: FinTable = FinTable()
    cashflow: FinTable = FinTable()
    ratios: RatioTable = RatioTable()
    recommendation_history: List[RecommendationHistoryRow] = []
    rating_criteria: List[RatingCriteriaRow] = []
    disclosure: DisclosureData = DisclosureData()
    charts: ChartUrls = ChartUrls()

class ExtractionResponse(BaseModel):
    data: ReportData
    citations: Dict[str, BoundingBox] = {}
    validation_flags: Dict[str, str] = {} # maps field path -> error warning message
