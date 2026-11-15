import json, sys, urllib.parse, urllib.request, collections
OUT = sys.argv[1]
OFF = "('ROBBERY','FELONY ASSAULT','ASSAULT 3 & RELATED OFFENSES','SEX CRIMES','RAPE','HARRASSMENT 2','OFFENSES AGAINST THE PERSON')"
WHERE = ("boro_nm='MANHATTAN' AND prem_typ_desc in ('STREET','PARK/PLAYGROUND') AND latitude IS NOT NULL "
         "AND latitude < 40.80 AND (ofns_desc in " + OFF + " OR pd_desc like '%FROM PERSON%') AND cmplnt_fr_dt >= '{a}' AND cmplnt_fr_dt < '{b}'")
SEL = "cmplnt_fr_dt,cmplnt_fr_tm,ofns_desc,pd_desc,prem_typ_desc,vic_sex,latitude,longitude"
rows = []
for ds, a, b in [("qgea-i56i", "2025-10-01", "2026-01-01"), ("5uac-w243", "2026-01-01", "2026-10-01")]:
    off = 0
    while True:
        q = urllib.parse.urlencode({"$select": SEL, "$where": WHERE.format(a=a, b=b), "$limit": 20000, "$offset": off, "$order": "cmplnt_fr_dt"})
        with urllib.request.urlopen(f"https://data.cityofnewyork.us/resource/{ds}.json?{q}", timeout=120) as r: part = json.load(r)
        rows += part; off += len(part); print(ds, off, flush=True)
        if len(part) < 20000: break
json.dump(rows, open(OUT, "w"))
print("total", len(rows))
c = collections.Counter(r.get("ofns_desc") for r in rows); print(c.most_common())
print(collections.Counter(r.get("vic_sex") for r in rows).most_common())
print("dates", min(r["cmplnt_fr_dt"] for r in rows)[:10], max(r["cmplnt_fr_dt"] for r in rows)[:10])
