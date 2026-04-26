from flask import Flask, render_template, request, send_file, session, redirect, jsonify
import pandas as pd
import io
import uuid
import re
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = "secret_key_123"

temp_storage = {}

# 🔹 로케이션 자연 정렬 (현재는 사용 안하지만 유지 가능)
def natural_sort_key(s):
    return [int(text) if text.isdigit() else text
            for text in re.split('([0-9]+)', str(s))]

# 🔐 로그인
@app.route('/login')
def login_page():
    return render_template('login.html')

@app.route('/login', methods=['POST'])
def login():
    if request.form.get('id') == "김경민" and request.form.get('pw') == "ourbox":
        session['login'] = True
        return redirect('/')
    return "로그인 실패"

# 🏠 메인
@app.route('/')
def index():
    if not session.get('login'):
        return redirect('/login')
    return render_template('index.html', data=[])

# 📥 업로드 (🔥 최적화 적용)
@app.route('/upload', methods=['POST'])
def upload():
    try:
        file = request.files['file']
        filename = secure_filename(file.filename.lower())

        # 🔥 필요한 컬럼만 읽기
        if filename.endswith('.csv'):
            df = pd.read_csv(file, usecols=[
                "로케이션","상품명","소비기한","로트번호","재고수량"
            ])
        else:
            df = pd.read_excel(
                file,
                engine='openpyxl',
                usecols=[
                    "로케이션","상품명","소비기한","로트번호","재고수량"
                ]
            )

        # 🔥 빠른 날짜 처리
        if "소비기한" in df.columns:
            df["소비기한"] = df["소비기한"].astype(str).str[:10]

        # 🔥 빠른 정렬
        if "로케이션" in df.columns:
            df = df.sort_values(by="로케이션")

        data = df.to_dict(orient='records')

        return render_template('index.html', data=data)

    except Exception as e:
        return str(e)

# 💾 저장 (다운로드용)
@app.route('/save', methods=['POST'])
def save():
    df = pd.DataFrame(request.json)

    output = io.BytesIO()
    df.to_excel(output, index=False)
    output.seek(0)

    file_id = str(uuid.uuid4())
    temp_storage[file_id] = output

    return jsonify({"download_url": f"/download/{file_id}"})

# 📥 다운로드
@app.route('/download/<file_id>')
def download(file_id):
    file = temp_storage.get(file_id)
    return send_file(
        file,
        download_name="inventory.xlsx",
        as_attachment=True
    )

if __name__ == '__main__':
    app.run(debug=True)
