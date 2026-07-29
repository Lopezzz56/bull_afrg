import sys
import asyncio
sys.path.insert(0, '.')
from backend.app.services.extractor import extract_financial_data_async

# Ensure standard output can handle Unicode arrows
try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

print('Running extraction on ICICI Q2FY26.pdf...')
result = asyncio.run(extract_financial_data_async('ICICI Q2FY26.pdf'))

data = result['data']
cit = result['citations']
header = data.get('header', {})

print('--- EXTRACTED HEADER ---')
print('Company:', str(header.get('company_name', 'NOT FOUND')).encode('ascii', errors='replace').decode('ascii'))
print('Rating:', str(header.get('rating', 'NOT FOUND')).encode('ascii', errors='replace').decode('ascii'))
print('CMP:', str(header.get('cmp', 'NOT FOUND')).encode('ascii', errors='replace').decode('ascii'))
print('Target:', str(header.get('target_price', 'NOT FOUND')).encode('ascii', errors='replace').decode('ascii'))
print('Sector:', str(header.get('sector', 'NOT FOUND')).encode('ascii', errors='replace').decode('ascii'))
print('Citations resolved:', len(cit))

qtr = data.get('quarterly_financials', {})
print('Quarterly cols:', qtr.get('columns', []))
print('Quarterly rows:', len(qtr.get('rows', [])))

bullets = data.get('narrative_bullets', [])
print('Bullets:', [str(b).encode('ascii', errors='replace').decode('ascii') for b in bullets[:2]] if bullets else 'NONE')
