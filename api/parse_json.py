#!/usr/bin/env python3
import json
import sys

data = json.load(sys.stdin)
print('Success:', data['success'])  
print('Total Cost:', data['total_cost_bgn'])  
print('Panels:', len(data['panels']))  
print('Type:', data['type'])
print('Cabinet ID:', data['cabinet_id'])