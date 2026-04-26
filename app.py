from flask import Flask, render_template, request, send_file, session, redirect, jsonify
import pandas as pd
import uuid
import os
import time
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = "secret_key_123"

# 📁 파일 저장 폴더
UPLOAD_FOLDER = "files"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ⏱ 파일 유지 시간 (1시간)
FILE_EXPIRE_TIME = 60 * 60


# 🔥 오래된 파일 자동 삭제
def delete_old_files():
    now = time.time()
    for filename in os.listdir(UPLOAD_FOLDER):
        file_path = os.path.join(UPLOAD_FOLDER, filename)

        if os.path.isfile(file_path):
            file_time = os.path.getmtime(file_path)

            if now - file_time > FILE_EXPIRE_TIME:
                try:
                    os.remove(file_path)
                except:
                    pass


# 🔐 로그인 페이지
@app.route('/login')
def login_page():
    return render_template('login.html')


# 🔐 로그인 처리
@app.route('/login', methods=['POST'])
def login():
    if request.form.get('id') == "김경민" and request.form.get('pw') == "ourbox":
        session['login'] = True
        return redirect('/')
    return "로그인 실패"


# 🏠 메인 페이지 (로그인 필요)
@app.route('/')
def index():
    if not session.get('login'):
        return redirect('/login')
    return render_template('index.html', data=[])


# 📥 엑셀 업로드
@app.route('/upload', methods=['POST'])
def upload():
    try:
        file = request.files['file']
        filename = secure_filename(file.filename.lower())

        if filename.endswith('.csv'):
            df = pd.read_csv(file)
        else:
            df = pd.read_excel(file, engine='openpyxl')

        # 필수 컬럼 체크
        required_cols = ["로케이션", "상품명", "재고수량"]
        for col in required_cols:
            if col not in df.columns:
                return f"❌ {col} 컬럼이 없습니다."

        # 선택 컬럼 처리
        if "소비기한" not in df.columns:
            df["소비기한"] = ""
        else:
            df["소비기한"] = df["소비기한"].astype(str).str[:10]

        if "로트번호" not in df.columns:
            df["로트번호"] = ""

        # 정렬
        df = df.sort_values(by="로케이션")

        # 컬럼 정리
        df = df[["로케이션", "상품명", "소비기한", "로트번호", "재고수량"]]

        data = df.to_dict(orient='records')

        return render_template('index.html', data=data)

    except Exception as e:
        return f"업로드 오류: {str(e)}"


# 💾 저장 + 자동삭제
@app.route('/save', methods=['POST'])
def save():
    try:
        delete_old_files()

        df = pd.DataFrame(request.json)

        file_id = str(uuid.uuid4())
        file_path = os.path.join(UPLOAD_FOLDER, f"{file_id}.xlsx")

        df.to_excel(file_path, index=False)

        return jsonify({"download_url": f"/download/{file_id}"})

    except Exception as e:
        return str(e)


# 🔥 다운로드 (로그인 없이 바로 다운로드)
@app.route('/download/<file_id>')
def download(file_id):
    file_path = os.path.join(UPLOAD_FOLDER, f"{file_id}.xlsx")

    if not os.path.exists(file_path):
        return "파일이 존재하지 않습니다."

    return send_file(
        file_path,
        download_name="inventory.xlsx",
        as_attachment=True
    )


if __name__ == '__main__':
    app.run(debug=True)
