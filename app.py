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
# 임시 매칭 데이터
#
# 업로드한 엑셀의 시트2 데이터를
# 세션별로 보관하기 위한 구조
# =========================================================

mapping_storage = {}


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

                os.remove(
                    file_path
                )

        except Exception:

            pass


# =========================================================
# 숫자 변환
# =========================================================

def clean_number(value):

    if (
        value is None
        or pd.isna(value)
        or value == ""
    ):

        return 0

    try:

        value = str(value).replace(
            ",",
            ""
        ).strip()

        return float(value)

    except Exception:

        return 0


# =========================================================
# 문자열 변환
# =========================================================

def clean_string(value):

    if (
        value is None
        or pd.isna(value)
    ):

        return ""

    value = str(value).strip()

    # Excel에서 바코드가 숫자로 읽혀
    # 123456789.0 형태가 되는 경우
    if value.endswith(".0"):

        try:

            number = float(value)

            if number.is_integer():

                value = str(
                    int(number)
                )

        except Exception:

            pass

    return value


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
        "id"
    )

    pw = request.form.get(
        "pw"
    )

    role = request.form.get(
        "role"
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

            return redirect(
                "/admin"
            )


    # 사용자
    elif role == "user":

        if (
            user_id in users
            and
            users[user_id] == pw
        ):

            session["login"] = True

            session["role"] = "user"

            return redirect(
                "/"
            )


    return "로그인 실패"


# =========================================================
# 사용자 페이지
# =========================================================

@app.route("/")
def index():

    if not session.get(
        "login"
    ):

        return redirect(
            "/login"
        )


    if (
        session.get("role")
        !=
        "user"
    ):

        return redirect(
            "/login"
        )


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

    if not session.get(
        "login"
    ):

        return redirect(
            "/login"
        )


    if (
        session.get("role")
        !=
        "admin"
    ):

        return redirect(
            "/login"
        )


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


    files = sorted(
        files,
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
# 업로드 엑셀 구조
#
# 시트1
# → 기존 데이터가 있더라도 실제 조사에서는 사용하지 않음
#
# 시트2
# A열 화주사
# B열 바코드
# C열 입수량
# D열 상품명
#
# 시트2를 매칭 데이터로 사용
# =========================================================

@app.route(
    "/upload",
    methods=["POST"]
)
def upload():

    try:

        if "file" not in request.files:

            return (
                "업로드 파일이 없습니다.",
                400
            )


        file = request.files[
            "file"
        ]


        if not file.filename:

            return (
                "파일을 선택해주세요.",
                400
            )


        filename = secure_filename(
            file.filename.lower()
        )


        # =================================================
        # CSV 처리
        # =================================================

        if filename.endswith(
            ".csv"
        ):

            df = pd.read_csv(
                file
            )


            # CSV는 기존 구조 호환
            required_cols = [
                "로케이션",
                "상품명",
                "재고수량"
            ]


            for col in required_cols:

                if col not in df.columns:

                    return (
                        f"{col} 없음",
                        400
                    )


            return render_template(
                "index.html",
                data=df.to_dict(
                    orient="records"
                ),
                mapping=[]
            )


        # =================================================
        # Excel
        # =================================================

        excel = pd.ExcelFile(
            file,
            engine="openpyxl"
        )


        sheet_names = (
            excel.sheet_names
        )


        # =================================================
        # 시트1
        # =================================================

        if len(sheet_names) >= 1:

            source_sheet1 = pd.read_excel(
                excel,
                sheet_name=sheet_names[0]
            )

        else:

            source_sheet1 = pd.DataFrame()


        # =================================================
        # 시트2
        # =================================================

        if len(sheet_names) >= 2:

            source_sheet2 = pd.read_excel(
                excel,
                sheet_name=sheet_names[1]
            )

        else:

            source_sheet2 = pd.DataFrame()


        # =================================================
        # 시트2 컬럼 처리
        #
        # 원하는 구조
        #
        # A = 화주사
        # B = 바코드
        # C = 입수량
        # D = 상품명
        #
        # 헤더가 정확하지 않은 경우에도
        # 위치 기준으로 읽을 수 있도록 처리
        # =================================================

        mapping_df = pd.DataFrame()


        if not source_sheet2.empty:

            mapping_df = source_sheet2.copy()


            # 컬럼명이 정확한 경우
            if all(
                col in mapping_df.columns
                for col in [
                    "화주사",
                    "바코드",
                    "입수량",
                    "상품명"
                ]
            ):

                mapping_df = mapping_df[
                    [
                        "화주사",
                        "바코드",
                        "입수량",
                        "상품명"
                    ]
                ].copy()


            # 컬럼명이 없는 경우
            else:

                if len(
                    mapping_df.columns
                ) >= 4:

                    mapping_df = mapping_df.iloc[
                        :,
                        :4
                    ].copy()

                    mapping_df.columns = [
                        "화주사",
                        "바코드",
                        "입수량",
                        "상품명"
                    ]

                else:

                    mapping_df = pd.DataFrame(
                        columns=[
                            "화주사",
                            "바코드",
                            "입수량",
                            "상품명"
                        ]
                    )


        # =================================================
        # 시트2 데이터 정리
        # =================================================

        if not mapping_df.empty:

            mapping_df["화주사"] = (
                mapping_df["화주사"]
                .apply(clean_string)
            )


            mapping_df["바코드"] = (
                mapping_df["바코드"]
                .apply(clean_string)
            )


            mapping_df["입수량"] = (
                mapping_df["입수량"]
                .apply(clean_number)
            )


            mapping_df["상품명"] = (
                mapping_df["상품명"]
                .apply(clean_string)
            )


        # =================================================
        # 매칭 데이터 JSON
        # =================================================

        mapping_data = (
            mapping_df.to_dict(
                orient="records"
            )
        )


        # =================================================
        # 세션에 매칭 데이터 저장
        # =================================================

        session_id = str(
            uuid.uuid4()
        )


        mapping_storage[
            session_id
        ] = mapping_data


        session[
            "mapping_id"
        ] = session_id


        # =================================================
        # 기존 시트1 데이터는 사용하지 않음
        #
        # 재고조사 시작 시 빈 배열로 시작
        # =================================================

        inventory_data = []


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
# 저장
#
# JS에서
#
# {
#     inventory: data,
#     mapping: mappingData
# }
#
# 형태로 전달
# =========================================================

@app.route(
    "/save",
    methods=["POST"]
)
def save():

    delete_old_files()


    try:

        request_data = (
            request.get_json(
                silent=True
            )
        )


        if not request_data:

            return jsonify({

                "error":
                    "저장 데이터가 없습니다."

            }), 400


        # =================================================
        # 재고조사 데이터
        # =================================================

        inventory_data = (
            request_data.get(
                "inventory",
                []
            )
        )


        # =================================================
        # 매칭 데이터
        # =================================================

        mapping_data = (
            request_data.get(
                "mapping",
                []
            )
        )


        if not isinstance(
            inventory_data,
            list
        ):

            return jsonify({

                "error":
                    "inventory 형식 오류"

            }), 400


        if not isinstance(
            mapping_data,
            list
        ):

            mapping_data = []


        if len(
            inventory_data
        ) == 0:

            return jsonify({

                "error":
                    "재고조사 데이터가 없습니다."

            }), 400


        # =================================================
        # DataFrame 생성
        # =================================================

        df_inventory = pd.DataFrame(
            inventory_data
        )


        df_mapping = pd.DataFrame(
            mapping_data
        )


        # =================================================
        # 필요한 컬럼 보장
        # =================================================

        required_inventory_columns = [
            "바코드",
            "랙",
            "소비기한",
            "수량",
            "상품명",
            "화주사"
        ]


        for col in required_inventory_columns:

            if col not in df_inventory.columns:

                df_inventory[col] = ""


        # =================================================
        # 데이터 정리
        # =================================================

        df_inventory["바코드"] = (
            df_inventory["바코드"]
            .apply(clean_string)
        )


        df_inventory["랙"] = (
            df_inventory["랙"]
            .apply(clean_string)
        )


        df_inventory["소비기한"] = (
            df_inventory["소비기한"]
            .apply(clean_string)
        )


        df_inventory["수량"] = (
            df_inventory["수량"]
            .apply(clean_number)
        )


        df_inventory["상품명"] = (
            df_inventory["상품명"]
            .apply(clean_string)
        )


        df_inventory["화주사"] = (
            df_inventory["화주사"]
            .apply(clean_string)
        )


        # =================================================
        # 매칭 데이터가 있으면 다시 한번 매칭
        #
        # 제품 바코드
        # →
        # 화주사
        # 입수량
        # 상품명
        # =================================================

        mapping_dict = {}


        if not df_mapping.empty:

            for col in [
                "화주사",
                "바코드",
                "입수량",
                "상품명"
            ]:

                if col not in df_mapping.columns:

                    df_mapping[col] = ""


            for _, row in df_mapping.iterrows():

                barcode = clean_string(
                    row["바코드"]
                )


                if not barcode:
                    continue


                mapping_dict[
                    barcode
                ] = {

                    "화주사":
                        clean_string(
                            row["화주사"]
                        ),

                    "입수량":
                        clean_number(
                            row["입수량"]
                        ),

                    "상품명":
                        clean_string(
                            row["상품명"]
                        )

                }


        # =================================================
        # 최종 상품명 / 화주사 자동 매칭
        # =================================================

        for index, row in df_inventory.iterrows():

            barcode = clean_string(
                row["바코드"]
            )


            if barcode in mapping_dict:

                matched = mapping_dict[
                    barcode
                ]


                df_inventory.at[
                    index,
                    "상품명"
                ] = matched[
                    "상품명"
                ]


                df_inventory.at[
                    index,
                    "화주사"
                ] = matched[
                    "화주사"
                ]


        # =================================================
        # 시트1 컬럼 순서
        #
        # A 바코드
        # B 랙
        # C 소비기한
        # D 수량
        # E 상품명
        # F 화주사
        # =================================================

        sheet1 = df_inventory[
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

            # -------------------------------
            # 시트1
            # -------------------------------

            sheet1.to_excel(
                writer,
                index=False,
                sheet_name="시트1"
            )


            # -------------------------------
            # 시트2
            #
            # 원본 매칭 데이터 그대로 유지
            # -------------------------------

            if not df_mapping.empty:

                sheet2 = df_mapping[
                    [
                        "화주사",
                        "바코드",
                        "입수량",
                        "상품명"
                    ]
                ].copy()

            else:

                sheet2 = pd.DataFrame(
                    columns=[
                        "화주사",
                        "바코드",
                        "입수량",
                        "상품명"
                    ]
                )


            sheet2.to_excel(
                writer,
                index=False,
                sheet_name="시트2"
            )


        # =================================================
        # 결과
        # =================================================

        return jsonify({

            "file_id":
                file_id,

            "count":
                len(sheet1)

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


    if not os.path.exists(
        path
    ):

        return (
            "파일 없음",
            404
        )


    return send_file(

        path,

        download_name=
            "inventory.xlsx",

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


    if not os.path.exists(
        path
    ):

        return (
            "파일 없음",
            404
        )


    return send_file(

        path,

        download_name=
            "inventory.xlsx",

        as_attachment=True

    )


# =========================================================
# QR 생성
# =========================================================

@app.route(
    "/qr/<file_id>"
)
def generate_qr(file_id):

    path = os.path.join(
        UPLOAD_FOLDER,
        f"{file_id}.xlsx"
    )


    if not os.path.exists(
        path
    ):

        return (
            "파일 없음",
            404
        )


    url = (
        request.host_url.rstrip("/")
        +
        "/share/"
        +
        file_id
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

        mimetype=
            "image/png"

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


    if os.path.exists(
        path
    ):

        os.remove(
            path
        )

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
