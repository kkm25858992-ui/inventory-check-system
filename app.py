from flask import Flask, render_template, request, send_file, session, redirect, jsonify
import pandas as pd
import uuid
import os
import time
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = "secret_key_123"

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


def delete_old_files():
    now = time.time()
    for filename in os.listdir(UPLOAD_FOLDER):
        path = os.path.join(UPLOAD_FOLDER, filename)
        if os.path.isfile(path) and now - os.path.getmtime(path) > FILE_EXPIRE_TIME:
            try:
                os.remove(path)
            except:
                pass


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


@app.route('/')
def index():
    if not session.get('login') or session.get('role') != 'user':
        return redirect('/login')
    return render_template('index.html', data=[])


@app.route('/upload', methods=['POST'])
def upload():
    file = request.files['file']
    filename = secure_filename(file.filename.lower())

    if filename.endswith('.csv'):
        df = pd.read_csv(file)
    else:
        df = pd.read_excel(file, engine='openpyxl')

    required = ["로케이션", "상품명", "바코드", "재고수량"]
    for col in required:
        if col not in df.columns:
            return f"{col} 없음"

    df["로케이션"] = df["로케이션"].astype(str).str.strip()
    df["상품명"] = df["상품명"].astype(str).str.strip()
    df["바코드"] = df["바코드"].astype(str).str.strip()

    if "소비기한" not in df.columns:
        df["소비기한"] = ""
    else:
        df["소비기한"] = df["소비기한"].astype(str).str[:10]

    if "로트번호" not in df.columns:
        df["로트번호"] = ""

    df["재고수량"] = (
        df["재고수량"]
        .astype(str)
        .str.replace(",", "")
        .str.extract(r'(\d+)')[0]
    )

    df["재고수량"] = pd.to_numeric(df["재고수량"], errors='coerce').fillna(0)

    df = df[["로케이션","상품명","바코드","소비기한","로트번호","재고수량"]]

    return render_template('index.html', data=df.to_dict(orient='records'))


# 🔥 핵심: Sheet1 + Sheet2 저장
@app.route('/save', methods=['POST'])
def save():
    delete_old_files()

    payload = request.json

    main_data = payload.get("main", [])
    new_data = payload.get("new", [])

    file_id = str(uuid.uuid4())
    path = os.path.join(UPLOAD_FOLDER, f"{file_id}.xlsx")

    with pd.ExcelWriter(path, engine='openpyxl') as writer:
        pd.DataFrame(main_data).to_excel(writer, index=False, sheet_name='Sheet1')

        if new_data:
            pd.DataFrame(new_data).to_excel(writer, index=False, sheet_name='Sheet2')

    return jsonify({"download_url": f"/download/{file_id}"})


@app.route('/download/<file_id>')
def download(file_id):
    path = os.path.join(UPLOAD_FOLDER, f"{file_id}.xlsx")
    if not os.path.exists(path):
        return "파일 없음"
    return send_file(path, download_name="inventory.xlsx", as_attachment=True)


if __name__ == '__main__':
    app.run(debug=True)
