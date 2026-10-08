import json
from deep_translator import GoogleTranslator
import time
import random

with open('src/locales/en.json', 'r', encoding='utf-8') as f:
    en_data = json.load(f)

bn_data = json.loads(json.dumps(en_data))
hi_data = json.loads(json.dumps(en_data))

def translate_inplace(data, lang):
    translator = GoogleTranslator(source='en', target=lang)
    def traverse(d):
        if isinstance(d, dict):
            for k, v in d.items():
                if isinstance(v, str):
                    success = False
                    retries = 3
                    while not success and retries > 0:
                        try:
                            res = translator.translate(v)
                            if res:
                                d[k] = res
                            success = True
                            time.sleep(1 + random.random())
                        except Exception as e:
                            print(f"Error for '{v}': {e}, retrying...")
                            retries -= 1
                            time.sleep(3 + random.random())
                else:
                    traverse(v)
        elif isinstance(d, list):
            for i, v in enumerate(d):
                if isinstance(v, str):
                    success = False
                    retries = 3
                    while not success and retries > 0:
                        try:
                            res = translator.translate(v)
                            if res:
                                d[i] = res
                            success = True
                            time.sleep(1 + random.random())
                        except Exception as e:
                            print(f"Error for '{v}': {e}, retrying...")
                            retries -= 1
                            time.sleep(3 + random.random())
                else:
                    traverse(v)
    traverse(data)
    return data

print("Translating BN...")
translate_inplace(bn_data, 'bn')
with open('src/locales/bn.json', 'w', encoding='utf-8') as f:
    json.dump(bn_data, f, ensure_ascii=False, indent=2)

print("Translating HI...")
translate_inplace(hi_data, 'hi')
with open('src/locales/hi.json', 'w', encoding='utf-8') as f:
    json.dump(hi_data, f, ensure_ascii=False, indent=2)

print("Done")
