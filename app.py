from flask import Flask, render_template, request, send_file, session, redirect, jsonify
import pandas as pd
import io
import uuid
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = "secret_key_123"

temp_storage = {}

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

# 🔥 업로드 (컬럼 유연 + 안정 버전)
@app.route('/upload', methods=['POST'])
def upload():
    try:
        file = request.files['file']
        filename = secure_filename(file.filename.lower())

        # 🔥 전체 읽기 (컬럼 유연 처리)
        if filename.endswith('.csv'):
            df = pd.read_csv(file)
        else:
            df = pd.read_excel(file, engine='openpyxl')

        # 🔥 필수 컬럼 체크
        required_cols = ["로케이션","상품명","재고수량"]
        for col in required_cols:
            if col not in df.columns:
                return f"❌ {col} 컬럼이 없습니다."

        # 🔥 선택 컬럼 처리
        if "소비기한" not in df.columns:
            df["소비기한"] = ""
        else:
            # 값이 있을 경우만 날짜 포맷 유지
            df["소비기한"] = df["소비기한"].astype(str).str[:10]

        if "로트번호" not in df.columns:
            df["로트번호"] = ""

        # 🔥 로케이션 정렬
        if "로케이션" in df.columns:
            df = df.sort_values(by="로케이션")

        # 🔥 필요한 컬럼만 유지
        df = df[["로케이션","상품명","소비기한","로트번호","재고수량"]]

        data = df.to_dict(orient='records')

        return render_template('index.html', data=data)

    except Exception as e:
        return f"업로드 오류: {str(e)}"

@app.route('/save', methods=['POST'])
def save():
    df = pd.DataFrame(request.json)

    output = io.BytesIO()
    df.to_excel(output, index=False)
    output.seek(0)

    file_id = str(uuid.uuid4())
    temp_storage[file_id] = output

    return jsonify({"download_url": f"/download/{file_id}"})

@app.route('/download/<file_id>')
def download(file_id):
    file = temp_storage.get(file_id)
    return send_file(file, download_name="inventory.xlsx", as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)
