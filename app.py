from flask import Flask, render_template, request, send_file, session, redirect, jsonify
import pandas as pd
import uuid
import os
import time
import qrcode

from io import BytesIO
from werkzeug.utils import secure_filename


app = Flask(__name__)
app.secret_key = "secret_key_123"


# =========================================================
# 계정
# =========================================================

admins = {
    "김경민": "ourbox123",
}

users = {
    "김경민": "ourbox",
    "8층": "1234",
    "7층": "5678"
}


# =========================================================
# 파일 설정
# =========================================================

UPLOAD_FOLDER = "files"

os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)

FILE_EXPIRE_TIME = 60 * 60   # 1시간


# =========================================================
# 오래된 파일 삭제
# =========================================================

def delete_old_files():

    now = time.time()

    for filename in os.listdir(UPLOAD_FOLDER):

        file_path = os.path.join(
            UPLOAD_FOLDER,
            filename
        )

        if os.path.isfile(file_path):

            if now - os.path.getmtime(file_path) > FILE_EXPIRE_TIME:

                try:
                    os.remove(file_path)
                except:
                    pass


# =========================================================
# 숫자 변환
# =========================================================

def clean_number(value):

    if pd.isna(value):
        return 0

    try:

        value = str(value).replace(",", "").strip()

        if value == "":
            return 0

        return float(value)

    except:

        return 0


# =========================================================
# 로그인 페이지
# =========================================================

@app.route('/login')
def login_page():

    return render_template(
        'login.html'
    )


# =========================================================
# 로그인
# =========================================================

@app.route('/login', methods=['POST'])
def login():

    user_id = request.form.get('id')
    pw = request.form.get('pw')
    role = request.form.get('role')


    # 관리자
    if role == "admin":

        if user_id in admins and admins[user_id] == pw:

            session['login'] = True
            session['role'] = 'admin'

            return redirect('/admin')


    # 사용자
    elif role == "user":

        if user_id in users and users[user_id] == pw:

            session['login'] = True
            session['role'] = 'user'

            return redirect('/')


    return "로그인 실패"


# =========================================================
# 사용자 페이지
# =========================================================

@app.route('/')
def index():

    if not session.get('login'):
        return redirect('/login')

    if session.get('role') != 'user':
        return redirect('/login')


    return render_template(
        'index.html',
        data=[]
    )


# =========================================================
# 관리자 페이지
# =========================================================

@app.route('/admin')
def admin():

    if not session.get('login'):
        return redirect('/login')

    if session.get('role') != 'admin':
        return redirect('/login')


    files = []


    for filename in os.listdir(UPLOAD_FOLDER):

        if filename.endswith(".xlsx"):

            file_path = os.path.join(
                UPLOAD_FOLDER,
                filename
            )


            files.append({

                "id": filename.replace(
                    ".xlsx",
                    ""
                ),

                "time": time.strftime(
                    '%Y-%m-%d %H:%M:%S',
                    time.localtime(
                        os.path.getmtime(
                            file_path
                        )
                    )
                )

            })


    files = sorted(
        files,
        key=lambda x: x["time"],
        reverse=True
    )


    return render_template(
        'admin.html',
        files=files
    )


# =========================================================
# 엑셀 업로드
#
# 시트1
# A = 바코드
# B = 랙
# C = 소비기한
# D = 수량
#
# 시트2
# A = 화주사
# B = 바코드
# C = 입수량
# D = 상품명
# =========================================================

@app.route('/upload', methods=['POST'])
def upload():

    try:

        file = request.files.get('file')


        if not file:

            return "파일이 없습니다."


        # -------------------------------------------------
        # 파일명
        # -------------------------------------------------

        filename = secure_filename(
            file.filename.lower()
        )


        # -------------------------------------------------
        # 엑셀 / CSV 읽기
        # -------------------------------------------------

        if filename.endswith('.csv'):

            df1 = pd.read_csv(
                file,
                dtype=str
            )

            df2 = pd.DataFrame()

        else:

            excel = pd.ExcelFile(
                file,
                engine='openpyxl'
            )


            # ---------------------------------------------
            # 시트1
            # ---------------------------------------------

            df1 = pd.read_excel(
                excel,
                sheet_name=0,
                dtype=str
            )


            # ---------------------------------------------
            # 시트2
            # ---------------------------------------------

            if len(excel.sheet_names) >= 2:

                df2 = pd.read_excel(
                    excel,
                    sheet_name=1,
                    dtype=str
                )

            else:

                df2 = pd.DataFrame()


        # =================================================
        # 시트1 컬럼 확인
        # =================================================

        required_cols = [
            "바코드",
            "랙",
            "소비기한",
            "수량"
        ]


        for col in required_cols:

            if col not in df1.columns:

                return f"시트1에 '{col}' 컬럼이 없습니다."


        # =================================================
        # 시트2 컬럼 확인
        # =================================================

        if not df2.empty:

            required_sheet2_cols = [
                "화주사",
                "바코드",
                "입수량",
                "상품명"
            ]


            for col in required_sheet2_cols:

                if col not in df2.columns:

                    return (
                        f"시트2에 '{col}' "
                        f"컬럼이 없습니다."
                    )


        # =================================================
        # 시트1 기본 데이터 정리
        # =================================================

        df1["바코드"] = (
            df1["바코드"]
            .fillna("")
            .astype(str)
            .str.strip()
        )


        df1["랙"] = (
            df1["랙"]
            .fillna("")
            .astype(str)
            .str.strip()
        )


        df1["소비기한"] = (
            df1["소비기한"]
            .fillna("")
            .astype(str)
            .str[:10]
        )


        # =================================================
        # 수량 숫자 처리
        # =================================================

        df1["수량"] = (
            df1["수량"]
            .fillna("")
            .astype(str)
            .str.replace(",", "", regex=False)
            .str.strip()
        )


        df1["수량"] = pd.to_numeric(
            df1["수량"],
            errors='coerce'
        ).fillna(0)


        # =================================================
        # 시트2 데이터 정리
        # =================================================

        if not df2.empty:

            df2["화주사"] = (
                df2["화주사"]
                .fillna("")
                .astype(str)
                .str.strip()
            )


            df2["바코드"] = (
                df2["바코드"]
                .fillna("")
                .astype(str)
                .str.strip()
            )


            df2["입수량"] = (
                df2["입수량"]
                .fillna("")
                .astype(str)
                .str.replace(",", "", regex=False)
                .str.strip()
            )


            df2["입수량"] = pd.to_numeric(
                df2["입수량"],
                errors='coerce'
            ).fillna(0)


            df2["상품명"] = (
                df2["상품명"]
                .fillna("")
                .astype(str)
                .str.strip()
            )


        # =================================================
        # 바코드 기준 시트2 매칭
        # =================================================

        if not df2.empty:

            # 같은 바코드가 여러 개 있을 경우
            # 첫 번째 데이터를 사용
            df2_map = (
                df2
                .drop_duplicates(
                    subset=["바코드"],
                    keep="first"
                )
                .set_index("바코드")
            )


            # -------------------------------------------------
            # 화주사
            # -------------------------------------------------

            df1["화주사"] = (
                df1["바코드"]
                .map(
                    df2_map["화주사"]
                )
                .fillna("")
            )


            # -------------------------------------------------
            # 입수량
            # -------------------------------------------------

            df1["입수량"] = (
                df1["바코드"]
                .map(
                    df2_map["입수량"]
                )
                .fillna(0)
            )


            # -------------------------------------------------
            # 상품명
            # -------------------------------------------------

            df1["상품명"] = (
                df1["바코드"]
                .map(
                    df2_map["상품명"]
                )
                .fillna("")
            )


        else:

            df1["화주사"] = ""
            df1["입수량"] = 0
            df1["상품명"] = ""


        # =================================================
        # 정렬
        # =================================================

        df1 = df1.sort_values(
            by="랙",
            kind="stable"
        )


        # =================================================
        # 조사 화면에 전달할 컬럼
        #
        # 기존 JS와 새 JS에서 사용하기 편하도록
        # 필요한 정보만 전달
        # =================================================

        result = []


        for _, row in df1.iterrows():

            result.append({

                "바코드": str(
                    row["바코드"]
                ),

                "랙": str(
                    row["랙"]
                ),

                "소비기한": str(
                    row["소비기한"]
                ),

                "수량": clean_number(
                    row["수량"]
                ),

                "입수량": clean_number(
                    row["입수량"]
                ),

                "상품명": str(
                    row["상품명"]
                ),

                "화주사": str(
                    row["화주사"]
                ),

                # 조사 결과
                "실수량": "",
                "박스수량": "",
                "낱개수량": "",
                "조사완료": False

            })


        # =================================================
        # 업로드 후 화면
        # =================================================

        return render_template(
            'index.html',
            data=result
        )


    except Exception as e:

        print(
            "UPLOAD ERROR:",
            e
        )

        return (
            f"엑셀 업로드 중 오류가 발생했습니다.<br>"
            f"{str(e)}"
        )


# =========================================================
# 저장
#
# 최종 시트1
#
# A = 바코드
# B = 랙
# C = 소비기한
# D = 수량
# E = 상품명
# F = 화주사
#
# 최종 시트2
#
# A = 화주사
# B = 바코드
# C = 입수량
# D = 상품명
# =========================================================

@app.route('/save', methods=['POST'])
def save():

    delete_old_files()


    try:

        json_data = request.get_json()


        if not json_data:

            return jsonify({
                "error": "데이터 없음"
            }), 400


        df = pd.DataFrame(
            json_data
        )


        if df.empty:

            return jsonify({
                "error": "데이터 없음"
            }), 400


        # =================================================
        # 시트1 컬럼 생성
        # =================================================

        sheet1_columns = [
            "바코드",
            "랙",
            "소비기한",
            "수량",
            "상품명",
            "화주사"
        ]


        for col in sheet1_columns:

            if col not in df.columns:

                df[col] = ""


        # =================================================
        # 수량 정리
        #
        # 조사 완료 후 실수량을 D열에 저장
        # =================================================

        def get_final_qty(row):

            value = row.get(
                "실수량",
                ""
            )

            if value is not None:

                if str(value).strip() != "":

                    return clean_number(
                        value
                    )


            return clean_number(
                row.get(
                    "수량",
                    0
                )
            )


        df["수량"] = df.apply(
            get_final_qty,
            axis=1
        )


        # =================================================
        # 시트1 생성
        # =================================================

        df_sheet1 = df[
            [
                "바코드",
                "랙",
                "소비기한",
                "수량",
                "상품명",
                "화주사"
            ]
        ].copy()


        # =================================================
        # 시트2 생성
        #
        # 조사 데이터에 들어있는
        # 화주사 / 바코드 / 입수량 / 상품명
        # 을 이용해서 생성
        # =================================================

        df_sheet2 = df[
            [
                "화주사",
                "바코드",
                "입수량",
                "상품명"
            ]
        ].copy()


        # 중복 제거
        df_sheet2 = df_sheet2.drop_duplicates(
            subset=["바코드"],
            keep="first"
        )


        # =================================================
        # 파일 생성
        # =================================================

        file_id = str(
            uuid.uuid4()
        )


        path = os.path.join(
            UPLOAD_FOLDER,
            f"{file_id}.xlsx"
        )


        # =================================================
        # 엑셀 저장
        # =================================================

        with pd.ExcelWriter(
            path,
            engine='openpyxl'
        ) as writer:


            # -------------------------------
            # 시트1
            # -------------------------------

            df_sheet1.to_excel(
                writer,
                index=False,
                sheet_name="시트1"
            )


            # -------------------------------
            # 시트2
            # -------------------------------

            df_sheet2.to_excel(
                writer,
                index=False,
                sheet_name="시트2"
            )


        # =================================================
        # 반환
        # =================================================

        return jsonify({

            "file_id": file_id

        })


    except Exception as e:

        print(
            "SAVE ERROR:",
            e
        )


        return jsonify({

            "error": str(e)

        }), 500


# =========================================================
# 다운로드
# =========================================================

@app.route('/download/<file_id>')
def download(file_id):

    path = os.path.join(
        UPLOAD_FOLDER,
        f"{file_id}.xlsx"
    )


    if not os.path.exists(path):

        return "파일 없음"


    return send_file(

        path,

        download_name="inventory.xlsx",

        as_attachment=True

    )


# =========================================================
# 공유 다운로드
# =========================================================

@app.route('/share/<file_id>')
def share_download(file_id):

    path = os.path.join(
        UPLOAD_FOLDER,
        f"{file_id}.xlsx"
    )


    if not os.path.exists(path):

        return "파일 없음"


    return send_file(

        path,

        download_name="inventory.xlsx",

        as_attachment=True

    )


# =========================================================
# QR 생성
# =========================================================

@app.route('/qr/<file_id>')
def generate_qr(file_id):

    url = (
        request.host_url.rstrip("/")
        + "/share/"
        + file_id
    )


    qr = qrcode.make(
        url
    )


    img_io = BytesIO()


    qr.save(
        img_io,
        "PNG"
    )


    img_io.seek(0)


    return send_file(

        img_io,

        mimetype="image/png"

    )


# =========================================================
# 파일 삭제
# =========================================================

@app.route(
    '/delete/<file_id>',
    methods=['POST']
)
def delete_file(file_id):

    path = os.path.join(
        UPLOAD_FOLDER,
        f"{file_id}.xlsx"
    )


    if os.path.exists(path):

        os.remove(path)

        return "삭제 완료"


    return "파일 없음"


# =========================================================
# 실행
# =========================================================

if __name__ == '__main__':

    app.run(
        debug=True
    )
