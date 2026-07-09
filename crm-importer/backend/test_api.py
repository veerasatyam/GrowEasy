import requests
import json

csv_content = """First Name,Last Name,Email,Phone,Company,Lead Source,Status,Address,City,State,Zip Code,Country,Notes,Lead Date,Annual Revenue,Industry,Job Title,Website,Facebook ID,Google Ads ID,Property Address,Property City,Property State,Property Zip,Sales Rep,Lead Score,Campaign Name,Lead Type,Budget,Employees,Last Contact,Next Follow-up,Priority
John,Doe,john.doe@email.com,+1-555-123-4567,TechCorp Solutions,Facebook Ad,Qualified,123 Main St,New York,NY,10001,USA,Interested in enterprise plan,2026-01-15,500000,Technology,CTO,https://techcorp.com,fb_lead_12345,ga_56789,456 Oak Ave,Brooklyn,NY,11201,Sarah Johnson,85,Summer Campaign,Enterprise,1000000,250,2026-01-20,2026-01-25,High
Jane,Smith,janesmith@email.com,(555) 987-6543,Creative Agency,Google Ads,New,789 Pine Rd,Los Angeles,CA,90001,USA,Needs marketing consultation,2026-01-16,250000,Marketing,Marketing Director,https://creativeagency.co,fb_lead_67890,ga_12345,123 Sunset Blvd,Los Angeles,CA,90028,Mike Wilson,72,Spring Campaign,SMB,500000,50,2026-01-18,2026-01-28,Medium
Robert,Johnson,robert.j@email.com,555.555.0199,Real Estate Group,Website,Converted,456 Elm St,Chicago,IL,60601,USA,Looking for commercial property,2026-01-14,1000000,Real Estate,CEO,https://realestategroup.com,fb_lead_34567,ga_98765,789 Lake Shore Dr,Chicago,IL,60611,Emily Brown,95,Winter Campaign,Enterprise,2000000,100,2026-01-19,2026-01-22,High
Maria,Garcia,,555-555-0234,Marketing Pros,Referral,In Progress,789 Oak Ave,Houston,TX,77001,USA,Interested in automation,2026-01-17,750000,Marketing,Agency Owner,https://marketingpros.com,fb_lead_23456,ga_54321,321 River Rd,Houston,TX,77002,Chris Davis,68,Fall Campaign,SMB,750000,30,2026-01-21,2026-01-30,Medium
NoContactLead,LastName,,,,,,,,,,,,,,,,,,,,,,,,,,,,,
"""

url = "http://localhost:8080/api/import"
files = {'file': ('leads.csv', csv_content, 'text/csv')}

try:
    print("Sending POST request to Express backend...")
    res = requests.post(url, files=files)
    print("Response Status:", res.status_code)
    
    if res.status_code == 200:
        data = res.json()
        print("\n[OK] Verification Successful! Output Summary:")
        print(f"  Total Imported: {data['totalImported']}")
        print(f"  Total Skipped: {data['totalSkipped']}")
        
        print("\n--- Standardized Imported Leads ---")
        for i, lead in enumerate(data['imported']):
            print(f"Lead #{i+1}:")
            print(f"  Name: {lead['name']}")
            print(f"  Email: {lead['email']}")
            print(f"  Contact: {lead['country_code']} {lead['mobile_without_country_code']}")
            print(f"  Created At: {lead['created_at']}")
            print(f"  Company: {lead['company']}")
            print(f"  Status: {lead['crm_status']}")
            print(f"  Data Source: {lead['data_source']}")
            print(f"  CRM Note: {lead['crm_note']}")
            
        print("\n--- Skipped Leads ---")
        for i, skip in enumerate(data['skipped']):
            print(f"Skipped #{i+1}:")
            print(f"  Name: {skip['name']}")
            print(f"  Reason: {skip['reason']}")
            
    else:
        print("[Error] Server returned error:", res.text)
        
except Exception as e:
    print("[Error] Script request failed:", e)
