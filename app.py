from flask import Flask, render_template, request, send_file, jsonify, session, redirect
import pandas as pd
import io
import uuid
import re

app = Flask(__name__)
app.secret_key = "secret_key_123"

temp_storage = {}

def natural_sort_key(s):
    return [int(text) if text.isdigit() else text
            for text in re.split('([0-9]+)', str(s))]

@app.route('/login')
def login_page():
    return render_template('login.html')

@app.route('/login', methods=['POST'])
def login():
    user_id = request.form.get('id')
    pw = request.form.get('pw')

    if user_id == "김경민" and pw == "ourbox":
        session['login'] = True
        return redirect('/')
    else:
        return "로그인 실패"

@app.route('/')
def index():
    if not session.get('login'):
        return redirect('/login')
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    if not session.get('login'):
        return "Unauthorized", 401

    file = request.files['file']
    df = pd.read_excel(file)

    if "소비기한" in df.columns:
        df["소비기한"] = pd.to_datetime(df["소비기한"], errors='coerce') \
            .dt.strftime('%Y-%m-%d')

    if "로케이션" in df.columns:
        df = df.sort_values(
            by="로케이션",
            key=lambda col: col.map(natural_sort_key)
        )

    data = df.to_dict(orient='records')
    return jsonify(data)

@app.route('/save', methods=['POST'])
def save():
    if not session.get('login'):
        return "Unauthorized", 401

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
    if not session.get('login'):
        return "Unauthorized", 401

    file = temp_storage.get(file_id)
    if not file:
        return "파일 없음", 404

    return send_file(file,
                     download_name="inventory.xlsx",
                     as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)
