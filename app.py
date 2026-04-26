from flask import Flask, render_template, request, send_file, session, redirect, jsonify
import pandas as pd
import uuid
import os
import time
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = "secret_key_123"

UPLOAD_FOLDER = "files"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

FILE_EXPIRE_TIME = 60 * 60


# 🔥 오래된 파일 자동 삭제
def delete_old_files():
    now = time.time()
    for filename in os.listdir(UPLOAD_FOLDER):
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        if os.path.isfile(file_path):
            if now - os.path.getmtime(file_path) > FILE_EXPIRE_TIME:
                try:
                    os.remove(file_path)
                except:
                    pass


# 🔐 로그인 페이지
@app.route('/login')
def login_page():
    return render_template('login.html')


# 🔐 로그인 처리 (역할 구분)
@app.route('/login', methods=['POST'])
def login():
    user_id = request.form.get('id')
    pw = request.form.get('pw')
    role = request.form.get('role')

    # 관리자
    if role == "admin" and user_id == "김경민" and pw == "ourbox123":
        session['login'] = True
        session['role'] = 'admin'
        return redirect('/admin')

    # 일반 사용자
    elif role == "user" and user_id == "김경민" and pw == "ourbox":
        session['login'] = True
        session['role'] = 'user'
        return redirect('/')

    return "로그인 실패"


# 🏠 사용자 페이지
@app.route('/')
def index():
    if not session.get('login') or session.get('role') != 'user':
        return redirect('/login')
    return render_template('index.html', data=[])


# 📊 관리자 페이지
@app.route('/admin')
def admin():
    if not session.get('login') or session.get('role') != 'admin':
        return redirect('/login')

    files = []
    for filename in os.listdir(UPLOAD_FOLDER):
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        if os.path.isfile(file_path):
            files.append({
                "id": filename.replace(".xlsx",""),
                "time": time.strftime('%Y-%m-%d %H:%M:%S',
                        time.localtime(os.path.getmtime(file_path)))
            })

    files = sorted(files, key=lambda x: x["time"], reverse=True)

    return render_template('admin.html', files=files)


# 📥 업로드
@app.route('/upload', methods=['POST'])
def upload():
    try:
        file = request.files['file']
        filename = secure_filename(file.filename.lower())

        if filename.endswith('.csv'):
            df = pd.read_csv(file)
        else:
            df = pd.read_excel(file, engine='openpyxl')

        required_cols = ["로케이션", "상품명", "재고수량"]
        for col in required_cols:
            if col not in df.columns:
                return f"{col} 없음"

        if "소비기한" not in df.columns:
            df["소비기한"] = ""
        else:
            df["소비기한"] = df["소비기한"].astype(str).str[:10]

        if "로트번호" not in df.columns:
            df["로트번호"] = ""

        df = df.sort_values(by="로케이션")
        df = df[["로케이션","상품명","소비기한","로트번호","재고수량"]]

        return render_template('index.html', data=df.to_dict(orient='records'))

    except Exception as e:
        return str(e)


# 💾 저장
@app.route('/save', methods=['POST'])
def save():
    delete_old_files()

    df = pd.DataFrame(request.json)

    file_id = str(uuid.uuid4())
    path = os.path.join(UPLOAD_FOLDER, f"{file_id}.xlsx")

    df.to_excel(path, index=False)

    return jsonify({"download_url": f"/download/{file_id}"})


# 📥 다운로드 (로그인 없이 가능)
@app.route('/download/<file_id>')
def download(file_id):
    path = os.path.join(UPLOAD_FOLDER, f"{file_id}.xlsx")

    if not os.path.exists(path):
        return "파일 없음"

    return send_file(path, download_name="inventory.xlsx", as_attachment=True)


# ❌ 삭제
@app.route('/delete/<file_id>', methods=['POST'])
def delete_file(file_id):
    path = os.path.join(UPLOAD_FOLDER, f"{file_id}.xlsx")

    if os.path.exists(path):
        os.remove(path)
        return "삭제 완료"

    return "파일 없음"


if __name__ == '__main__':
    app.run(debug=True)
