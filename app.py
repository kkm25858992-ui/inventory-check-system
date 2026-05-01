from flask import Flask, render_template, request, send_file, session, redirect, jsonify
import pandas as pd
import uuid
import os
import time
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = "secret_key_123"

# 계정
admins = {
    "김경민": "ourbox123",
}

users = {
    "김경민": "ourbox",
    "8층": "1234",
    "7층": "5678"
}

UPLOAD_FOLDER = "files"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

FILE_EXPIRE_TIME = 60 * 60


# 오래된 파일 삭제
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


# 로그인
@app.route('/login')
def login_page():
    return render_template('login.html')


@app.route('/login', methods=['POST'])
def login():
    user_id = request.form.get('id')
    pw = request.form.get('pw')
    role = request.form.get('role')

    if role == "admin":
        if user_id in admins and admins[user_id] == pw:
            session['login'] = True
            session['role'] = 'admin'
            return redirect('/admin')

    elif role == "user":
        if user_id in users and users[user_id] == pw:
            session['login'] = True
            session['role'] = 'user'
            return redirect('/')

    return "로그인 실패"


# 사용자 페이지
@app.route('/')
def index():
    if not session.get('login') or session.get('role') != 'user':
        return redirect('/login')
    return render_template('index.html', data=[])


# 관리자
@app.route('/admin')
def admin():
    if not session.get('login') or session.get('role') != 'admin':
        return redirect('/login')

    files = []
    for filename in os.listdir(UPLOAD_FOLDER):
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        if os.path.isfile(file_path):
            files.append({
                "id": filename.replace(".xlsx", ""),
                "time": time.strftime('%Y-%m-%d %H:%M:%S',
                                      time.localtime(os.path.getmtime(file_path)))
            })

    files = sorted(files, key=lambda x: x["time"], reverse=True)

    return render_template('admin.html', files=files)


# 업로드
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

        df["재고수량"] = df["재고수량"].astype(str).str.replace(",", "")
        df["재고수량"] = pd.to_numeric(df["재고수량"], errors='coerce').fillna(0)

        df = df.sort_values(by="로케이션")
        df = df[["로케이션", "상품명", "소비기한", "로트번호", "재고수량"]]

        return render_template('index.html', data=df.to_dict(orient='records'))

    except Exception as e:
        return str(e)


# 저장 (시트1 / 시트2 분리)
@app.route('/save', methods=['POST'])
def save():
    delete_old_files()

    df = pd.DataFrame(request.json)

    file_id = str(uuid.uuid4())
    path = os.path.join(UPLOAD_FOLDER, f"{file_id}.xlsx")

    if "신규" in df.columns:
        df_new = df[df["신규"] == True]
        df_old = df[df["신규"] != True]
    else:
        df_old = df
        df_new = pd.DataFrame()

    with pd.ExcelWriter(path, engine='openpyxl') as writer:
        df_old.to_excel(writer, index=False, sheet_name="시트1")

        if not df_new.empty:
            df_new.to_excel(writer, index=False, sheet_name="시트2")

    return jsonify({"file_id": file_id})


# 🔥 공유 다운로드 (로그인 없이)
@app.route('/share/<file_id>')
def share_download(file_id):
    path = os.path.join(UPLOAD_FOLDER, f"{file_id}.xlsx")

    if not os.path.exists(path):
        return "파일 없음"

    return send_file(path, download_name="inventory.xlsx", as_attachment=True)


# 일반 다운로드 (관리자용)
@app.route('/download/<file_id>')
def download(file_id):
    path = os.path.join(UPLOAD_FOLDER, f"{file_id}.xlsx")

    if not os.path.exists(path):
        return "파일 없음"

    return send_file(path, download_name="inventory.xlsx", as_attachment=True)


# 삭제
@app.route('/delete/<file_id>', methods=['POST'])
def delete_file(file_id):
    path = os.path.join(UPLOAD_FOLDER, f"{file_id}.xlsx")

    if os.path.exists(path):
        os.remove(path)
        return "삭제 완료"

    return "파일 없음"


if __name__ == '__main__':
    app.run(debug=True)
