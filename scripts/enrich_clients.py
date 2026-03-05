#!/usr/bin/env python3
import json
from datetime import datetime, timezone

with open('/tmp/dbdo-crm/public/data/clients.json', 'r') as f:
    d = json.load(f)

now = datetime.now(timezone.utc)

# Known DBDO client websites (best guesses from agency portfolio)
known_websites = {
    'Raffi': 'raffi.com',
    'GoldenEye Construction': 'goldeneyconstruction.com',
    'LL Paint': 'llpaint.com',
    'WePurchIt': 'wepurchit.com',
    'East Hills Instruments': 'easthillsinstruments.com',
    'RJ Industries': 'rjindustries.com',
    'Eyeglasses Forever': 'eyeglassesforever.com',
    'Luxury Golf and Cigar Experiences': 'luxurygolfandcigar.com',
    'Bodyologist': 'bodyologist.com',
    'Bit Bunker': 'bitbunker.com',
    'Evermore.org': 'evermore.org',
    'Lauri Strauss Leukemia Foundation': 'lauristraussfoundation.org',
    'Critical Path Advisors': 'criticalpathadvisors.com',
    'SquareHW': 'squarehw.com',
    'Karako': 'karakosuits.com',
    'Herra Jewelry': 'herrajewelry.com',
    'Vacuum America Clean': 'vacuumamericaclean.com',
    'Advantage All': 'advantageall.com',
    'Superior Uniform Rentals': 'superioruniformrentals.com',
    'Heera Jewelry': 'heerajewelry.com',
    'Shastone Memorial': 'shastonememorial.com',
    'Reliable Florida Contractors': 'reliablefloridacontractors.com',
    'Scheinman Neutrals': 'scheinmanneutrals.com',
    'Roslyn Chamber of Commerce': 'roslynchamber.org',
    'Royal Ice': 'royalice.com',
    'Compu Care': 'compucare.com',
    'Detail Renovations': 'detailrenovations.com',
    'Barbershop Connect': 'barbershopconnect.com',
    'Planning for the Unexpected': 'planningfortheunexpected.com',
    'Cigars In Paradise': 'cigarsinparadise.com',
    'Designs By Dave O': 'designsbydaveo.com',
}

for c in d:
    # Add website from known clients if empty
    if not c.get('website') and c['name'] in known_websites:
        c['website'] = known_websites[c['name']]
    
    # Add logo_url using Google favicon service
    if c.get('website'):
        c['logo_url'] = f"https://www.google.com/s2/favicons?domain={c['website']}&sz=64"
    else:
        c['logo_url'] = ''
    
    # Calculate days since last activity
    la = c.get('last_activity', '')
    if la:
        dt = datetime.fromisoformat(la.replace('Z', '+00:00'))
        days = (now - dt).days
        c['days_inactive'] = days
    else:
        c['days_inactive'] = 0

with open('/tmp/dbdo-crm/public/data/clients.json', 'w') as f:
    json.dump(d, f, indent=2)

print(f'Updated {len(d)} clients')
