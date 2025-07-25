from flask import Flask, request, render_template, jsonify, send_from_directory, abort
from flask_cors import CORS
from PIL import Image
import os

app = Flask(__name__)
CORS(app)  # This will enable CORS for all routes

UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'static/processed'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
if not os.path.exists(OUTPUT_FOLDER):
    os.makedirs(OUTPUT_FOLDER)

@app.route('/uploads/<path:filename>')
def serve_uploaded(filename):
    try:
        return send_from_directory(UPLOAD_FOLDER, filename)
    except FileNotFoundError:
        abort(404)

@app.route('/static/processed/<path:filename>')
def serve_processed(filename):
    try:
        return send_from_directory(OUTPUT_FOLDER, filename)
    except FileNotFoundError:
        abort(404)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'files[]' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    files = request.files.getlist('files[]')
    total_files = len(files)
    processed = 0
    previews = []

    for file in files:
        if file.filename == '':
            continue
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(filepath)
        try:
            img = Image.open(filepath)
            new_size = (800, 600)
            img_resized = img.resize(new_size, Image.Resampling.LANCZOS)
            output_path = os.path.join(app.config['OUTPUT_FOLDER'], f"resized_{file.filename}")
            img_resized.save(output_path)
            previews.append({
                'original': f'uploads/{file.filename}',
                'resized': f'static/processed/resized_{file.filename}',
                'name': file.filename,
                'size': f"{img.size[0]}x{img.size[1]} -> 800x600"
            })
            processed += 1
        except Exception as e:
            return jsonify({'error': f'Processing failed: {str(e)}'}), 500

    return jsonify({'progress': 100, 'message': 'Processing complete', 'previews': previews})

if __name__ == '__main__':
    app.run(debug=True)