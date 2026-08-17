from flask import (
    Flask,
    render_template,
    request,
    send_file,
    session,
    redirect,
    jsonify
)

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

FILE_EXPIRE_TIME = 60 * 60


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

        if not os.path.isfile(file_path):
            continue

        if (
            now - os.path.getmtime(file_path)
            > FILE_EXPIRE_TIME
        ):

            try:
                os.remove(file_path)

            except Exception:
                pass


# =========================================================
# 숫자 처리
# =========================================================

def clean_number(value):

    if value is None:
        return 0

    try:

        text = str(value)

        text = text.replace(
            ",",
            ""
        ).strip()

        if text == "":
            return 0

        number = float(text)

        if number.is_integer():
            return int(number)

        return number

    except Exception:

        return 0


# =========================================================
# 문자열 처리
# =========================================================

def clean_text(value):

    if value is None:
        return ""

    try:

        if pd.isna(value):
            return ""

    except Exception:
        pass

    return str(value).strip()


# =========================================================
# 바코드 처리
#
# Excel에서 숫자로 읽히면서
# 8801234567890.0 형태가 되는 것을 방지
# =========================================================

def clean_barcode(value):

    if value is None:
        return ""

    try:

        if pd.isna(value):
            return ""

    except Exception:
        pass

    text = str(value).strip()

    if text.endswith(".0"):

        try:

            number = float(text)

            if number.is_integer():
                return str(int(number))

        except Exception:
            pass

    return text


# =========================================================
# 로그인 페이지
# =========================================================

@app.route("/login")
def login_page():

    return render_template(
        "login.html"
    )


# =========================================================
# 로그인
# =========================================================

@app.route(
    "/login",
    methods=["POST"]
)
def login():

    user_id = request.form.get("id")
    pw = request.form.get("pw")
    role = request.form.get("role")


    # 관리자
    if role == "admin":

        if (
            user_id in admins
            and admins[user_id] == pw
        ):

            session["login"] = True
            session["role"] = "admin"

            return redirect("/admin")


    # 사용자
    if role == "user":

        if (
            user_id in users
            and users[user_id] == pw
        ):

            session["login"] = True
            session["role"] = "user"

            return redirect("/")


    return "로그인 실패"


# =========================================================
# 사용자 페이지
# =========================================================

@app.route("/")
def index():

    if not session.get("login"):
        return redirect("/login")

    if session.get("role") != "user":
        return redirect("/login")


    return render_template(
        "index.html",
        data=[],
        master_data=[]
    )


# =========================================================
# 관리자 페이지
# =========================================================

@app.route("/admin")
def admin():

    if not session.get("login"):
        return redirect("/login")

    if session.get("role") != "admin":
        return redirect("/login")


    files = []


    for filename in os.listdir(
        UPLOAD_FOLDER
    ):

        if not filename.endswith(".xlsx"):
            continue


        file_path = os.path.join(
            UPLOAD_FOLDER,
            filename
        )


        files.append({

            "id":
                filename.replace(
                    ".xlsx",
                    ""
                ),

            "time":
                time.strftime(
                    "%Y-%m-%d %H:%M:%S",
                    time.localtime(
                        os.path.getmtime(
                            file_path
                        )
                    )
                )

        })


    files.sort(
        key=lambda x: x["time"],
        reverse=True
    )


    return render_template(
        "admin.html",
        files=files
    )


# =========================================================
# 엑셀 업로드
#
# 시트1
# -----
# 비어 있어도 됨
#
#
# 시트2
# -----
# A = 화주사
# B = 바코드
# C = 입수량
# D = 상품명
# =========================================================

@app.route(
    "/upload",
    methods=["POST"]
)
def upload():

    try:

        file = request.files.get(
            "file"
        )


        if not file:

            return "엑셀 파일이 없습니다."


        if not file.filename:

            return "파일을 선택해주세요."


        filename = secure_filename(
            file.filename.lower()
        )


        # =================================================
        # CSV
        # =================================================

        if filename.endswith(".csv"):

            return (
                "CSV는 사용할 수 없습니다. "
                "시트2 상품정보가 필요하므로 "
                "Excel 파일(.xlsx)을 사용해주세요."
            )


        # =================================================
        # Excel
        # =================================================

        excel = pd.ExcelFile(
            file,
            engine="openpyxl"
        )


        # 최소 2개 시트 필요
        if len(excel.sheet_names) < 2:

            return (
                "엑셀 파일에 시트2가 없습니다.<br><br>"
                "시트2에는 다음 컬럼이 필요합니다.<br>"
                "A열 = 화주사<br>"
                "B열 = 바코드<br>"
                "C열 = 입수량<br>"
                "D열 = 상품명"
            )


        # =================================================
        # 시트1
        #
        # 실제 내용은 사용하지 않음
        # 비어 있어도 정상
        # =================================================

        df_sheet1 = pd.read_excel(
            excel,
            sheet_name=0,
            dtype=str
        )


        # =================================================
        # 시트2
        # =================================================

        df_master = pd.read_excel(
            excel,
            sheet_name=1,
            dtype=str
        )


        # =================================================
        # 시트2 컬럼 확인
        # =================================================

        required_master_columns = [
            "화주사",
            "바코드",
            "입수량",
            "상품명"
        ]


        for col in required_master_columns:

            if col not in df_master.columns:

                return (
                    "시트2에 "
                    f"'{col}' 컬럼이 없습니다."
                )


        # =================================================
        # 시트2 정리
        # =================================================

        df_master["화주사"] = (
            df_master["화주사"]
            .apply(clean_text)
        )


        df_master["바코드"] = (
            df_master["바코드"]
            .apply(clean_barcode)
        )


        df_master["입수량"] = (
            df_master["입수량"]
            .apply(clean_number)
        )


        df_master["상품명"] = (
            df_master["상품명"]
            .apply(clean_text)
        )


        # =================================================
        # 빈 바코드 제거
        # =================================================

        df_master = df_master[
            df_master["바코드"] != ""
        ].copy()


        # =================================================
        # 같은 바코드가 여러 개 있을 경우
        #
        # 첫 번째 데이터를 사용
        # =================================================

        df_master = (
            df_master
            .drop_duplicates(
                subset=["바코드"],
                keep="first"
            )
        )


        # =================================================
        # 최종 master 데이터
        # =================================================

        master_data = []


        for _, row in df_master.iterrows():

            master_data.append({

                "화주사":
                    clean_text(
                        row["화주사"]
                    ),

                "바코드":
                    clean_barcode(
                        row["바코드"]
                    ),

                "입수량":
                    clean_number(
                        row["입수량"]
                    ),

                "상품명":
                    clean_text(
                        row["상품명"]
                    )

            })


        # =================================================
        # 조사 데이터는 빈 상태
        #
        # ★ 중요
        # 시트1 데이터를 가져오지 않음
        # =================================================

        inventory_data = []


        # =================================================
        # 조사 화면으로 이동
        # =================================================

        return render_template(

            "index.html",

            data=inventory_data,

            master_data=master_data

        )


    except Exception as e:

        print(
            "UPLOAD ERROR:",
            e
        )


        return (
            "엑셀 업로드 중 오류가 발생했습니다.<br><br>"
            + str(e)
        )


# =========================================================
# 재고조사 결과 저장
#
# POST JSON
#
# {
#     "inventory": [...],
#     "master": [...]
# }
#
#
# 최종 시트1
# ----------
# A 바코드
# B 랙
# C 소비기한
# D 수량
# E 상품명
# F 화주사
#
#
# 최종 시트2
# ----------
# A 화주사
# B 바코드
# C 입수량
# D 상품명
# =========================================================

@app.route(
    "/save",
    methods=["POST"]
)
def save():

    delete_old_files()


    try:

        payload = request.get_json()


        if not payload:

            return jsonify({
                "error": "저장할 데이터가 없습니다."
            }), 400


        # =================================================
        # 데이터 구분
        # =================================================

        inventory_data = (
            payload.get(
                "inventory",
                []
            )
        )


        master_data = (
            payload.get(
                "master",
                []
            )
        )


        # =================================================
        # 조사 결과 확인
        # =================================================

        if not inventory_data:

            return jsonify({
                "error":
                    "재고조사한 데이터가 없습니다."
            }), 400


        # =================================================
        # 시트1 생성
        # =================================================

        sheet1_rows = []


        for item in inventory_data:

            sheet1_rows.append({

                "바코드":
                    clean_barcode(
                        item.get(
                            "바코드",
                            ""
                        )
                    ),

                "랙":
                    clean_text(
                        item.get(
                            "랙",
                            ""
                        )
                    ),

                "소비기한":
                    clean_text(
                        item.get(
                            "소비기한",
                            ""
                        )
                    ),

                "수량":
                    clean_number(
                        item.get(
                            "수량",
                            0
                        )
                    ),

                "상품명":
                    clean_text(
                        item.get(
                            "상품명",
                            ""
                        )
                    ),

                "화주사":
                    clean_text(
                        item.get(
                            "화주사",
                            ""
                        )
                    )

            })


        df_sheet1 = pd.DataFrame(
            sheet1_rows,

            columns=[
                "바코드",
                "랙",
                "소비기한",
                "수량",
                "상품명",
                "화주사"
            ]
        )


        # =================================================
        # 시트2 생성
        #
        # 업로드했던 상품 마스터를 그대로 유지
        # =================================================

        master_rows = []


        for item in master_data:

            master_rows.append({

                "화주사":
                    clean_text(
                        item.get(
                            "화주사",
                            ""
                        )
                    ),

                "바코드":
                    clean_barcode(
                        item.get(
                            "바코드",
                            ""
                        )
                    ),

                "입수량":
                    clean_number(
                        item.get(
                            "입수량",
                            0
                        )
                    ),

                "상품명":
                    clean_text(
                        item.get(
                            "상품명",
                            ""
                        )
                    )

            })


        df_sheet2 = pd.DataFrame(

            master_rows,

            columns=[
                "화주사",
                "바코드",
                "입수량",
                "상품명"
            ]

        )


        # =================================================
        # 파일 ID
        # =================================================

        file_id = str(
            uuid.uuid4()
        )


        path = os.path.join(

            UPLOAD_FOLDER,

            f"{file_id}.xlsx"

        )


        # =================================================
        # Excel 저장
        # =================================================

        with pd.ExcelWriter(
            path,
            engine="openpyxl"
        ) as writer:


            # ---------------------------------------------
            # 시트1
            # ---------------------------------------------

            df_sheet1.to_excel(

                writer,

                index=False,

                sheet_name="시트1"

            )


            # ---------------------------------------------
            # 시트2
            # ---------------------------------------------

            df_sheet2.to_excel(

                writer,

                index=False,

                sheet_name="시트2"

            )


            # ---------------------------------------------
            # 열 너비
            # ---------------------------------------------

            workbook = writer.book


            ws1 = workbook["시트1"]
            ws2 = workbook["시트2"]


            widths1 = {

                "A": 20,
                "B": 18,
                "C": 15,
                "D": 12,
                "E": 30,
                "F": 20

            }


            for col, width in widths1.items():

                ws1.column_dimensions[
                    col
                ].width = width


            widths2 = {

                "A": 20,
                "B": 20,
                "C": 12,
                "D": 30

            }


            for col, width in widths2.items():

                ws2.column_dimensions[
                    col
                ].width = width


        # =================================================
        # 완료
        # =================================================

        return jsonify({

            "file_id":
                file_id

        })


    except Exception as e:

        print(
            "SAVE ERROR:",
            e
        )


        return jsonify({

            "error":
                str(e)

        }), 500


# =========================================================
# 다운로드
# =========================================================

@app.route(
    "/download/<file_id>"
)
def download(file_id):

    path = os.path.join(

        UPLOAD_FOLDER,

        f"{file_id}.xlsx"

    )


    if not os.path.exists(path):

        return "파일 없음"


    return send_file(

        path,

        download_name="재고조사결과.xlsx",

        as_attachment=True

    )


# =========================================================
# 공유 다운로드
# =========================================================

@app.route(
    "/share/<file_id>"
)
def share_download(file_id):

    path = os.path.join(

        UPLOAD_FOLDER,

        f"{file_id}.xlsx"

    )


    if not os.path.exists(path):

        return "파일 없음"


    return send_file(

        path,

        download_name="재고조사결과.xlsx",

        as_attachment=True

    )


# =========================================================
# QR 코드
# =========================================================

@app.route(
    "/qr/<file_id>"
)
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
    "/delete/<file_id>",
    methods=["POST"]
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

if __name__ == "__main__":

    app.run(
        debug=True
    )
