const fs = require('fs');
const https = require('https');

async function translateText(text, targetLang) {
    if (!text || typeof text !== 'string') return text;
    
    // Remove [BN] or [HI] if they were added previously
    text = text.replace(/ \[(BN|HI)\]$/, '');

    return new Promise((resolve) => {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    // Google returns [[["Translation", "Original", null, null, 1]], null, "en", null, null, null, 1, null, [["en"], null, [1], ["en"]]]
                    if (parsed && parsed[0] && parsed[0][0] && parsed[0][0][0]) {
                        resolve(parsed[0].map(x => x[0]).join(''));
                    } else {
                        resolve(text);
                    }
                } catch (e) {
                    resolve(text);
                }
            });
        }).on('error', () => {
            resolve(text);
        });
    });
}

async function processTranslations() {
    console.log("Reading en.json...");
    const enData = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));

    async function traverseAndTranslate(obj, targetLang) {
        const result = Array.isArray(obj) ? [] : {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                result[key] = await translateText(value, targetLang);
                // Sleep 200ms
                await new Promise(r => setTimeout(r, 200));
            } else if (typeof value === 'object' && value !== null) {
                result[key] = await traverseAndTranslate(value, targetLang);
            } else {
                result[key] = value;
            }
        }
        return result;
    }

    console.log("Translating to Bengali (BN)...");
    const bnData = await traverseAndTranslate(enData, 'bn');
    fs.writeFileSync('src/locales/bn.json', JSON.stringify(bnData, null, 2), 'utf8');
    console.log("Saved bn.json");

    console.log("Translating to Hindi (HI)...");
    const hiData = await traverseAndTranslate(enData, 'hi');
    fs.writeFileSync('src/locales/hi.json', JSON.stringify(hiData, null, 2), 'utf8');
    console.log("Saved hi.json");

    console.log("All done!");
}

processTranslations().catch(console.error);
