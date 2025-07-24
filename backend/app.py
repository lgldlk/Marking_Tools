import os
import translators as ts
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import tempfile
import shutil
import zipfile
import base64
import json
import sys
import traceback
import io
from openai import OpenAI
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Create temporary directory for uploads
UPLOAD_FOLDER = os.path.join(tempfile.gettempdir(), 'kontext_uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
# 增加最大内容长度限制到100MB
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB

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


def detect_image_format(base64_data):
    """
    根据base64图片数据检测图片格式
    返回格式: png, jpeg, gif, webp等
    """
    # 解码base64数据的前几个字节来检测格式
    try:
        # 获取图片二进制数据
        image_data = base64.b64decode(base64_data)
        
        # 检查文件头部特征
        if image_data.startswith(b'\x89PNG\r\n\x1a\n'):
            return 'png'
        elif image_data.startswith(b'\xff\xd8\xff'):
            return 'jpeg'  # JPEG格式
        elif image_data.startswith(b'GIF87a') or image_data.startswith(b'GIF89a'):
            return 'gif'
        elif image_data.startswith(b'RIFF') and image_data[8:12] == b'WEBP':
            return 'webp'
        elif image_data.startswith(b'BM'):
            return 'bmp'
        else:
            # 默认返回png
            return 'png'
    except Exception as e:
        print(f"Error detecting image format: {str(e)}")
        return 'png'  # 出错时默认为png


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


# New endpoints for Kontext image labeling
@app.route("/api/kontext/label", methods=["POST"])
def label_kontext_images():
    session_dir = None
    try:
        # Get OpenAI API key and base URL from request
        api_key = request.form.get("api_key")
        base_url = request.form.get("base_url", "https://api.openai.com/v1")
        system_prompt = request.form.get("system_prompt", "You are a helpful assistant that describes the difference between two images.")
        model = request.form.get("model", "gpt-4-vision-preview")
        
        print(f"Received request with model: {model}, base_url: {base_url}")
        
        if not api_key:
            return jsonify({"error": "API key is required"}), 400
        
        # Create a unique session directory
        session_dir = os.path.join(app.config['UPLOAD_FOLDER'], f"session_{os.urandom(8).hex()}")
        os.makedirs(session_dir, exist_ok=True)
        
        # Process uploaded files
        files = request.files.getlist("images")
        if len(files) == 0:
            return jsonify({"error": "No files uploaded"}), 400
        
        # Group files by base name
        file_groups = {}
        for file in files:
            if file.filename == '':
                continue
                
            filename = secure_filename(file.filename)
            base_name = filename.rsplit('_', 1)[0]
            suffix = filename.rsplit('_', 1)[1].split('.')[0]
            
            if base_name not in file_groups:
                file_groups[base_name] = {}
                
            # Save the file
            file_path = os.path.join(session_dir, filename)
            file.save(file_path)
            file_groups[base_name][suffix] = file_path
        
        # Check if we have proper pairs
        valid_pairs = {}
        for base_name, files in file_groups.items():
            if 'R' in files and 'T' in files:
                valid_pairs[base_name] = {
                    'R': files['R'],
                    'T': files['T']
                }
        
        if not valid_pairs:
            return jsonify({"error": "No valid image pairs found. Please upload pairs of images with _R and _T suffixes."}), 400
        
        # Initialize OpenAI client
        try:
            # 仅使用必要的参数初始化OpenAI客户端
            # 移除所有环境变量中可能的代理设置
            env_vars_to_remove = ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy', 'NO_PROXY', 'no_proxy']
            original_env = {}
            for var in env_vars_to_remove:
                if var in os.environ:
                    original_env[var] = os.environ[var]
                    del os.environ[var]
            
            client = OpenAI(api_key=api_key,base_url=base_url)
            

            # 恢复原始环境变量
            for var, value in original_env.items():
                os.environ[var] = value
                
        except Exception as e:
            print(f"Error initializing OpenAI client: {str(e)}")
            traceback.print_exc(file=sys.stdout)
            return jsonify({"error": f"Failed to initialize OpenAI client: {str(e)}"}), 500
        
        # Process each pair with OpenAI
        results = []
        for base_name, paths in valid_pairs.items():
            try:
                # Encode images to base64
                with open(paths['R'], 'rb') as img_file:
                    img_r_data = base64.b64encode(img_file.read()).decode('utf-8')
                    # 获取R图片的格式
                    img_r_format = detect_image_format(img_r_data)
                
                with open(paths['T'], 'rb') as img_file:
                    img_t_data = base64.b64encode(img_file.read()).decode('utf-8')
                    # 获取T图片的格式
                    img_t_format = detect_image_format(img_t_data)
                print(img_r_format,img_t_format)
                # Call OpenAI API
                try:
                    response = client.chat.completions.create(
                        model=model,
                        messages=[
                            {
                                "role": "system",
                                "content": system_prompt
                            },
                            {
                                "role": "user",
                                "content": [
                                    {
                                        "type": "image_url",
                                        "image_url": {
                                            "url": f"data:image/{img_r_format};base64,{img_r_data}"
                                        }
                                    },
                                    {
                                        "type": "image_url",
                                        "image_url": {"url":f"data:image/{img_t_format};base64,{img_t_data}"}
                                    }
                                ]
                            }
                        ],
                        max_tokens=300
                    )
                    
                    # Extract the response text
                    description = response.choices[0].message.content
                except Exception as api_error:
                    print(f"API call error for {base_name}: {str(api_error)}")
                    traceback.print_exc(file=sys.stdout)
                    description = f"Error processing images: {str(api_error)}"
                
                # Save description to a text file
                txt_filename = f"{base_name}_T.txt"
                txt_path = os.path.join(session_dir, txt_filename)
                with open(txt_path, 'w') as txt_file:
                    txt_file.write(description)
                
                # 为结果添加图片数据
                r_preview = img_r_data
                t_preview = img_t_data
                
                # 不再限制图片大小，传输完整图片数据
                
                results.append({
                    "base_name": base_name,
                    "description": description,
                    "r_image": {
                        "name": os.path.basename(paths['R']),
                        "format": img_r_format,
                        "preview": r_preview  # 完整图片数据
                    },
                    "t_image": {
                        "name": os.path.basename(paths['T']),
                        "format": img_t_format,
                        "preview": t_preview  # 完整图片数据
                    }
                })
                
            except Exception as e:
                print(f"Error processing {base_name}: {str(e)}")
                traceback.print_exc(file=sys.stdout)
                results.append({
                    "base_name": base_name,
                    "error": str(e)
                })
        
        # 创建一个zip文件作为备份，但不直接返回
        zip_path = os.path.join(session_dir, "kontext_results.zip")
        with zipfile.ZipFile(zip_path, 'w') as zipf:
            for base_name in valid_pairs.keys():
                txt_file = os.path.join(session_dir, f"{base_name}_T.txt")
                if os.path.exists(txt_file):
                    zipf.write(txt_file, os.path.basename(txt_file))
        
        # 返回JSON结果
        return jsonify({
            "success": True,
            "results": results
        }), 200
        
    except Exception as e:
        print(f"Error in label_kontext_images: {str(e)}")
        traceback.print_exc(file=sys.stdout)
        return jsonify({"error": str(e)}), 500
    finally:
        # Clean up session directory after a delay
        # In a production environment, you might want to use a background task for this
        try:
            if session_dir and os.path.exists(session_dir):
                shutil.rmtree(session_dir)
        except Exception as e:
            print(f"Error cleaning up: {str(e)}")


if __name__ == "__main__":
    
    app.run(debug=True, host='0.0.0.0', port=5005)
   
