import json
from deep_translator import GoogleTranslator
import time

def translate_batch(texts, target_lang):
    try:
        translator = GoogleTranslator(source='en', target=target_lang)
        # deep_translator translate_batch splits automatically, but we can do it manually just in case
        return translator.translate_batch(texts)
    except Exception as e:
        print(f"Error in batch: {e}")
        return texts

with open('src/locales/en.json', 'r', encoding='utf-8') as f:
    en_data = json.load(f)

# Flatten
flat_keys = {}
def flatten(d, prefix=''):
    for k, v in d.items():
        key = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            flatten(v, key)
        elif isinstance(v, list):
            for i, item in enumerate(v):
                if isinstance(item, dict):
                    flatten(item, f"{key}.{i}")
                else:
                    flat_keys[f"{key}.{i}"] = item
        else:
            flat_keys[key] = v

flatten(en_data)

keys = list(flat_keys.keys())
values = [str(flat_keys[k]) for k in keys]

print(f"Translating {len(values)} strings...")

def process(lang):
    translated_values = []
    chunk_size = 20
    for i in range(0, len(values), chunk_size):
        chunk = values[i:i+chunk_size]
        res = translate_batch(chunk, lang)
        translated_values.extend(res)
        time.sleep(1) # rate limit mitigation
    return translated_values

def unflatten(flat_dict):
    result = {}
    for k, v in flat_dict.items():
        parts = k.split('.')
        d = result
        for part in parts[:-1]:
            if part.isdigit():
                # not perfectly handling lists, but this project structure is known (items is a list of dicts)
                # actually, list handling is tricky to unflatten automatically if it's purely dot-notated without arrays.
                # let's just keep dicts
                pass
            if part not in d:
                d[part] = {}
            d = d[part]
        d[parts[-1]] = v
    return result

# Actually, to avoid unflatten complexities with lists, let's just modify the JSON structure in-place
bn_data = json.loads(json.dumps(en_data))
hi_data = json.loads(json.dumps(en_data))

def translate_inplace(data, lang):
    translator = GoogleTranslator(source='en', target=lang)
    def traverse(d):
        if isinstance(d, dict):
            for k, v in d.items():
                if isinstance(v, str):
                    try:
                        d[k] = translator.translate(v)
                        time.sleep(0.1)
                    except:
                        pass
                else:
                    traverse(v)
        elif isinstance(d, list):
            for i, v in enumerate(d):
                if isinstance(v, str):
                    try:
                        d[i] = translator.translate(v)
                        time.sleep(0.1)
                    except:
                        pass
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
