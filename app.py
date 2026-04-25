from flask import Flask, render_template, request, send_file, jsonify
import pandas as pd
import io
import uuid

app = Flask(__name__)
temp_storage = {}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    file = request.files['file']
    df = pd.read_excel(file)

    # 엑셀 컬럼 그대로 사용
    data = df.to_dict(orient='records')
    return jsonify(data)

@app.route('/save', methods=['POST'])
def save():
    data = request.json
    df = pd.DataFrame(data)

    output = io.BytesIO()
    df.to_excel(output, index=False)
    output.seek(0)

    file_id = str(uuid.uuid4())
    temp_storage[file_id] = output

    return jsonify({
        "download_url": f"/download/{file_id}"
    })

@app.route('/download/<file_id>')
def download(file_id):
    file = temp_storage.get(file_id)

    if not file:
        return "파일 없음", 404

    return send_file(file,
                     download_name="inventory.xlsx",
                     as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)
