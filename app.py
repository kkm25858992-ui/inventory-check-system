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
    "7층": "5678",
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

        try:

            if (
                now
                - os.path.getmtime(file_path)
                > FILE_EXPIRE_TIME
            ):

                os.remove(file_path)

        except Exception:

            pass


# =========================================================
# 숫자 정리
# =========================================================

def clean_number(value):

    if value is None:
        return 0

    try:

        text = str(value)

        text = text.replace(",", "").strip()

        if text == "":
            return 0

        number = float(text)

        if number.is_integer():
            return int(number)

        return number

    except Exception:

        return 0


# =========================================================
# 문자열 정리
# =========================================================

def clean_text(value):

    if value is None:
        return ""

    if pd.isna(value):
        return ""

    return str(value).strip()


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

@app.route("/login", methods=["POST"])
def login():

    user_id = request.form.get("id", "").strip()

    pw = request.form.get("pw", "").strip()

    role = request.form.get("role", "").strip()


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
        lookup=[]
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


    for filename in os.listdir(UPLOAD_FOLDER):

        if not filename.endswith(".xlsx"):
            continue


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
# 업로드 엑셀의 시트2:
#
# A = 화주사
# B = 바코드
# C = 입수량
# D = 상품명
# =========================================================

@app.route("/upload", methods=["POST"])
def upload():

    try:

        if "file" not in request.files:

            return (
                "엑셀 파일이 없습니다.",
                400
            )


        file = request.files["file"]


        if file.filename == "":

            return (
                "파일을 선택해주세요.",
                400
            )


        filename = secure_filename(
            file.filename
        )


        # =================================================
        # 파일 읽기
        # =================================================

        if filename.lower().endswith(".csv"):

            df_lookup = pd.read_csv(
                file,
                dtype=str
            )

        else:

            excel = pd.ExcelFile(
                file,
                engine="openpyxl"
            )


            if "시트2" in excel.sheet_names:

                sheet_name = "시트2"

            elif len(excel.sheet_names) >= 2:

                sheet_name = excel.sheet_names[1]

            else:

                return (
                    "시트2가 없습니다.",
                    400
                )


            df_lookup = pd.read_excel(
                excel,
                sheet_name=sheet_name,
                dtype=str
            )


        # =================================================
        # 컬럼명 정리
        # =================================================

        df_lookup.columns = [
            str(col).strip()
            for col in df_lookup.columns
        ]


        required_cols = [
            "화주사",
            "바코드",
            "입수량",
            "상품명"
        ]


        missing = [

            col

            for col in required_cols

            if col not in df_lookup.columns

        ]


        if missing:

            return (
                "시트2에 다음 컬럼이 없습니다: "
                + ", ".join(missing),
                400
            )


        # =================================================
        # 시트2 데이터 정리
        # =================================================

        df_lookup = df_lookup[
            required_cols
        ].copy()


        df_lookup["화주사"] = (
            df_lookup["화주사"]
            .fillna("")
            .astype(str)
            .str.strip()
        )


        df_lookup["바코드"] = (
            df_lookup["바코드"]
            .fillna("")
            .astype(str)
            .str.strip()
        )


        df_lookup["상품명"] = (
            df_lookup["상품명"]
            .fillna("")
            .astype(str)
            .str.strip()
        )


        df_lookup["입수량"] = (
            df_lookup["입수량"]
            .fillna("")
            .astype(str)
            .str.replace(",", "", regex=False)
            .str.strip()
        )


        # =================================================
        # 빈 바코드 제거
        # =================================================

        df_lookup = df_lookup[
            df_lookup["바코드"] != ""
        ]


        # =================================================
        # 중복 바코드가 있으면 첫 번째 사용
        # =================================================

        df_lookup = df_lookup.drop_duplicates(
            subset=["바코드"],
            keep="first"
        )


        lookup = (
            df_lookup
            .to_dict(orient="records")
        )


        # =================================================
        # 업로드 완료
        #
        # data는 비워둡니다.
        # 시트1은 조사하면서 직접 입력한 데이터만 생성
        # =================================================

        return render_template(

            "index.html",

            data=[],

            lookup=lookup

        )


    except Exception as e:

        print(
            "UPLOAD ERROR:",
            repr(e)
        )


        return (
            "엑셀 업로드 오류: "
            + str(e),
            500
        )


# =========================================================
# 조사 결과 저장
#
# 시트1:
# A 바코드
# B 랙
# C 소비기한
# D 수량
# E 상품명
# F 화주사
#
# 시트2:
# 업로드 당시의 매칭 데이터 그대로 유지
# =========================================================

@app.route("/save", methods=["POST"])
def save():

    delete_old_files()


    try:

        body = request.get_json(
            silent=True
        )


        if not body:

            return jsonify({

                "error":
                "저장할 데이터가 없습니다."

            }), 400


        inventory = body.get(
            "inventory",
            []
        )


        lookup = body.get(
            "lookup",
            []
        )


        if not inventory:

            return jsonify({

                "error":
                "재고조사 데이터가 없습니다."

            }), 400


        # =================================================
        # 시트1 컬럼 생성
        # =================================================

        output_rows = []


        for item in inventory:

            barcode = clean_text(
                item.get("바코드", "")
            )

            rack = clean_text(
                item.get("랙", "")
            )

            expiry = clean_text(
                item.get("소비기한", "")
            )

            qty = clean_number(
                item.get("수량", 0)
            )

            product_name = clean_text(
                item.get("상품명", "")
            )

            owner = clean_text(
                item.get("화주사", "")
            )


            output_rows.append({

                "바코드": barcode,

                "랙": rack,

                "소비기한": expiry,

                "수량": qty,

                "상품명": product_name,

                "화주사": owner

            })


        df_sheet1 = pd.DataFrame(
            output_rows,

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
        # 시트2
        # =================================================

        if lookup:

            df_sheet2 = pd.DataFrame(
                lookup,

                columns=[
                    "화주사",
                    "바코드",
                    "입수량",
                    "상품명"
                ]
            )

        else:

            df_sheet2 = pd.DataFrame(
                columns=[
                    "화주사",
                    "바코드",
                    "입수량",
                    "상품명"
                ]
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
        # Excel 저장
        # =================================================

        with pd.ExcelWriter(

            path,

            engine="openpyxl"

        ) as writer:


            # 시트1
            df_sheet1.to_excel(

                writer,

                index=False,

                sheet_name="시트1"

            )


            # 시트2
            df_sheet2.to_excel(

                writer,

                index=False,

                sheet_name="시트2"

            )


        return jsonify({

            "file_id": file_id

        })


    except Exception as e:

        print(
            "SAVE ERROR:",
            repr(e)
        )


        return jsonify({

            "error": str(e)

        }), 500


# =========================================================
# 엑셀 다운로드
# =========================================================

@app.route("/download/<file_id>")
def download(file_id):

    path = os.path.join(

        UPLOAD_FOLDER,

        f"{file_id}.xlsx"

    )


    if not os.path.exists(path):

        return "파일 없음", 404


    return send_file(

        path,

        download_name="재고조사.xlsx",

        as_attachment=True

    )


# =========================================================
# 공유 다운로드
# =========================================================

@app.route("/share/<file_id>")
def share_download(file_id):

    path = os.path.join(

        UPLOAD_FOLDER,

        f"{file_id}.xlsx"

    )


    if not os.path.exists(path):

        return "파일 없음", 404


    return send_file(

        path,

        download_name="재고조사.xlsx",

        as_attachment=True

    )


# =========================================================
# QR 생성
# =========================================================

@app.route("/qr/<file_id>")
def generate_qr(file_id):

    path = os.path.join(

        UPLOAD_FOLDER,

        f"{file_id}.xlsx"

    )


    if not os.path.exists(path):

        return "파일 없음", 404


    url = (

        request.host_url.rstrip("/")

        + "/share/"

        + file_id

    )


    qr = qrcode.make(url)


    img_io = BytesIO()


    qr.save(
        img_io,
        format="PNG"
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
        host="0.0.0.0",
        port=int(
            os.environ.get(
                "PORT",
                5000
            )
        ),
        debug=False
    )
