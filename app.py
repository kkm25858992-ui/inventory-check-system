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

        try:

            if (
                now -
                os.path.getmtime(file_path)
                >
                FILE_EXPIRE_TIME
            ):

                os.remove(file_path)

        except Exception:
            pass


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

    user_id = request.form.get(
        "id",
        ""
    )

    pw = request.form.get(
        "pw",
        ""
    )

    role = request.form.get(
        "role",
        ""
    )


    # 관리자

    if role == "admin":

        if (
            user_id in admins
            and
            admins[user_id] == pw
        ):

            session["login"] = True

            session["role"] = "admin"

            return redirect("/admin")


    # 사용자

    if role == "user":

        if (
            user_id in users
            and
            users[user_id] == pw
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
        mapping=[]
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

        if not filename.endswith(
            ".xlsx"
        ):
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
# 원본 엑셀 구조
#
# 시트1
#   기존 데이터가 있어도 사용하지 않음
#
# 시트2
#   A = 화주사
#   B = 바코드
#   C = 입수량
#   D = 상품명
#
# =========================================================

@app.route(
    "/upload",
    methods=["POST"]
)
def upload():

    try:

        # -------------------------------------------------
        # 파일 확인
        # -------------------------------------------------

        if "file" not in request.files:

            return (
                "업로드할 엑셀 파일이 없습니다.",
                400
            )


        file = request.files["file"]


        if not file.filename:

            return (
                "파일을 선택해주세요.",
                400
            )


        filename = secure_filename(
            file.filename.lower()
        )


        # -------------------------------------------------
        # CSV는 지원하지 않고 Excel 사용
        # -------------------------------------------------

        if not filename.endswith(
            (
                ".xlsx",
                ".xls"
            )
        ):

            return (
                "엑셀 파일(.xlsx 또는 .xls)을 업로드해주세요.",
                400
            )


        # -------------------------------------------------
        # 엑셀 전체 시트 읽기
        # -------------------------------------------------

        sheets = pd.read_excel(
            file,
            sheet_name=None,
            engine="openpyxl"
        )


        # -------------------------------------------------
        # 시트2 찾기
        # -------------------------------------------------

        if "시트2" not in sheets:

            return (
                "시트2가 없습니다.\n\n"
                "시트2에는 다음 구조가 필요합니다.\n"
                "A열 = 화주사\n"
                "B열 = 바코드\n"
                "C열 = 입수량\n"
                "D열 = 상품명",
                400
            )


        df_mapping = sheets["시트2"].copy()


        # -------------------------------------------------
        # 시트2 최소 열 확인
        # -------------------------------------------------

        if len(df_mapping.columns) < 4:

            return (
                "시트2의 열이 부족합니다.\n"
                "A=화주사 / B=바코드 / C=입수량 / D=상품명",
                400
            )


        # -------------------------------------------------
        # 실제 엑셀 헤더 이름과 관계없이
        # A~D를 기준으로 사용
        # -------------------------------------------------

        df_mapping = df_mapping.iloc[
            :,
            0:4
        ].copy()


        df_mapping.columns = [
            "화주사",
            "바코드",
            "입수량",
            "상품명"
        ]


        # -------------------------------------------------
        # 빈 행 제거
        # -------------------------------------------------

        df_mapping = df_mapping.dropna(
            how="all"
        )


        # -------------------------------------------------
        # 바코드 문자열 처리
        # -------------------------------------------------

        df_mapping["바코드"] = (
            df_mapping["바코드"]
            .fillna("")
            .astype(str)
            .str.strip()
        )


        # Excel에서 8801234567890.0
        # 형태로 들어오는 경우 처리
        df_mapping["바코드"] = (
            df_mapping["바코드"]
            .str.replace(
                r"\.0$",
                "",
                regex=True
            )
        )


        # -------------------------------------------------
        # 화주사
        # -------------------------------------------------

        df_mapping["화주사"] = (
            df_mapping["화주사"]
            .fillna("")
            .astype(str)
            .str.strip()
        )


        # -------------------------------------------------
        # 상품명
        # -------------------------------------------------

        df_mapping["상품명"] = (
            df_mapping["상품명"]
            .fillna("")
            .astype(str)
            .str.strip()
        )


        # -------------------------------------------------
        # 입수량
        # -------------------------------------------------

        df_mapping["입수량"] = (
            df_mapping["입수량"]
            .fillna(0)
            .astype(str)
            .str.replace(
                ",",
                "",
                regex=False
            )
        )


        df_mapping["입수량"] = pd.to_numeric(
            df_mapping["입수량"],
            errors="coerce"
        ).fillna(0)


        # -------------------------------------------------
        # 바코드가 없는 행 제거
        # -------------------------------------------------

        df_mapping = df_mapping[
            df_mapping["바코드"] != ""
        ]


        # -------------------------------------------------
        # JSON 변환 시 NaN 방지
        # -------------------------------------------------

        df_mapping = df_mapping.fillna("")


        # -------------------------------------------------
        # 시트1은 조사 데이터이므로
        # 업로드할 때는 비어있는 상태로 시작
        # -------------------------------------------------

        inventory_data = []


        mapping_data = (
            df_mapping
            .to_dict(
                orient="records"
            )
        )


        # -------------------------------------------------
        # 페이지 표시
        # -------------------------------------------------

        return render_template(

            "index.html",

            data=inventory_data,

            mapping=mapping_data

        )


    except Exception as e:

        print(
            "UPLOAD ERROR:",
            repr(e)
        )

        return (
            f"엑셀 업로드 오류: {str(e)}",
            500
        )


# =========================================================
# 재고조사 결과 저장
#
# 다운로드 Excel
#
# 시트1
# A = 바코드
# B = 랙
# C = 소비기한
# D = 수량
# E = 상품명
# F = 화주사
#
# 시트2
# A = 화주사
# B = 바코드
# C = 입수량
# D = 상품명
#
# =========================================================

@app.route(
    "/save",
    methods=["POST"]
)
def save():

    delete_old_files()


    try:

        request_data = request.get_json(
            silent=True
        )


        if not request_data:

            return jsonify({

                "error":
                    "저장할 데이터가 없습니다."

            }), 400


        # -------------------------------------------------
        # 재고조사 데이터
        # -------------------------------------------------

        inventory =
            request_data.get(
                "inventory",
                []
            )


        # -------------------------------------------------
        # 상품 매칭 데이터
        # -------------------------------------------------

        mapping =
            request_data.get(
                "mapping",
                []
            )


        if not inventory:

            return jsonify({

                "error":
                    "재고조사 데이터가 없습니다."

            }), 400


        # -------------------------------------------------
        # 시트1 생성
        # -------------------------------------------------

        result_rows = []


        for item in inventory:

            result_rows.append({

                "바코드":
                    item.get(
                        "바코드",
                        ""
                    ),

                "랙":
                    item.get(
                        "랙",
                        ""
                    ),

                "소비기한":
                    item.get(
                        "소비기한",
                        ""
                    ),

                "수량":
                    item.get(
                        "수량",
                        0
                    ),

                "상품명":
                    item.get(
                        "상품명",
                        ""
                    ),

                "화주사":
                    item.get(
                        "화주사",
                        ""
                    )

            })


        df_inventory = pd.DataFrame(
            result_rows,
            columns=[
                "바코드",
                "랙",
                "소비기한",
                "수량",
                "상품명",
                "화주사"
            ]
        )


        # -------------------------------------------------
        # 시트2 생성
        # -------------------------------------------------

        mapping_rows = []


        for item in mapping:

            mapping_rows.append({

                "화주사":
                    item.get(
                        "화주사",
                        ""
                    ),

                "바코드":
                    item.get(
                        "바코드",
                        ""
                    ),

                "입수량":
                    item.get(
                        "입수량",
                        0
                    ),

                "상품명":
                    item.get(
                        "상품명",
                        ""
                    )

            })


        df_mapping = pd.DataFrame(

            mapping_rows,

            columns=[
                "화주사",
                "바코드",
                "입수량",
                "상품명"
            ]

        )


        # -------------------------------------------------
        # 파일 ID
        # -------------------------------------------------

        file_id = str(
            uuid.uuid4()
        )


        path = os.path.join(

            UPLOAD_FOLDER,

            f"{file_id}.xlsx"

        )


        # -------------------------------------------------
        # Excel 저장
        # -------------------------------------------------

        with pd.ExcelWriter(

            path,

            engine="openpyxl"

        ) as writer:


            # 시트1

            df_inventory.to_excel(

                writer,

                index=False,

                sheet_name="시트1"

            )


            # 시트2
            # 원본 그대로 유지

            df_mapping.to_excel(

                writer,

                index=False,

                sheet_name="시트2"

            )


        # -------------------------------------------------
        # 저장 성공
        # -------------------------------------------------

        return jsonify({

            "file_id":
                file_id

        })


    except Exception as e:

        print(
            "SAVE ERROR:",
            repr(e)
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

        return (
            "파일 없음",
            404
        )


    return send_file(

        path,

        download_name="재고조사.xlsx",

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

        return (
            "파일 없음",
            404
        )


    return send_file(

        path,

        download_name="재고조사.xlsx",

        as_attachment=True

    )


# =========================================================
# QR 생성
# =========================================================

@app.route(
    "/qr/<file_id>"
)
def generate_qr(file_id):

    url = (
        request.host_url.rstrip("/")
        +
        "/share/"
        +
        file_id
    )


    qr = qrcode.make(url)


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
        host="0.0.0.0",
        port=int(
            os.environ.get(
                "PORT",
                5000
            )
        ),
        debug=True
    )
