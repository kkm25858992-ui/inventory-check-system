from flask import Flask, render_template, request, send_file, session, redirect
import pandas as pd
import io
import uuid
import re
from werkzeug.utils import secure_filename

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
    if request.form.get('id') == "김경민" and request.form.get('pw') == "ourbox":
        session['login'] = True
        return redirect('/')
    return "로그인 실패"

@app.route('/')
def index():
    if not session.get('login'):
        return redirect('/login')
    return render_template('index.html', data=[])

# 🔥 모바일 안정 업로드
@app.route('/upload', methods=['POST'])
def upload():
    try:
        file = request.files['file']
        filename = secure_filename(file.filename.lower())

        if filename.endswith('.csv'):
            df = pd.read_csv(file)
        else:
            df = pd.read_excel(file, engine='openpyxl')

        if "소비기한" in df.columns:
            df["소비기한"] = pd.to_datetime(df["소비기한"], errors='coerce') \
                .dt.strftime('%Y-%m-%d')

        if "로케이션" in df.columns:
            df = df.sort_values(
                by="로케이션",
                key=lambda col: col.map(natural_sort_key)
            )

        data = df.to_dict(orient='records')

        return render_template('index.html', data=data)

    except Exception as e:
        return str(e)

@app.route('/save', methods=['POST'])
def save():
    df = pd.DataFrame(request.json)

    output = io.BytesIO()
    df.to_excel(output, index=False)
    output.seek(0)

    file_id = str(uuid.uuid4())
    temp_storage[file_id] = output

    return {"download_url": f"/download/{file_id}"}

@app.route('/download/<file_id>')
def download(file_id):
    file = temp_storage.get(file_id)
    return send_file(file,
                     download_name="inventory.xlsx",
                     as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)
