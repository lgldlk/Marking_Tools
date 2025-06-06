import os
import translators as ts
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})


# 可用翻译服务
TRANSLATION_SERVICES = [
    "google",
    "bing",
    "baidu",
    "youdao",
    "tencent",
    "alibaba",
    "deepl",
]


def translate_text(text, service="google", source_lang="auto", target_lang="en"):
    if not text:
        return ""
    try:
        # Check if source and target languages are the same and not auto
        if source_lang != "auto" and source_lang == target_lang:
            raise ValueError("源语言和目标语言不能相同")
            
        translated_text = ts.translate_text(
            query_text=text, 
            translator=service.lower(), 
            from_language=source_lang,
            to_language=target_lang
        )
        return translated_text
    except Exception as e:
        print(f"Translation error with {service}: {e}")
        raise e


@app.route("/api/translate", methods=["POST"])
def translate():
    data = request.json
    text = data.get("text", "")
    source_lang = data.get("source_lang", "auto")
    target_lang = data.get("target_lang", "en")
    service = data.get("service", "google")

    if not text:
        return jsonify({"translatedText": ""}), 200

    # Check if source and target languages are the same and not auto
    if source_lang != "auto" and source_lang == target_lang:
        return jsonify({"error": "源语言和目标语言不能相同"}), 400

    try:
        translated_text = translate_text(text, service, source_lang, target_lang)
        return jsonify({"success": True, "translatedText": translated_text}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/services", methods=["GET"])
def get_services():
    return jsonify({"services": TRANSLATION_SERVICES}), 200


@app.route("/api/test-cors", methods=["GET"])
def test_cors():
    return jsonify({"message": "CORS is working correctly!"}), 200


if __name__ == "__main__":
    
    app.run(debug=True, host='0.0.0.0', port=5005)
   
